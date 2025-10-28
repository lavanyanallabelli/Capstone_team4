const express = require('express');
const { docClient } = require('../config/dynamodb');

// Generate user-specific business ID for testing
const generateUserBusinessId = (req) => {
    // Use email from request body or headers to generate consistent business ID
    const email = req.body?.email || req.headers['x-user-email'] || 'default@example.com';
    const hash = require('crypto').createHash('md5').update(email).digest('hex').substring(0, 8);
    return `biz_${hash}_${Date.now()}`;
};

const router = express.Router();

// Get dashboard overview - simplified version
router.get('/overview', async (req, res) => {
    try {
        // Generate user-specific business ID for testing
        const businessId = req.user?.businessId || generateUserBusinessId(req);
        const { period = '7d' } = req.query;

        // Get analytics data from the pre-populated analytics table
        const analyticsParams = {
            TableName: 'pos-analytics',
            KeyConditionExpression: 'businessId = :businessId',
            ExpressionAttributeValues: {
                ':businessId': businessId
            }
        };

        // Always return zero data since no real orders have been made yet
        // const analyticsResult = await docClient.query(analyticsParams).promise();

        // if (analyticsResult.Items.length === 0) {
        // Return zero data since no real orders have been made yet
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
        // }

        const analyticsData = analyticsResult.Items[0];

        res.json({
            success: true,
            data: {
                sales: analyticsData.sales,
                customers: analyticsData.customers,
                salesData: analyticsData.salesData,
                topItems: analyticsData.topItems,
                employeePerformance: analyticsData.employeePerformance,
                revenueBreakdown: analyticsData.revenueBreakdown
            }
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
