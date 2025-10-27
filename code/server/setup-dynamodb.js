#!/usr/bin/env node

/**
 * DynamoDB Setup Script
 * 
 * This script creates all the necessary DynamoDB tables for the POS system.
 * Run this script after setting up your AWS credentials.
 * 
 * Usage: node setup-dynamodb.js
 */

const AWS = require('aws-sdk');
require('dotenv').config();

// Configure AWS
AWS.config.update({
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const dynamodb = new AWS.DynamoDB();

// Table definitions
const tables = [
    {
        TableName: 'pos-menu-items',
        KeySchema: [
            { AttributeName: 'businessId', KeyType: 'HASH' },
            { AttributeName: 'itemId', KeyType: 'RANGE' }
        ],
        AttributeDefinitions: [
            { AttributeName: 'businessId', AttributeType: 'S' },
            { AttributeName: 'itemId', AttributeType: 'S' }
        ],
        BillingMode: 'PAY_PER_REQUEST'
    },
    {
        TableName: 'pos-employees',
        KeySchema: [
            { AttributeName: 'businessId', KeyType: 'HASH' },
            { AttributeName: 'employeeId', KeyType: 'RANGE' }
        ],
        AttributeDefinitions: [
            { AttributeName: 'businessId', AttributeType: 'S' },
            { AttributeName: 'employeeId', AttributeType: 'S' }
        ],
        BillingMode: 'PAY_PER_REQUEST'
    },
    {
        TableName: 'pos-orders',
        KeySchema: [
            { AttributeName: 'businessId', KeyType: 'HASH' },
            { AttributeName: 'orderId', KeyType: 'RANGE' }
        ],
        AttributeDefinitions: [
            { AttributeName: 'businessId', AttributeType: 'S' },
            { AttributeName: 'orderId', AttributeType: 'S' }
        ],
        BillingMode: 'PAY_PER_REQUEST'
    },
    {
        TableName: 'pos-analytics',
        KeySchema: [
            { AttributeName: 'businessId', KeyType: 'HASH' },
            { AttributeName: 'date', KeyType: 'RANGE' }
        ],
        AttributeDefinitions: [
            { AttributeName: 'businessId', AttributeType: 'S' },
            { AttributeName: 'date', AttributeType: 'S' }
        ],
        BillingMode: 'PAY_PER_REQUEST'
    },
    {
        TableName: 'pos-settings',
        KeySchema: [
            { AttributeName: 'businessId', KeyType: 'HASH' },
            { AttributeName: 'settingType', KeyType: 'RANGE' }
        ],
        AttributeDefinitions: [
            { AttributeName: 'businessId', AttributeType: 'S' },
            { AttributeName: 'settingType', AttributeType: 'S' }
        ],
        BillingMode: 'PAY_PER_REQUEST'
    },
    {
        TableName: 'pos-users',
        KeySchema: [
            { AttributeName: 'userId', KeyType: 'HASH' }
        ],
        AttributeDefinitions: [
            { AttributeName: 'userId', AttributeType: 'S' }
        ],
        BillingMode: 'PAY_PER_REQUEST'
    }
];

async function createTable(tableDefinition) {
    try {
        // Check if table already exists
        await dynamodb.describeTable({ TableName: tableDefinition.TableName }).promise();
        console.log(`✅ Table ${tableDefinition.TableName} already exists`);
        return true;
    } catch (error) {
        if (error.code === 'ResourceNotFoundException') {
            try {
                console.log(`📝 Creating table ${tableDefinition.TableName}...`);
                await dynamodb.createTable(tableDefinition).promise();

                // Wait for table to be active
                console.log(`⏳ Waiting for table ${tableDefinition.TableName} to be active...`);
                await dynamodb.waitFor('tableExists', { TableName: tableDefinition.TableName }).promise();

                console.log(`✅ Table ${tableDefinition.TableName} created successfully`);
                return true;
            } catch (createError) {
                console.error(`❌ Error creating table ${tableDefinition.TableName}:`, createError.message);
                return false;
            }
        } else {
            console.error(`❌ Error checking table ${tableDefinition.TableName}:`, error.message);
            return false;
        }
    }
}

async function setupDynamoDB() {
    console.log('🚀 Starting DynamoDB setup...\n');

    // Check AWS credentials
    try {
        const sts = new AWS.STS();
        const identity = await sts.getCallerIdentity().promise();
        console.log(`🔐 AWS Identity: ${identity.Arn}`);
        console.log(`🌍 AWS Region: ${process.env.AWS_REGION || 'us-east-1'}\n`);
    } catch (error) {
        console.error('❌ AWS credentials not configured properly:', error.message);
        console.log('\n📋 Please check your .env file and ensure:');
        console.log('   - AWS_ACCESS_KEY_ID is set');
        console.log('   - AWS_SECRET_ACCESS_KEY is set');
        console.log('   - AWS_REGION is set');
        process.exit(1);
    }

    let successCount = 0;
    let totalTables = tables.length;

    // Create all tables
    for (const table of tables) {
        const success = await createTable(table);
        if (success) successCount++;
        console.log(''); // Add spacing
    }

    // Summary
    console.log('📊 Setup Summary:');
    console.log(`   ✅ Successfully created/verified: ${successCount}/${totalTables} tables`);

    if (successCount === totalTables) {
        console.log('\n🎉 DynamoDB setup completed successfully!');
        console.log('\n📋 Next steps:');
        console.log('   1. Update your .env file with Cognito configuration');
        console.log('   2. Start the backend server: npm run dev');
        console.log('   3. Test the API endpoints');
    } else {
        console.log('\n⚠️  Some tables failed to create. Please check the errors above.');
        process.exit(1);
    }
}

// Run the setup
if (require.main === module) {
    setupDynamoDB().catch(error => {
        console.error('❌ Setup failed:', error);
        process.exit(1);
    });
}

module.exports = { setupDynamoDB, tables };
