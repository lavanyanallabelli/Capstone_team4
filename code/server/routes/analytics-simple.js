const express = require('express');
const { Order, Payment } = require('../models');

// Helper to get ownerId from request
const getOwnerId = (req) => {
    // ONLY use ownerId from cognitoSync middleware - it's the PostgreSQL UUID
    if (req.user?.ownerId) {
        return req.user.ownerId;
    }
    console.warn('⚠️ ownerId not set - cognitoSync middleware may have failed');
    return null;
};

const router = express.Router();

// Get dashboard overview - simplified version
router.get('/overview', async (req, res) => {
    try {
        const ownerId = getOwnerId(req);
        if (!ownerId) {
            return res.status(401).json({
                success: false,
                error: 'Unauthorized',
                message: 'Owner ID is required'
            });
        }

        const { period = '7d' } = req.query;

        // Return analytics data based on orders in PostgreSQL
        // For now, return mock data since we're just getting started
        const mockData = {
            sales: {
                totalRevenue: 0,
                totalOrders: 0,
                averageOrderValue: 0,
                revenueGrowth: 0,
                orderGrowth: 0
            },
            customers: {
                totalCustomers: 0,
                newCustomers: 0,
                returningCustomers: 0,
                customerGrowth: 0
            },
            salesData: [
                { date: '2025-10-20', revenue: 0, orders: 0 },
                { date: '2025-10-21', revenue: 0, orders: 0 },
                { date: '2025-10-22', revenue: 0, orders: 0 },
                { date: '2025-10-23', revenue: 0, orders: 0 },
                { date: '2025-10-24', revenue: 0, orders: 0 },
                { date: '2025-10-25', revenue: 0, orders: 0 },
                { date: '2025-10-26', revenue: 0, orders: 0 }
            ],
            topItems: [],
            employeePerformance: [],
            revenueBreakdown: {
                dineIn: { revenue: 0, percentage: 0 },
                online: { revenue: 0, percentage: 0 }
            }
        };

        return res.json({
            success: true,
            data: mockData
        });

    } catch (error) {
        console.error('Error fetching analytics overview:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch analytics overview',
            message: error.message
        });
    }
});

module.exports = router;
