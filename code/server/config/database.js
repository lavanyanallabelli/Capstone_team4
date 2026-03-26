const { Sequelize } = require('sequelize');
require('dotenv').config();

// Create Sequelize instance
const sslEnabled = process.env.DB_HOST && process.env.DB_HOST.includes('rds.amazonaws.com');
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
            ssl: sslEnabled ? {
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

// Test database connection with retry logic
const connectDB = async (retries = 3, delay = 5000) => {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            // Log DB target (masking sensitive)
            console.log(`\n🔄 Connection attempt ${attempt}/${retries}`);
            console.log('DB connect → host:', (process.env.DB_HOST || 'localhost').replace(/^(..).*(..$)/, '$1***$2'));
            console.log('DB connect → db:', process.env.DB_NAME || 'posdb');
            console.log('DB connect → user:', (process.env.DB_USER || 'postgres').replace(/^(..).*(..$)/, '$1***$2'));
            console.log('DB connect → ssl:', sslEnabled);

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
                        ssl: sslEnabled ? {
                            require: true,
                            rejectUnauthorized: false
                        } : false
                    },
                    // Add connection timeout
                    connectTimeout: 10000 // 10 seconds
                }
            );

            try {
                // Check if database exists
                const dbName = process.env.DB_NAME || 'posdb';
                const [results] = await defaultSequelize.query(
                    `SELECT 1 FROM pg_database WHERE datname = '${dbName}'`
                );

                if (results.length === 0) {
                //    console.log(`📝 Creating database '${dbName}'...`);
                    await defaultSequelize.query(`CREATE DATABASE "${dbName}"`);
                  //  console.log(`✅ Database '${dbName}' created successfully`);
                }

                await defaultSequelize.close();
            } catch (dbError) {
                await defaultSequelize.close();
                // If we can't create database, continue anyway (might already exist or permission issue)
             //   console.log('⚠️ Could not create database (might already exist):', dbError.message);
            }

            // Now connect to our actual database
            await sequelize.authenticate();
            console.log('✅ PostgreSQL connected successfully');
            return true;
        } catch (error) {
            console.error(`❌ Connection attempt ${attempt} failed:`, error.message);

            if (attempt < retries) {
                console.log(`⏳ Retrying in ${delay / 1000} seconds...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                // console.error('❌ Unable to connect to PostgreSQL after', retries, 'attempts');
                // console.error('💡 Please check:');
                // console.error('   1. Database server is running');
                // console.error('   2. Network connectivity to', process.env.DB_HOST || 'localhost');
                // console.error('   3. Firewall rules allow connection on port', process.env.DB_PORT || 5432);
                // console.error('   4. Database credentials in .env file are correct');
                throw error;
            }
        }
    }
};

module.exports = { sequelize, connectDB };
