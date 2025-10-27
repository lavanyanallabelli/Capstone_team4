const express = require('express');
const { v4: uuidv4 } = require('uuid');
const Joi = require('joi');
const bcrypt = require('bcryptjs');
const { docClient } = require('../config/dynamodb');
// Authentication temporarily disabled for testing

const router = express.Router();

// Validation schemas
const employeeSchema = Joi.object({
    firstName: Joi.string().min(1).max(50).required(),
    lastName: Joi.string().min(1).max(50).required(),
    email: Joi.string().email().required(),
    phone: Joi.string().pattern(/^\+?[\d\s\-\(\)]+$/).optional(),
    position: Joi.string().max(50).optional(),
    hireDate: Joi.date().optional(),
    salary: Joi.number().positive().optional(),
    isActive: Joi.boolean().default(true),
    permissions: Joi.array().items(Joi.string()).optional()
});

const updateEmployeeSchema = Joi.object({
    firstName: Joi.string().min(1).max(50).optional(),
    lastName: Joi.string().min(1).max(50).optional(),
    email: Joi.string().email().optional(),
    phone: Joi.string().pattern(/^\+?[\d\s\-\(\)]+$/).optional(),
    position: Joi.string().max(50).optional(),
    hireDate: Joi.date().optional(),
    salary: Joi.number().positive().optional(),
    isActive: Joi.boolean().optional(),
    permissions: Joi.array().items(Joi.string()).optional()
});

// Get all employees for a business
router.get('/', async (req, res) => {
    try {
        // Use default business ID for testing (temporarily disabled auth)
        const businessId = req.user?.businessId || 'biz_fg27sj9ld_1760831311628';

        console.log('📋 Fetching employees for businessId:', businessId);
        const { isActive, search } = req.query;

        let params = {
            TableName: 'pos-employees',
            KeyConditionExpression: 'businessId = :businessId',
            ExpressionAttributeValues: {
                ':businessId': businessId
            }
        };

        // Add filters
        let filterExpressions = [];

        if (isActive !== undefined) {
            filterExpressions.push('isActive = :isActive');
            params.ExpressionAttributeValues[':isActive'] = isActive === 'true';
        }

        if (search) {
            filterExpressions.push('(contains(firstName, :search) OR contains(lastName, :search) OR contains(email, :search))');
            params.ExpressionAttributeValues[':search'] = search.toLowerCase();
        }

        if (filterExpressions.length > 0) {
            params.FilterExpression = filterExpressions.join(' AND ');
        }

        const result = await docClient.query(params).promise();

        // Remove sensitive data
        const employees = result.Items.map(employee => {
            const { password, ...safeEmployee } = employee;
            return safeEmployee;
        });

        res.json({
            success: true,
            data: employees,
            count: result.Count
        });
    } catch (error) {
        console.error('Error fetching employees:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch employees',
            message: error.message
        });
    }
});

// Get employee by ID
router.get('/:employeeId', async (req, res) => {
    try {
        // Use default business ID for testing (temporarily disabled auth)
        const businessId = req.user?.businessId || 'biz_fg27sj9ld_1760831311628';
        const { employeeId } = req.params;

        const params = {
            TableName: 'pos-employees',
            Key: {
                businessId,
                employeeId
            }
        };

        const result = await docClient.get(params).promise();

        if (!result.Item) {
            return res.status(404).json({
                success: false,
                error: 'Employee not found'
            });
        }

        // Remove sensitive data
        const { password, ...employee } = result.Item;

        res.json({
            success: true,
            data: employee
        });
    } catch (error) {
        console.error('Error fetching employee:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch employee',
            message: error.message
        });
    }
});

// Create new employee
router.post('/', async (req, res) => {
    try {
        // Use default business ID for testing (temporarily disabled auth)
        const businessId = req.user?.businessId || 'biz_fg27sj9ld_1760831311628';

        // Debug: Log the request data
        console.log('📝 Employee creation request:', {
            body: req.body,
            businessId: businessId
        });

        // Validate input
        const { error, value } = employeeSchema.validate(req.body);
        if (error) {
            console.log('❌ Validation error:', error.details);
            return res.status(400).json({
                success: false,
                error: 'Validation error',
                details: error.details
            });
        }

        // Check if employee with email already exists (using scan since GSI is not available)
        const existingEmployeeParams = {
            TableName: 'pos-employees',
            FilterExpression: 'email = :email',
            ExpressionAttributeValues: {
                ':email': value.email
            }
        };

        const existingEmployee = await docClient.scan(existingEmployeeParams).promise();
        if (existingEmployee.Items.length > 0) {
            return res.status(409).json({
                success: false,
                error: 'Employee with this email already exists'
            });
        }

        const employeeId = uuidv4();
        const tempPassword = Math.random().toString(36).slice(-8); // Generate temporary password
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        const employee = {
            businessId,
            employeeId,
            ...value,
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

        console.log('📝 Saving employee to DynamoDB:', {
            tableName: 'pos-employees',
            businessId: businessId,
            employeeId: employeeId
        });

        try {
            await docClient.put(params).promise();
            console.log('✅ Employee saved to DynamoDB successfully');
        } catch (dynamoError) {
            console.error('❌ DynamoDB Error:', dynamoError);
            throw dynamoError;
        }

        // Remove sensitive data from response
        const { password, ...safeEmployee } = employee;

        res.status(201).json({
            success: true,
            data: safeEmployee,
            message: 'Employee created successfully',
            tempPassword: tempPassword // Include temp password for owner to share with employee
        });
    } catch (error) {
        console.error('Error creating employee:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create employee',
            message: error.message
        });
    }
});

