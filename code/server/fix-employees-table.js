#!/usr/bin/env node

/**
 * Fix Employees Table Script
 * 
 * This script recreates the pos-employees table with the proper Global Secondary Index.
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
const docClient = new AWS.DynamoDB.DocumentClient();

async function fixEmployeesTable() {
    console.log('🔧 Fixing pos-employees table...\n');

    try {
        // Step 1: Delete existing table
        console.log('1. Deleting existing pos-employees table...');
        try {
            await dynamodb.deleteTable({ TableName: 'pos-employees' }).promise();
            console.log('✅ Table deletion initiated');

            // Wait for table to be deleted
            console.log('⏳ Waiting for table to be deleted...');
            await dynamodb.waitFor('tableNotExists', { TableName: 'pos-employees' }).promise();
            console.log('✅ Table deleted successfully');
        } catch (error) {
            if (error.code === 'ResourceNotFoundException') {
                console.log('✅ Table already deleted or does not exist');
            } else {
                throw error;
            }
        }

        // Step 2: Create table with proper GSI
        console.log('\n2. Creating pos-employees table with email-index GSI...');
        const tableParams = {
            TableName: 'pos-employees',
            KeySchema: [
                { AttributeName: 'businessId', KeyType: 'HASH' },
                { AttributeName: 'employeeId', KeyType: 'RANGE' }
            ],
            AttributeDefinitions: [
                { AttributeName: 'businessId', AttributeType: 'S' },
                { AttributeName: 'employeeId', AttributeType: 'S' },
                { AttributeName: 'email', AttributeType: 'S' }
            ],
            GlobalSecondaryIndexes: [
                {
                    IndexName: 'email-index',
                    KeySchema: [
                        { AttributeName: 'email', KeyType: 'HASH' }
                    ],
                    Projection: { ProjectionType: 'ALL' },
                    BillingMode: 'PAY_PER_REQUEST'
                }
            ],
            BillingMode: 'PAY_PER_REQUEST'
        };

        await dynamodb.createTable(tableParams).promise();
        console.log('✅ Table creation initiated');

        // Step 3: Wait for table to be active
        console.log('⏳ Waiting for table to be active...');
        await dynamodb.waitFor('tableExists', { TableName: 'pos-employees' }).promise();
        console.log('✅ Table is now active');

        // Step 4: Verify GSI was created
        console.log('\n3. Verifying Global Secondary Index...');
        const tableInfo = await dynamodb.describeTable({ TableName: 'pos-employees' }).promise();
        const gsiCount = tableInfo.Table.GlobalSecondaryIndexes?.length || 0;
        console.log(`✅ Global Secondary Indexes: ${gsiCount}`);

        if (tableInfo.Table.GlobalSecondaryIndexes) {
            tableInfo.Table.GlobalSecondaryIndexes.forEach(gsi => {
                console.log(`   - GSI: ${gsi.IndexName} (Status: ${gsi.IndexStatus})`);
            });
        }

        // Step 5: Test the fix
        console.log('\n4. Testing employee creation with email index...');
        const testEmployee = {
            businessId: 'test-business-123',
            employeeId: 'test-emp-123',
            firstName: 'Test',
            lastName: 'Employee',
            email: 'test@example.com',
            phone: '+1234567890',
            position: 'Test Position',
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // Create employee
        await docClient.put({
            TableName: 'pos-employees',
            Item: testEmployee
        }).promise();
        console.log('✅ Test employee created');

        // Query by email
        const queryResult = await docClient.query({
            TableName: 'pos-employees',
            IndexName: 'email-index',
            KeyConditionExpression: 'email = :email',
            ExpressionAttributeValues: {
                ':email': 'test@example.com'
            }
        }).promise();
        console.log('✅ Email index query successful');
        console.log(`   - Found ${queryResult.Items.length} employee(s)`);

        // Clean up test data
        await docClient.delete({
            TableName: 'pos-employees',
            Key: {
                businessId: 'test-business-123',
                employeeId: 'test-emp-123'
            }
        }).promise();
        console.log('✅ Test data cleaned up');

        console.log('\n🎉 pos-employees table fixed successfully!');
        console.log('   - Table recreated with email-index GSI');
        console.log('   - Employee creation should now work');

    } catch (error) {
        console.error('❌ Failed to fix table:', error);
        process.exit(1);
    }
}

// Run the fix
if (require.main === module) {
    fixEmployeesTable().catch(error => {
        console.error('❌ Fix script failed:', error);
        process.exit(1);
    });
}

module.exports = { fixEmployeesTable };
