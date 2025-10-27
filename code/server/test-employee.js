#!/usr/bin/env node

/**
 * Test Employee Creation Script
 * 
 * This script tests the employee creation functionality to debug issues.
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

async function testEmployeeCreation() {
    console.log('🧪 Testing Employee Creation...\n');

    try {
        // Test 1: Check if table exists
        console.log('1. Checking if pos-employees table exists...');
        try {
            const tableInfo = await dynamodb.describeTable({ TableName: 'pos-employees' }).promise();
            console.log('✅ Table exists');
            console.log('   - Table Status:', tableInfo.Table.TableStatus);
            console.log('   - Global Secondary Indexes:', tableInfo.Table.GlobalSecondaryIndexes?.length || 0);

            if (tableInfo.Table.GlobalSecondaryIndexes) {
                tableInfo.Table.GlobalSecondaryIndexes.forEach(gsi => {
                    console.log(`   - GSI: ${gsi.IndexName} (Status: ${gsi.IndexStatus})`);
                });
            }
        } catch (error) {
            console.log('❌ Table does not exist:', error.message);
            return;
        }

        // Test 2: Try to create a test employee
        console.log('\n2. Testing employee creation...');
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

        const params = {
            TableName: 'pos-employees',
            Item: testEmployee
        };

        await docClient.put(params).promise();
        console.log('✅ Test employee created successfully');

        // Test 3: Try to query by email (this is where the error might occur)
        console.log('\n3. Testing email index query...');
        try {
            const queryParams = {
                TableName: 'pos-employees',
                IndexName: 'email-index',
                KeyConditionExpression: 'email = :email',
                ExpressionAttributeValues: {
                    ':email': 'test@example.com'
                }
            };

            const result = await docClient.query(queryParams).promise();
            console.log('✅ Email index query successful');
            console.log('   - Found items:', result.Items.length);
        } catch (error) {
            console.log('❌ Email index query failed:', error.message);
            console.log('   - This is likely the cause of the employee creation failure');
        }

        // Test 4: Clean up test data
        console.log('\n4. Cleaning up test data...');
        const deleteParams = {
            TableName: 'pos-employees',
            Key: {
                businessId: 'test-business-123',
                employeeId: 'test-emp-123'
            }
        };

        await docClient.delete(deleteParams).promise();
        console.log('✅ Test data cleaned up');

    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

// Run the test
if (require.main === module) {
    testEmployeeCreation().catch(error => {
        console.error('❌ Test script failed:', error);
        process.exit(1);
    });
}

module.exports = { testEmployeeCreation };
