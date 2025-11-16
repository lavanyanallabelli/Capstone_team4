const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
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
const subscriptionRoutes = require('./routes/subscription');

// Import middleware
const { authenticateToken } = require('./middleware/auth');
const { syncCognitoUserToOwner } = require('./middleware/cognitoSync');

// Load environment variables - try .env.qa first (QA), fallback to .env (dev/local)
const envQaPath = path.join(__dirname, '.env.qa');
const envPath = path.join(__dirname, '.env');
const envFile = require('fs').existsSync(envQaPath) ? envQaPath : envPath;

dotenv.config({ path: envFile });
console.log('📁 Loading environment from:', envFile);
console.log('✅ Environment variables loaded');

const app = express();
const PORT = process.env.PORT || 8000;
const HOST = '0.0.0.0'; // allow external traffic

// Startup debug logs (non-sensitive)
// console.log('=== Startup Configuration ===');
// console.log('NODE_ENV:', process.env.NODE_ENV);
// console.log('PORT:', PORT);
// console.log('FRONTEND_URL:', process.env.FRONTEND_URL);
// console.log('DB_HOST:', (process.env.DB_HOST || '').replace(/^(..).*(..$)/, '$1***$2')); // mask
// console.log('DB_NAME:', process.env.DB_NAME);
// console.log('AWS_REGION:', process.env.AWS_REGION);
// console.log('JWKS_URI set:', Boolean(process.env.JWKS_URI));
// console.log('============================');
// 
// CORS Configuration - Read from environment variables
// CORS_ORIGINS can be a comma-separated string or JSON array string
// Example: "http://localhost:3000,http://3.87.100.22:3000,http://54.196.161.29:3001"
// Or: '["http://localhost:3000","http://3.87.100.22:3000","http://54.196.161.29:3001"]'
let corsOrigins = ['http://localhost:3000']; // Default fallback
if (process.env.CORS_ORIGINS) {
    try {
        // Try parsing as JSON array first
        corsOrigins = JSON.parse(process.env.CORS_ORIGINS);
    } catch (e) {
        // If not JSON, treat as comma-separated string
        corsOrigins = process.env.CORS_ORIGINS.split(',').map(origin => origin.trim());
    }
}
console.log('🌐 CORS Origins configured:', corsOrigins);
console.log('🌐 CORS_ORIGINS env var:', process.env.CORS_ORIGINS);

// Configure CORS with proper options
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        if (corsOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.warn('⚠️ CORS blocked origin:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware - Helmet after CORS to avoid conflicts
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false
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
app.use('/api/subscription', subscriptionRoutes);

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

// Global error handlers for more debug info
process.on('unhandledRejection', (reason) => {
    console.error('UNHANDLED_REJECTION:', reason);
});
process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT_EXCEPTION:', err);
});

startServer();

module.exports = { app, sequelize };