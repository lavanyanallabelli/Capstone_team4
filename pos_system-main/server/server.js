const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { authenticateToken, authorizeRole, authorizePermission } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'POS System API is running',
        timestamp: new Date().toISOString()
    });
});

// Protected API Routes (require authentication)
app.get('/api/dashboard/stats', authenticateToken, authorizePermission('canViewAnalytics'), (req, res) => {
    // Mock dashboard statistics
    res.json({
        totalSales: 12450.75,
        totalOrders: 234,
        totalCustomers: 156,
        averageOrderValue: 53.21,
        salesData: [
            { date: '2024-01-01', sales: 1200 },
            { date: '2024-01-02', sales: 1800 },
            { date: '2024-01-03', sales: 1500 },
            { date: '2024-01-04', sales: 2100 },
            { date: '2024-01-05', sales: 1900 },
        ],
        user: {
            businessName: req.user.businessName,
            userRole: req.user.userRole
        }
    });
});

app.get('/api/products', authenticateToken, (req, res) => {
    // Mock products data - accessible to all authenticated users
    res.json({
        products: [
            { id: 1, name: 'Coffee', price: 4.50, stock: 120, category: 'Beverages' },
            { id: 2, name: 'Sandwich', price: 8.99, stock: 45, category: 'Food' },
            { id: 3, name: 'Pastry', price: 3.25, stock: 30, category: 'Food' },
        ],
        user: {
            businessName: req.user.businessName,
            userRole: req.user.userRole
        }
    });
});

// Product management routes (require inventory management permission)
app.post('/api/products', authenticateToken, authorizePermission('canManageProducts'), (req, res) => {
    const { name, price, stock, category } = req.body;

    res.json({
        success: true,
        message: 'Product created successfully',
        product: {
            id: Date.now(),
            name,
            price,
            stock,
            category,
            createdAt: new Date().toISOString()
        }
    });
});

app.put('/api/products/:id', authenticateToken, authorizePermission('canManageProducts'), (req, res) => {
    const { id } = req.params;
    const { name, price, stock, category } = req.body;

    res.json({
        success: true,
        message: 'Product updated successfully',
        product: {
            id: parseInt(id),
            name,
            price,
            stock,
            category,
            updatedAt: new Date().toISOString()
        }
    });
});

// Sales routes (require sales processing permission)
app.post('/api/sales', authenticateToken, authorizePermission('canProcessSales'), (req, res) => {
    const { items, total, paymentMethod } = req.body;

    res.json({
        success: true,
        message: 'Sale processed successfully',
        sale: {
            id: Date.now(),
            items,
            total,
            paymentMethod,
            cashier: req.user.email,
            businessId: req.user.businessId,
            createdAt: new Date().toISOString()
        }
    });
});

// User management routes (require user management permission)
app.get('/api/users', authenticateToken, authorizePermission('canManageUsers'), (req, res) => {
    res.json({
        users: [
            { id: 1, email: 'admin@example.com', role: 'admin', businessName: req.user.businessName },
            { id: 2, email: 'manager@example.com', role: 'manager', businessName: req.user.businessName },
            { id: 3, email: 'cashier@example.com', role: 'cashier', businessName: req.user.businessName }
        ]
    });
});

// Reports routes (require reports permission)
app.get('/api/reports/sales', authenticateToken, authorizePermission('canViewReports'), (req, res) => {
    res.json({
        salesReport: {
            period: '2024-01',
            totalSales: 12450.75,
            totalOrders: 234,
            averageOrderValue: 53.21,
            topProducts: [
                { name: 'Coffee', quantity: 120, revenue: 540.00 },
                { name: 'Sandwich', quantity: 45, revenue: 404.55 }
            ]
        }
    });
});

// User profile route
app.get('/api/user/profile', authenticateToken, (req, res) => {
    res.json({
        user: {
            sub: req.user.sub,
            email: req.user.email,
            userRole: req.user.userRole,
            businessId: req.user.businessId,
            businessName: req.user.businessName,
            businessType: req.user.businessType,
            phone: req.user.phone
        }
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Something went wrong!',
        message: err.message
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Route not found',
        path: req.originalUrl
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
});