// Update employee
router.put('/:employeeId', async (req, res) => {
    try {
        // Use default business ID for testing (temporarily disabled auth)
        const businessId = req.user?.businessId || 'biz_fg27sj9ld_1760831311628';
        const { employeeId } = req.params;

        // Validate input
        const { error, value } = updateEmployeeSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                error: 'Validation error',
                details: error.details
            });
        }

        // Check if employee exists
        const getParams = {
            TableName: 'pos-employees',
            Key: { businessId, employeeId }
        };

        const existingEmployee = await docClient.get(getParams).promise();
        if (!existingEmployee.Item) {
            return res.status(404).json({
                success: false,
                error: 'Employee not found'
            });
        }

        // If email is being updated, check for duplicates (using scan since GSI is not available)
        if (value.email && value.email !== existingEmployee.Item.email) {
            const emailCheckParams = {
                TableName: 'pos-employees',
                FilterExpression: 'email = :email',
                ExpressionAttributeValues: {
                    ':email': value.email
                }
            };

            const emailCheck = await docClient.scan(emailCheckParams).promise();
            if (emailCheck.Items.length > 0) {
                return res.status(409).json({
                    success: false,
                    error: 'Employee with this email already exists'
                });
            }
        }

        // Update employee
        const updateExpressions = [];
        const expressionAttributeNames = {};
        const expressionAttributeValues = {};

        Object.keys(value).forEach(key => {
            updateExpressions.push(`#${key} = :${key}`);
            expressionAttributeNames[`#${key}`] = key;
            expressionAttributeValues[`:${key}`] = value[key];
        });

        updateExpressions.push('#updatedAt = :updatedAt');
        expressionAttributeNames['#updatedAt'] = 'updatedAt';
        expressionAttributeValues[':updatedAt'] = new Date().toISOString();

        const updateParams = {
            TableName: 'pos-employees',
            Key: { businessId, employeeId },
            UpdateExpression: `SET ${updateExpressions.join(', ')}`,
            ExpressionAttributeNames: expressionAttributeNames,
            ExpressionAttributeValues: expressionAttributeValues,
            ReturnValues: 'ALL_NEW'
        };

        const result = await docClient.update(updateParams).promise();

        // Remove sensitive data
        const { password, ...updatedEmployee } = result.Attributes;

        res.json({
            success: true,
            data: updatedEmployee,
            message: 'Employee updated successfully'
        });
    } catch (error) {
        console.error('Error updating employee:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update employee',
            message: error.message
        });
    }
});

// Deactivate/Activate employee
router.patch('/:employeeId/status', async (req, res) => {
    try {
        // Use default business ID for testing (temporarily disabled auth)
        const businessId = req.user?.businessId || 'biz_fg27sj9ld_1760831311628';
        const { employeeId } = req.params;
        const { isActive } = req.body;

        if (typeof isActive !== 'boolean') {
            return res.status(400).json({
                success: false,
                error: 'isActive must be a boolean value'
            });
        }

        const params = {
            TableName: 'pos-employees',
            Key: { businessId, employeeId },
            UpdateExpression: 'SET isActive = :isActive, updatedAt = :updatedAt',
            ExpressionAttributeValues: {
                ':isActive': isActive,
                ':updatedAt': new Date().toISOString()
            },
            ReturnValues: 'ALL_NEW'
        };

        const result = await docClient.update(params).promise();

        // Remove sensitive data
        const { password, ...updatedEmployee } = result.Attributes;

        res.json({
            success: true,
            data: updatedEmployee,
            message: `Employee ${isActive ? 'activated' : 'deactivated'} successfully`
        });
    } catch (error) {
        console.error('Error updating employee status:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update employee status',
            message: error.message
        });
    }
});

