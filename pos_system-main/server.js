const express = require('express');
const cors = require('cors');
require('dotenv').config();

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

// API Routes
app.get('/api/dashboard/stats', (req, res) => {
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
        ]
    });
});

app.get('/api/products', (req, res) => {
    // Mock products data
    res.json({
        products: [
            { id: 1, name: 'Coffee', price: 4.50, stock: 120, category: 'Beverages' },
            { id: 2, name: 'Sandwich', price: 8.99, stock: 45, category: 'Food' },
            { id: 3, name: 'Pastry', price: 3.25, stock: 30, category: 'Food' },
        ]
    });
});

app.post('/api/auth/signup', (req, res) => {
    const { businessName, email, phone, businessType } = req.body;

    // Mock signup response
    res.json({
        success: true,
        message: 'Account created successfully',
        user: {
            id: Date.now(),
            businessName,
            email,
            phone,
            businessType,
            createdAt: new Date().toISOString()
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
