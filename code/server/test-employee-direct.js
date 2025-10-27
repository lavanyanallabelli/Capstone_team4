#!/usr/bin/env node

/**
 * Test Employee Creation Direct Script
 * 
 * This script tests the employee creation functionality directly without the server.
 */

const AWS = require('aws-sdk');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

// Configure AWS
AWS.config.update({
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const docClient = new AWS.DynamoDB.DocumentClient();

// Simple validation schema
const employeeSchema = {
    firstName: { required: true, type: 'string' },
    lastName: { required: true, type: 'string' },
    email: { required: true, type: 'string' },
    phone: { required: false, type: 'string' },
    position: { required: false, type: 'string' }
};

function validateEmployee(data) {
    const errors = [];

    for (const [field, rules] of Object.entries(employeeSchema)) {
        if (rules.required && (!data[field] || data[field].trim() === '')) {
            errors.push(`${field} is required`);
        }
    }

    return { isValid: errors.length === 0, errors };
}

async function createEmployee(employeeData) {
    console.log('🧪 Testing Employee Creation Direct...\n');

    try {
        // Step 1: Validate input
        console.log('1. Validating employee data...');
        const validation = validateEmployee(employeeData);
        if (!validation.isValid) {
            console.log('❌ Validation failed:', validation.errors);
            return;
        }
        console.log('✅ Validation passed');

        // Step 2: Check if employee with email already exists
        console.log('2. Checking for existing employee with same email...');
        const existingEmployeeParams = {
            TableName: 'pos-employees',
            FilterExpression: 'email = :email',
            ExpressionAttributeValues: {
                ':email': employeeData.email
            }
        };

        const existingEmployee = await docClient.scan(existingEmployeeParams).promise();
        if (existingEmployee.Items.length > 0) {
            console.log('❌ Employee with this email already exists');
            return;
        }
        console.log('✅ No existing employee found with this email');

        // Step 3: Create employee
        console.log('3. Creating new employee...');
        const businessId = 'test-business-123'; // Using test business ID
        const employeeId = uuidv4();
        const tempPassword = Math.random().toString(36).slice(-8);
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        const employee = {
            businessId,
            employeeId,
            ...employeeData,
            password: hashedPassword,
            tempPassword,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lastLogin: null,
            loginCount: 0
        };

        const params = {
            TableName: 'pos-employees',
            Item: employee
        };

        await docClient.put(params).promise();
        console.log('✅ Employee created successfully!');
        console.log('   - Employee ID:', employeeId);
        console.log('   - Temporary Password:', tempPassword);

        // Step 4: Verify employee was created
        console.log('4. Verifying employee creation...');
        const getParams = {
            TableName: 'pos-employees',
            Key: {
                businessId,
                employeeId
            }
        };

        const result = await docClient.get(getParams).promise();
        if (result.Item) {
            console.log('✅ Employee verification successful');
            console.log('   - Name:', `${result.Item.firstName} ${result.Item.lastName}`);
            console.log('   - Email:', result.Item.email);
            console.log('   - Created:', result.Item.createdAt);
        } else {
            console.log('❌ Employee verification failed');
        }

        // Step 5: Clean up test data
        console.log('5. Cleaning up test data...');
        await docClient.delete({
            TableName: 'pos-employees',
            Key: {
                businessId,
                employeeId
            }
        }).promise();
        console.log('✅ Test data cleaned up');

        console.log('\n🎉 Employee creation test completed successfully!');
        console.log('   - The DynamoDB operations are working');
        console.log('   - The issue is likely with the server or authentication');

    } catch (error) {
        console.error('❌ Test failed:', error);

        if (error.code === 'CredentialsError') {
            console.log('   - This is a credentials issue');
            console.log('   - Make sure your AWS credentials are set in .env file');
        } else if (error.code === 'ResourceNotFoundException') {
            console.log('   - The pos-employees table does not exist');
            console.log('   - Run: npm run setup-db');
        } else {
            console.log('   - Error details:', error.message);
        }
    }
}

// Test data
const testEmployee = {
    firstName: 'Test',
    lastName: 'Employee',
    email: 'test@example.com',
    phone: '+1234567890',
    position: 'Test Position'
};

// Run the test
if (require.main === module) {
    createEmployee(testEmployee).catch(error => {
        console.error('❌ Test script failed:', error);
        process.exit(1);
    });
}

module.exports = { createEmployee };
