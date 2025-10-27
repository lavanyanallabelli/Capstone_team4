#!/usr/bin/env node

/**
 * Simple Server Test
 * 
 * This script starts a minimal server to test the employee creation endpoint.
 */

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Simple test endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

// Test employee creation endpoint (without auth for testing)
app.post('/api/employees', async (req, res) => {
    try {
        console.log('📝 Employee creation request received:', req.body);

        // Simulate the employee creation logic
        const { firstName, lastName, email, phone, position } = req.body;

        if (!firstName || !lastName || !email) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: firstName, lastName, email'
            });
        }

        // Simulate successful creation
        const mockEmployee = {
            employeeId: 'test-emp-123',
            firstName,
            lastName,
            email,
            phone: phone || '',
            position: position || '',
            tempPassword: 'temp123',
            createdAt: new Date().toISOString()
        };

        console.log('✅ Employee created successfully:', mockEmployee);

        res.status(201).json({
            success: true,
            data: mockEmployee,
            message: 'Employee created successfully (test mode)',
            tempPassword: 'temp123'
        });

    } catch (error) {
        console.error('❌ Error creating employee:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create employee',
            message: error.message
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Simple test server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🔗 Test employee creation: POST http://localhost:${PORT}/api/employees`);
    console.log('\n📝 Test with this data:');
    console.log(JSON.stringify({
        firstName: 'Test',
        lastName: 'Employee',
        email: 'test@example.com',
        phone: '+1234567890',
        position: 'Test Position'
    }, null, 2));
});

module.exports = app;
