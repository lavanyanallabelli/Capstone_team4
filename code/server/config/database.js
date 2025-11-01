const { Sequelize } = require('sequelize');
require('dotenv').config();

// Create Sequelize instance
const sequelize = new Sequelize(
    process.env.DB_NAME || 'posdb',
    process.env.DB_USER || 'postgres',
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        dialect: 'postgres',
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
        dialectOptions: {
            ssl: process.env.DB_HOST && process.env.DB_HOST.includes('rds.amazonaws.com') ? {
                require: true,
                rejectUnauthorized: false
            } : false
        },
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    }
);

// Test database connection
const connectDB = async () => {
    try {
        // First, connect to default 'postgres' database to check/create our database
        const defaultSequelize = new Sequelize(
            'postgres', // Connect to default postgres database
            process.env.DB_USER || 'postgres',
            process.env.DB_PASSWORD,
            {
                host: process.env.DB_HOST || 'localhost',
                port: process.env.DB_PORT || 5432,
                dialect: 'postgres',
                logging: false,
                dialectOptions: {
                    ssl: process.env.DB_HOST && process.env.DB_HOST.includes('rds.amazonaws.com') ? {
                        require: true,
                        rejectUnauthorized: false
                    } : false
                }
            }
        );

        try {
            // Check if database exists
            const dbName = process.env.DB_NAME || 'posdb';
            const [results] = await defaultSequelize.query(
                `SELECT 1 FROM pg_database WHERE datname = '${dbName}'`
            );

            if (results.length === 0) {
                console.log(`📝 Creating database '${dbName}'...`);
                await defaultSequelize.query(`CREATE DATABASE "${dbName}"`);
                console.log(`✅ Database '${dbName}' created successfully`);
            }

            await defaultSequelize.close();
        } catch (dbError) {
            await defaultSequelize.close();
            // If we can't create database, continue anyway (might already exist or permission issue)
            console.log('⚠️ Could not create database (might already exist):', dbError.message);
        }

        // Now connect to our actual database
        await sequelize.authenticate();
        console.log('✅ PostgreSQL connected successfully');
        return true;
    } catch (error) {
        console.error('❌ Unable to connect to PostgreSQL:', error);
        throw error;
    }
};

module.exports = { sequelize, connectDB };
