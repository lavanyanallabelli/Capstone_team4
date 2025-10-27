#!/usr/bin/env node

/**
 * Test Employee API Script
 * 
 * This script tests the employee creation API endpoint directly.
 */

const axios = require('axios');

async function testEmployeeAPI() {
    console.log('🧪 Testing Employee Creation API...\n');

    try {
        // Test data
        const testEmployee = {
            firstName: 'Test',
            lastName: 'Employee',
            email: 'test@example.com',
            phone: '+1234567890',
            position: 'Test Position'
        };

        console.log('1. Testing employee creation API...');
        console.log('   - Employee data:', testEmployee);

        // Make API call to create employee
        const response = await axios.post('http://localhost:5000/api/employees', testEmployee, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer test-token' // This will fail auth, but we can see the error
            }
        });

        console.log('✅ Employee created successfully!');
        console.log('   - Response:', response.data);

    } catch (error) {
        if (error.response) {
            console.log('❌ API Error:', error.response.status, error.response.data);

            if (error.response.status === 401) {
                console.log('   - This is expected (authentication required)');
                console.log('   - The API endpoint is working, just needs proper auth token');
            } else if (error.response.status === 500) {
                console.log('   - This indicates a server error - likely the DynamoDB issue');
            }
        } else if (error.code === 'ECONNREFUSED') {
            console.log('❌ Connection refused - make sure the server is running on port 5000');
        } else {
            console.log('❌ Error:', error.message);
        }
    }
}

// Run the test
if (require.main === module) {
    testEmployeeAPI().catch(error => {
        console.error('❌ Test failed:', error);
        process.exit(1);
    });
}

module.exports = { testEmployeeAPI };
