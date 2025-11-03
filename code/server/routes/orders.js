const express = require('express');
const { Order, Payment, Owner, Employee } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { Op } = require('sequelize');

const router = express.Router();

// Helper to get ownerId from request
const getOwnerId = (req) => {
    // ONLY use ownerId from cognitoSync middleware - it's the PostgreSQL UUID
    if (req.user?.ownerId) {
        return req.user.ownerId;
    }
    console.warn('⚠️ ownerId not set - cognitoSync middleware may have failed');
    return null;
};

// Create a new order
router.post('/', authenticateToken, async (req, res) => {
    try {
        const {
            items,
            orderType,
            tableNumber,
            customerName,
            total,
            status = 'pending'
        } = req.body;

        const ownerId = getOwnerId(req);
        const employeeId = req.user.sub;
        const orderNumber = `ORD-${Date.now().toString().slice(-6)}`;

        // Validate required fields
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Items are required'
            });
        }

        if (!orderType) {
            return res.status(400).json({
                success: false,
                error: 'Order type is required'
            });
        }

        // Normalize orderType: frontend uses 'to-go', backend accepts both 'to-go' and 'takeout'
        const normalizedOrderType = orderType === 'to-go' ? 'takeout' : orderType;

        const totalAmount = parseFloat(total) || 0;
        const tax = totalAmount * 0.08; // 8% tax
        const finalTotal = totalAmount * 1.08;

        // Create order
        const order = await Order.create({
            orderNumber,
            ownerId,
            employeeId,
            orderDate: new Date(),
            items,
            orderType: normalizedOrderType,
            tableNumber: normalizedOrderType === 'dine-in' ? tableNumber : null,
            customerName: (normalizedOrderType === 'delivery' || normalizedOrderType === 'pickup') ? customerName : null,
            totalAmount,
            tax,
            finalTotal,
            status
        });

        console.log('✅ Order created:', {
            orderId: order.id,
            orderNumber,
            ownerId,
            orderType,
            total: order.finalTotal
        });

        res.status(201).json({
            success: true,
            data: order,
            message: 'Order created successfully'
        });

    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create order',
            message: error.message
        });
    }
});

// Get all orders for a business
router.get('/', authenticateToken, async (req, res) => {
    try {
        const ownerId = getOwnerId(req);
        const { status, limit = 50, offset = 0 } = req.query;

        const where = { ownerId };

        if (status && status !== 'all') {
            where.status = status;
        }

        const orders = await Order.findAll({
            where,
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['orderDate', 'DESC']],
            include: [
                { model: Employee, as: 'employee', attributes: ['id', 'firstName', 'lastName', 'email'] },
                { model: Payment, as: 'payments', attributes: ['id', 'amount', 'method', 'status', 'transactionId', 'paymentDate', 'createdAt'] }
            ]
        });

        res.json({
            success: true,
            data: orders,
            count: orders.length
        });

    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch orders',
            message: error.message
        });
    }
});

// Get a specific order
router.get('/:orderId', authenticateToken, async (req, res) => {
    try {
        const { orderId } = req.params;
        const ownerId = getOwnerId(req);

        const order = await Order.findOne({
            where: {
                id: orderId,
                ownerId: ownerId
            },
            include: [
                { model: Employee, as: 'employee', attributes: ['id', 'firstName', 'lastName', 'email'] },
                { model: Payment, as: 'payments' }
            ]
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                error: 'Order not found'
            });
        }

        res.json({
            success: true,
            data: order
        });

    } catch (error) {
        console.error('Error fetching order:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch order',
            message: error.message
        });
    }
});

// Update order status
router.patch('/:orderId/status', authenticateToken, async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body;
        const ownerId = getOwnerId(req);

        const validStatuses = ['pending', 'preparing', 'ready', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid status',
                message: `Status must be one of: ${validStatuses.join(', ')}`
            });
        }

        const order = await Order.findOne({
            where: {
                id: orderId,
                ownerId: ownerId
            }
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                error: 'Order not found'
            });
        }

        order.status = status;
        await order.save();

        console.log('✅ Order status updated:', {
            orderId,
            status,
            ownerId
        });

        res.json({
            success: true,
            data: order,
            message: 'Order status updated successfully'
        });

    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update order status',
            message: error.message
        });
    }
});

