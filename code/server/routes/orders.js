const express = require('express');
const { docClient } = require('../config/dynamodb');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

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

        const businessId = req.user.businessId;
        const employeeId = req.user.sub;
        const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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

        // Create order object
        const order = {
            id: orderId,
            orderNumber,
            businessId,
            employeeId,
            employeeEmail: req.user.email,
            items,
            orderType,
            tableNumber: orderType === 'dine-in' ? tableNumber : null,
            customerName: (orderType === 'delivery' || orderType === 'pickup') ? customerName : null,
            total: parseFloat(total) || 0,
            tax: parseFloat(total) * 0.08 || 0, // 8% tax
            finalTotal: parseFloat(total) * 1.08 || 0,
            status,
            timestamp: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // Save to DynamoDB
        const params = {
            TableName: 'pos-orders',
            Item: order
        };

        await docClient.put(params).promise();

        console.log('✅ Order created:', {
            orderId,
            orderNumber,
            businessId,
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
        const businessId = req.user.businessId;
        const { status, limit = 50, startKey } = req.query;

        let params = {
            TableName: 'pos-orders',
            IndexName: 'businessId-timestamp-index',
            KeyConditionExpression: 'businessId = :businessId',
            ExpressionAttributeValues: {
                ':businessId': businessId
            },
            ScanIndexForward: false, // Most recent first
            Limit: parseInt(limit)
        };

        // Filter by status if provided
        if (status && status !== 'all') {
            params.FilterExpression = '#status = :status';
            params.ExpressionAttributeNames = {
                '#status': 'status'
            };
            params.ExpressionAttributeValues[':status'] = status;
        }

        // Pagination
        if (startKey) {
            params.ExclusiveStartKey = JSON.parse(startKey);
        }

        const result = await docClient.query(params).promise();

        res.json({
            success: true,
            data: result.Items,
            lastEvaluatedKey: result.LastEvaluatedKey
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
        const businessId = req.user.businessId;

        const params = {
            TableName: 'pos-orders',
            Key: {
                id: orderId,
                businessId: businessId
            }
        };

        const result = await docClient.get(params).promise();

        if (!result.Item) {
            return res.status(404).json({
                success: false,
                error: 'Order not found'
            });
        }

        res.json({
            success: true,
            data: result.Item
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
        const businessId = req.user.businessId;

        const validStatuses = ['pending', 'preparing', 'ready', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid status',
                message: `Status must be one of: ${validStatuses.join(', ')}`
            });
        }

        const params = {
            TableName: 'pos-orders',
            Key: {
                id: orderId,
                businessId: businessId
            },
            UpdateExpression: 'SET #status = :status, updatedAt = :updatedAt',
            ExpressionAttributeNames: {
                '#status': 'status'
            },
            ExpressionAttributeValues: {
                ':status': status,
                ':updatedAt': new Date().toISOString()
            },
            ReturnValues: 'ALL_NEW'
        };

        const result = await docClient.update(params).promise();

        console.log('✅ Order status updated:', {
            orderId,
            status,
            businessId
        });

        res.json({
            success: true,
            data: result.Attributes,
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
        const businessId = req.user.businessId;
        const updates = req.body;

        // Remove fields that shouldn't be updated
        delete updates.id;
        delete updates.businessId;
        delete updates.createdAt;

        // Build update expression
        const updateExpressions = [];
        const expressionAttributeNames = {};
        const expressionAttributeValues = {};

        Object.keys(updates).forEach((key, index) => {
            updateExpressions.push(`#${key} = :val${index}`);
            expressionAttributeNames[`#${key}`] = key;
            expressionAttributeValues[`:val${index}`] = updates[key];
        });

        updateExpressions.push('updatedAt = :updatedAt');
        expressionAttributeValues[':updatedAt'] = new Date().toISOString();

        const params = {
            TableName: 'pos-orders',
            Key: {
                id: orderId,
                businessId: businessId
            },
            UpdateExpression: `SET ${updateExpressions.join(', ')}`,
            ExpressionAttributeNames: expressionAttributeNames,
            ExpressionAttributeValues: expressionAttributeValues,
            ReturnValues: 'ALL_NEW'
        };

        const result = await docClient.update(params).promise();

        console.log('✅ Order updated:', {
            orderId,
            businessId,
            updates: Object.keys(updates)
        });

        res.json({
            success: true,
            data: result.Attributes,
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
        const businessId = req.user.businessId;

        const params = {
            TableName: 'pos-orders',
            Key: {
                id: orderId,
                businessId: businessId
            }
        };

        await docClient.delete(params).promise();

        console.log('✅ Order deleted:', {
            orderId,
            businessId
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
        const businessId = req.user.businessId;
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

        const params = {
            TableName: 'pos-orders',
            IndexName: 'businessId-timestamp-index',
            KeyConditionExpression: 'businessId = :businessId AND #timestamp BETWEEN :startDate AND :endDate',
            ExpressionAttributeNames: {
                '#timestamp': 'timestamp'
            },
            ExpressionAttributeValues: {
                ':businessId': businessId,
                ':startDate': startDate.toISOString(),
                ':endDate': endDate.toISOString()
            }
        };

        const result = await docClient.query(params).promise();
        const orders = result.Items;

        // Calculate statistics
        const stats = {
            totalOrders: orders.length,
            totalRevenue: orders.reduce((sum, order) => sum + (order.finalTotal || 0), 0),
            averageOrderValue: orders.length > 0 ?
                orders.reduce((sum, order) => sum + (order.finalTotal || 0), 0) / orders.length : 0,
            ordersByStatus: {},
            ordersByType: {},
            topItems: {}
        };

        // Count by status
        orders.forEach(order => {
            stats.ordersByStatus[order.status] = (stats.ordersByStatus[order.status] || 0) + 1;
            stats.ordersByType[order.orderType] = (stats.ordersByType[order.orderType] || 0) + 1;

            // Count items
            order.items?.forEach(item => {
                stats.topItems[item.name] = (stats.topItems[item.name] || 0) + item.quantity;
            });
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

module.exports = router;