// Reset employee password
router.post('/:employeeId/reset-password', async (req, res) => {
    try {
        // Use default business ID for testing (temporarily disabled auth)
        const businessId = req.user?.businessId || 'biz_fg27sj9ld_1760831311628';
        const { employeeId } = req.params;

        // Check if employee exists
        const getParams = {
            TableName: 'pos-employees',
            Key: { businessId, employeeId }
        };

        const existingEmployee = await docClient.get(getParams).promise();
        if (!existingEmployee.Item) {
            return res.status(404).json({
                success: false,
                error: 'Employee not found'
            });
        }

        // Generate new temporary password
        const tempPassword = Math.random().toString(36).slice(-8);
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        const updateParams = {
            TableName: 'pos-employees',
            Key: { businessId, employeeId },
            UpdateExpression: 'SET password = :password, tempPassword = :tempPassword, updatedAt = :updatedAt',
            ExpressionAttributeValues: {
                ':password': hashedPassword,
                ':tempPassword': tempPassword,
                ':updatedAt': new Date().toISOString()
            },
            ReturnValues: 'ALL_NEW'
        };

        const result = await docClient.update(updateParams).promise();

        res.json({
            success: true,
            message: 'Password reset successfully',
            tempPassword: tempPassword
        });
    } catch (error) {
        console.error('Error resetting password:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to reset password',
            message: error.message
        });
    }
});

// Get employee performance stats
router.get('/:employeeId/performance', async (req, res) => {
    try {
        // Use default business ID for testing (temporarily disabled auth)
        const businessId = req.user?.businessId || 'biz_fg27sj9ld_1760831311628';
        const { employeeId } = req.params;
        const { startDate, endDate } = req.query;

        // This would typically query orders table for employee performance
        // For now, return mock data
        const performanceData = {
            employeeId,
            period: {
                startDate: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
                endDate: endDate || new Date().toISOString()
            },
            stats: {
                totalOrders: 45,
                totalRevenue: 1250.75,
                averageOrderValue: 27.79,
                ordersPerDay: 1.5,
                customerRating: 4.6,
                onTimeDelivery: 95.5
            },
            trends: {
                ordersGrowth: 12.5,
                revenueGrowth: 8.3,
                ratingTrend: 0.2
            }
        };

        res.json({
            success: true,
            data: performanceData
        });
    } catch (error) {
        console.error('Error fetching employee performance:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch employee performance',
            message: error.message
        });
    }
});

// Get employee activity log
router.get('/:employeeId/activity', async (req, res) => {
    try {
        // Use default business ID for testing (temporarily disabled auth)
        const businessId = req.user?.businessId || 'biz_fg27sj9ld_1760831311628';
        const { employeeId } = req.params;
        const { limit = 50, offset = 0 } = req.query;

        // This would typically query an activity log table
        // For now, return mock data
        const activityLog = [
            {
                id: uuidv4(),
                employeeId,
                action: 'login',
                timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                details: 'Logged in from Chrome on Windows'
            },
            {
                id: uuidv4(),
                employeeId,
                action: 'order_created',
                timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
                details: 'Created order #12345 for $45.50'
            },
            {
                id: uuidv4(),
                employeeId,
                action: 'payment_processed',
                timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
                details: 'Processed payment for order #12344'
            }
        ];

        res.json({
            success: true,
            data: activityLog,
            pagination: {
                limit: parseInt(limit),
                offset: parseInt(offset),
                total: activityLog.length
            }
        });
    } catch (error) {
        console.error('Error fetching employee activity:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch employee activity',
            message: error.message
        });
    }
});

// Get employee statistics
router.get('/stats/overview', async (req, res) => {
    try {
        // Use default business ID for testing (temporarily disabled auth)
        const businessId = req.user?.businessId || 'biz_fg27sj9ld_1760831311628';

        const params = {
            TableName: 'pos-employees',
            KeyConditionExpression: 'businessId = :businessId',
            ExpressionAttributeValues: {
                ':businessId': businessId
            }
        };

        const result = await docClient.query(params).promise();

        const stats = {
            totalEmployees: result.Count,
            activeEmployees: result.Items.filter(emp => emp.isActive).length,
            inactiveEmployees: result.Items.filter(emp => !emp.isActive).length,
            newThisMonth: result.Items.filter(emp => {
                const hireDate = new Date(emp.hireDate || emp.createdAt);
                const thisMonth = new Date();
                thisMonth.setDate(1);
                return hireDate >= thisMonth;
            }).length
        };

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Error fetching employee stats:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch employee statistics',
            message: error.message
        });
    }
});

module.exports = router;