// Update order details
router.put('/:orderId', authenticateToken, async (req, res) => {
    try {
        const { orderId } = req.params;
        const ownerId = getOwnerId(req);
        const updates = req.body;

        // Remove fields that shouldn't be updated
        delete updates.id;
        delete updates.ownerId;
        delete updates.createdAt;

        const order = await Order.findOne({
            where: {
                id: orderId,
                ownerId: ownerId
            }
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                error: 'Order not found'
            });
        }

        await order.update(updates);

        console.log('✅ Order updated:', {
            orderId,
            ownerId,
            updates: Object.keys(updates)
        });

        res.json({
            success: true,
            data: order,
            message: 'Order updated successfully'
        });

    } catch (error) {
        console.error('Error updating order:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update order',
            message: error.message
        });
    }
});

// Delete an order
router.delete('/:orderId', authenticateToken, async (req, res) => {
    try {
        const { orderId } = req.params;
        const ownerId = getOwnerId(req);

        const order = await Order.findOne({
            where: {
                id: orderId,
                ownerId: ownerId
            }
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                error: 'Order not found'
            });
        }

        await order.destroy();

        console.log('✅ Order deleted:', {
            orderId,
            ownerId
        });

        res.json({
            success: true,
            message: 'Order deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting order:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete order',
            message: error.message
        });
    }
});

// Get order statistics
router.get('/stats/overview', authenticateToken, async (req, res) => {
    try {
        const ownerId = getOwnerId(req);
        const { period = 'today' } = req.query;

        // Calculate date range based on period
        let startDate, endDate;
        const now = new Date();

        switch (period) {
            case 'today':
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
                break;
            case 'week':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                endDate = now;
                break;
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                endDate = now;
                break;
            default:
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
        }

        const orders = await Order.findAll({
            where: {
                ownerId: ownerId,
                orderDate: {
                    [Op.between]: [startDate, endDate]
                }
            }
        });

        // Calculate statistics
        const stats = {
            totalOrders: orders.length,
            totalRevenue: orders.reduce((sum, order) => sum + parseFloat(order.finalTotal || 0), 0),
            averageOrderValue: orders.length > 0 ?
                orders.reduce((sum, order) => sum + parseFloat(order.finalTotal || 0), 0) / orders.length : 0,
            ordersByStatus: {},
            ordersByType: {},
            topItems: {}
        };

        // Count by status and type
        orders.forEach(order => {
            stats.ordersByStatus[order.status] = (stats.ordersByStatus[order.status] || 0) + 1;
            stats.ordersByType[order.orderType] = (stats.ordersByType[order.orderType] || 0) + 1;

            // Count items
            if (order.items && Array.isArray(order.items)) {
                order.items.forEach(item => {
                    const itemName = item.name || 'Unknown';
                    stats.topItems[itemName] = (stats.topItems[itemName] || 0) + (item.quantity || 1);
                });
            }
        });

        res.json({
            success: true,
            data: stats
        });

    } catch (error) {
        console.error('Error fetching order stats:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch order statistics',
            message: error.message
        });
    }
});

// Create payment for an order
router.post('/:orderId/payment', authenticateToken, async (req, res) => {
    try {
        const { orderId } = req.params;
        const { method, amount } = req.body;
        const ownerId = getOwnerId(req);

        // Validate payment method
        const validMethods = ['cash', 'card', 'online', 'digital_wallet'];
        if (!validMethods.includes(method)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid payment method',
                message: `Method must be one of: ${validMethods.join(', ')}`
            });
        }

        // Find order
        const order = await Order.findOne({
            where: {
                id: orderId,
                ownerId: ownerId
            }
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                error: 'Order not found'
            });
        }

        // Create payment
        const payment = await Payment.create({
            orderId: order.id,
            amount: parseFloat(amount || order.finalTotal),
            method: method,
            status: 'completed',
            transactionId: `TXN-${Date.now().toString().slice(-8)}`
        });

        // Update order status to completed
        order.status = 'completed';
        await order.save();

        console.log('✅ Payment processed:', {
            paymentId: payment.id,
            orderId: order.id,
            amount: payment.amount,
            method: payment.method
        });

        res.status(201).json({
            success: true,
            data: {
                payment,
                order
            },
            message: 'Payment processed successfully'
        });

    } catch (error) {
        console.error('Error processing payment:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to process payment',
            message: error.message
        });
    }
});

module.exports = router;
