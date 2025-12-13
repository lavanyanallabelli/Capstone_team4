const express = require('express');
const { Order, Payment, Owner, Employee } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { Op } = require('sequelize');
const { sendRefundNotification } = require('../services/emailService');

const router = express.Router();

// Helper to get ownerId from request
const getOwnerId = async (req) => {
    // ONLY use ownerId from cognitoSync middleware - it's the PostgreSQL UUID
    if (req.user?.ownerId) {
        return req.user.ownerId;
    }

    // If ownerId is not set, try to get it from the Owner table using email
    // This is a fallback in case cognitoSync middleware failed
    if (req.user?.email) {
        console.log('⚠️ ownerId not set, attempting fallback lookup by email:', req.user.email);
        try {
            const { Owner } = require('../models');
            const owner = await Owner.findOne({
                where: { email: req.user.email }
            });
            if (owner && owner.id) {
                console.log('✅ Fallback: Found ownerId by email:', owner.id);
                req.user.ownerId = owner.id; // Set it for future use
                return owner.id;
            } else {
                console.warn('⚠️ Fallback: No Owner record found for email:', req.user.email);
            }
        } catch (error) {
            console.error('❌ Fallback ownerId lookup failed:', error.message);
        }
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
            customerPhone,
            total,
            discountAmount = 0,
            serviceCharge = 0,
            tax,
            tip = 0,
            finalTotal,
            status = 'pending'
        } = req.body;

        const ownerId = await getOwnerId(req);
        const employeeId = req.user.sub;
        const orderNumber = `ORD-${Date.now().toString().slice(-6)}`;

        console.log('📝 Creating order - Owner/Employee details:', {
            ownerId: ownerId,
            ownerIdType: typeof ownerId,
            employeeId: employeeId,
            employeeIdType: typeof employeeId,
            reqUser: req.user ? {
                email: req.user.email,
                sub: req.user.sub,
                userRole: req.user.userRole,
                hasOwnerId: !!req.user.ownerId,
                ownerIdFromReq: req.user.ownerId
            } : 'No req.user'
        });

        if (!ownerId) {
            console.error('❌ Cannot create order: ownerId is null');
            return res.status(400).json({
                success: false,
                error: 'Owner ID is required',
                message: 'Unable to identify business owner. Please try logging out and back in.'
            });
        }

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
        const discount = parseFloat(discountAmount) || 0;
        const serviceChargeAmount = parseFloat(serviceCharge) || 0;
        const taxAmount = parseFloat(tax) || (totalAmount * 0.08); // Use provided tax or default 8%
        const tipAmount = parseFloat(tip) || 0;
        const calculatedFinalTotal = parseFloat(finalTotal) || (
            totalAmount - discount + serviceChargeAmount + taxAmount + tipAmount
        );

        // Create order
        const order = await Order.create({
            orderNumber,
            ownerId,
            employeeId,
            orderDate: new Date(),
            items,
            orderType: normalizedOrderType,
            tableNumber: normalizedOrderType === 'dine-in' ? tableNumber : null,
            customerName: (normalizedOrderType === 'online-order' || normalizedOrderType === 'delivery' || normalizedOrderType === 'pickup' || normalizedOrderType === 'to-go') ? customerName : null,
            totalAmount,
            discountAmount: discount,
            serviceCharge: serviceChargeAmount,
            tax: taxAmount,
            tip: tipAmount,
            finalTotal: calculatedFinalTotal,
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
        const ownerId = await getOwnerId(req);
        const { status, limit = 50, offset = 0 } = req.query;

        console.log('📊 GET /orders - Request details:', {
            ownerId: ownerId,
            ownerIdType: typeof ownerId,
            status: status,
            limit: limit,
            reqUser: req.user ? {
                email: req.user.email,
                sub: req.user.sub,
                hasOwnerId: !!req.user.ownerId
            } : 'No req.user'
        });

        if (!ownerId) {
            console.error('❌ No ownerId found in request');
            return res.status(400).json({
                success: false,
                error: 'Owner ID is required',
                message: 'Unable to identify business owner. Please try logging out and back in.'
            });
        }

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
                { model: Payment, as: 'payments', attributes: ['id', 'amount', 'method', 'status', 'transactionId', 'createdAt'] }
            ]
        });

        // Debug: Check if there are orders with different ownerIds
        const allOrdersSample = await Order.findAll({
            limit: 10,
            attributes: ['id', 'orderNumber', 'ownerId', 'orderDate', 'status'],
            order: [['orderDate', 'DESC']]
        });

        console.log('📊 GET /orders - Query result:', {
            ownerId: ownerId,
            ordersFound: orders.length,
            orderIds: orders.map(o => o.id).slice(0, 5),
            orderNumbers: orders.map(o => o.orderNumber).slice(0, 5),
            sampleAllOrders: allOrdersSample.map(o => ({
                orderNumber: o.orderNumber,
                ownerId: o.ownerId,
                matches: o.ownerId === ownerId
            }))
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
        const ownerId = await getOwnerId(req);

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
        const ownerId = await getOwnerId(req);

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
        const ownerId = await getOwnerId(req);
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
        const ownerId = await getOwnerId(req);

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
        const ownerId = await getOwnerId(req);
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
        const ownerId = await getOwnerId(req);

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

// Refund a payment
router.patch('/:orderId/payment/:paymentId/refund', authenticateToken, async (req, res) => {
    try {
        const { orderId, paymentId } = req.params;
        const { amount, reason } = req.body;
        const ownerId = await getOwnerId(req);

        // Find order
        const order = await Order.findOne({
            where: {
                id: orderId,
                ownerId: ownerId
            },
            include: [{ model: Payment, as: 'payments' }]
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                error: 'Order not found'
            });
        }

        // Find payment
        const payment = await Payment.findOne({
            where: {
                id: paymentId,
                orderId: orderId
            }
        });

        if (!payment) {
            return res.status(404).json({
                success: false,
                error: 'Payment not found'
            });
        }

        if (payment.status !== 'completed') {
            return res.status(400).json({
                success: false,
                error: 'Invalid payment status',
                message: 'Only completed payments can be refunded'
            });
        }

        const refundAmount = parseFloat(amount || payment.amount);
        if (refundAmount > parseFloat(payment.amount)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid refund amount',
                message: 'Refund amount cannot exceed payment amount'
            });
        }

        // Update payment status to refunded
        payment.status = 'refunded';
        await payment.save();

        // Optionally update order status to cancelled
        if (refundAmount >= parseFloat(payment.amount)) {
            order.status = 'cancelled';
            await order.save();
        }

        // Check if user is a manager (not owner) and send email notification to owner
        // Note: req.user.role is logged in auth middleware, but userRole is the actual field
        let userRole = req.user?.userRole || req.user?.role || req.user?.['custom:userRole'] || 'employee';
        // console.log('🔍 Refund processed by user role (from token):', userRole);
        // console.log('🔍 req.user.userRole:', req.user?.userRole);
        // console.log('🔍 req.user.role:', req.user?.role);
        // console.log('🔍 req.user.email:', req.user?.email);

        // Double-check role from database if available
        if (req.user?.email && userRole !== 'owner') {
            try {
                const employee = await Employee.findOne({
                    where: {
                        email: req.user.email,
                        ownerId: ownerId
                    },
                    attributes: ['role']
                });
                if (employee && employee.role) {
                    //   console.log('🔍 Employee role from database:', employee.role);
                    userRole = employee.role;
                }
            } catch (dbError) {
                console.warn('⚠️ Could not check employee role in database:', dbError.message);
            }
        }

        if (userRole === 'manager') {
            console.log('📧 Manager detected - preparing to send email notification to owner');
            try {
                // Get owner information
                const owner = await Owner.findOne({
                    where: { id: ownerId }
                });

                if (!owner) {
                    console.error('⚠️ Owner not found for ownerId:', ownerId);
                } else if (!owner.email) {
                    console.error('⚠️ Owner email not found for owner:', owner.id);
                } else {
                    console.log('✅ Owner found, email:', owner.email);

                    // Get manager information
                    let managerName = 'Manager';
                    if (req.user?.email) {
                        // Try to find manager by email
                        const manager = await Employee.findOne({
                            where: {
                                ownerId: ownerId,
                                email: req.user.email
                            }
                        });
                        if (manager) {
                            managerName = `${manager.firstName || ''} ${manager.lastName || ''}`.trim() || manager.email || 'Manager';
                            console.log('✅ Manager found:', managerName);
                        } else {
                            // Fallback to email if employee not found
                            managerName = req.user.email;
                            console.log('⚠️ Manager not found in database, using email:', managerName);
                        }
                    }

                    // Send email notification to owner
                    const refundData = {
                        orderNumber: order.orderNumber,
                        refundAmount: refundAmount,
                        reason: reason || 'No reason provided',
                        managerName: managerName,
                        orderDate: order.orderDate || order.createdAt,
                        paymentMethod: payment.method || 'N/A'
                    };

                    console.log('📧 Attempting to send refund notification email...');
                    console.log('📧 Email details:', {
                        to: owner.email,
                        ownerName: owner.name || owner.businessName,
                        businessName: owner.businessName || 'POS System',
                        refundData
                    });

                    await sendRefundNotification(
                        owner.email,
                        owner.name || owner.businessName,
                        owner.businessName || 'POS System',
                        refundData
                    );
                    console.log('✅ Refund notification email sent successfully to owner:', owner.email);
                }
            } catch (emailError) {
                // Log error but don't fail the refund
                console.error('❌ Failed to send refund notification email:');
                console.error('   Error message:', emailError.message);
                console.error('   Error stack:', emailError.stack);
            }
        } else {
            console.log('ℹ️ User is not a manager (role:', userRole, '), skipping email notification');
        }

        console.log('✅ Payment refunded:', {
            paymentId,
            orderId,
            refundAmount,
            reason,
            processedBy: userRole
        });

        res.json({
            success: true,
            data: {
                payment,
                order
            },
            message: 'Refund processed successfully'
        });

    } catch (error) {
        console.error('Error processing refund:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to process refund',
            message: error.message
        });
    }
});

module.exports = router;
