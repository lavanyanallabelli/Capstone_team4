const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');

// Import database
const { connectDB, sequelize } = require('./config/database');
const models = require('./models');

// Import routes
const authRoutes = require('./routes/auth');
const menuRoutes = require('./routes/menu');
const employeeRoutes = require('./routes/employees');
const analyticsRoutes = require('./routes/analytics-simple');
const settingsRoutes = require('./routes/settings');
const orderRoutes = require('./routes/orders');
const ownerRoutes = require('./routes/owner');
const scheduleRoutes = require('./routes/schedules');

// Import middleware
const { authenticateToken } = require('./middleware/auth');
const { syncCognitoUserToOwner } = require('./middleware/cognitoSync');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;
const HOST = '0.0.0.0'; // allow external traffic

// Middleware
app.use(helmet());
app.use(cors({
    origin: ['http://localhost:3000', 'http://3.85.243.29:3000'],
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
// Apply authentication and Cognito sync middleware to protected routes
app.use('/api/menu', authenticateToken, syncCognitoUserToOwner, menuRoutes);
app.use('/api/employees', authenticateToken, syncCognitoUserToOwner, employeeRoutes);
app.use('/api/analytics', authenticateToken, syncCognitoUserToOwner, analyticsRoutes);
app.use('/api/settings', authenticateToken, syncCognitoUserToOwner, settingsRoutes);
app.use('/api/orders', authenticateToken, syncCognitoUserToOwner, orderRoutes);
app.use('/api/owner', authenticateToken, syncCognitoUserToOwner, ownerRoutes);
app.use('/api/schedules', authenticateToken, syncCognitoUserToOwner, scheduleRoutes);

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

// Initialize database and start server
const startServer = async () => {
    try {
        // Connect to PostgreSQL
        await connectDB();
        
        // Sync models (creates tables if they don't exist, alters if they do)
        await sequelize.sync({ alter: true });
        console.log('✅ Database models synchronized');
        
        // Add unique index for employeeId after column is created
        try {
            await sequelize.query(`
                CREATE UNIQUE INDEX IF NOT EXISTS "employees_employee_id_unique" 
                ON "employees" ("employeeId") 
                WHERE "employeeId" IS NOT NULL;
            `);
            console.log('✅ Employee ID unique index created');
        } catch (indexError) {
            // Index might already exist, which is fine
            if (!indexError.message.includes('already exists')) {
                console.warn('⚠️ Could not create employeeId index:', indexError.message);
            }
        }
        
        // Start server
        app.listen(PORT, HOST, () => {
            console.log(`🚀 Server running on http://${HOST}:${PORT}`);
            console.log(`📊 Health check: http://${HOST}:${PORT}/health`);
            console.log(`🔗 API Base URL: http://${HOST}:${PORT}/api`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

startServer();

module.exports = { app, sequelize };