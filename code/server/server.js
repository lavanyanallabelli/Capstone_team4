const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const AWS = require('aws-sdk');

// Import routes
const authRoutes = require('./routes/auth');
const menuRoutes = require('./routes/menu');
const employeeRoutes = require('./routes/employees');
const analyticsRoutes = require('./routes/analytics-simple');
const settingsRoutes = require('./routes/settings');

// Import middleware
const { authenticateToken } = require('./middleware/auth');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;
const HOST = '0.0.0.0'; // allow external traffic

// Configure AWS
console.log('🔧 AWS Configuration:');
console.log('   Region:', process.env.AWS_REGION || 'us-east-1');
console.log('   Access Key ID:', process.env.AWS_ACCESS_KEY_ID ? 'Set' : 'Not set');
console.log('   Secret Access Key:', process.env.AWS_SECRET_ACCESS_KEY ? 'Set' : 'Not set');

AWS.config.update({
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

// Initialize DynamoDB
const dynamodb = new AWS.DynamoDB.DocumentClient();

// Middleware
app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        service: 'POS Backend API'
    });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes); // Temporarily disabled auth for testing
app.use('/api/employees', employeeRoutes); // Temporarily disabled auth for testing
app.use('/api/analytics', analyticsRoutes); // Temporarily disabled auth for testing
app.use('/api/settings', settingsRoutes); // Temporarily disabled auth for testing

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);

    if (err.name === 'ValidationError') {
        return res.status(400).json({
            error: 'Validation Error',
            message: err.message,
            details: err.details
        });
    }

    if (err.name === 'UnauthorizedError') {
        return res.status(401).json({
            error: 'Unauthorized',
            message: 'Invalid or missing authentication token'
        });
    }

    res.status(500).json({
        error: 'Internal Server Error',
        message: 'Something went wrong on our end'
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.originalUrl} not found`
    });
});

// Start server
app.listen(PORT, HOST, () => {
    console.log(`🚀 Server running on http://${HOST}:${PORT}`);
    console.log(`📊 Health check: http://${HOST}:${PORT}/health`);
    console.log(`🔗 API Base URL: http://${HOST}:${PORT}/api`);
});

module.exports = { app, dynamodb };