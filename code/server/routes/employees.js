const express = require('express');
const { v4: uuidv4 } = require('uuid');
const Joi = require('joi');
const bcrypt = require('bcryptjs');
const AWS = require('aws-sdk');
const { Employee, Owner } = require('../models');
const { sendEmployeeCredentials } = require('../services/emailService');

// Initialize Cognito (keeping for employee authentication)
const cognito = new AWS.CognitoIdentityServiceProvider({
    region: process.env.AWS_REGION || 'us-east-1'
});

// Helper to get ownerId from request
const getOwnerId = (req) => {
    // ONLY use ownerId from cognitoSync middleware - it's the PostgreSQL UUID
    // DO NOT use businessId (Cognito string) or sub (Cognito UUID) - they're not the same!
    if (req.user?.ownerId) {
        return req.user.ownerId;
    }
    // If ownerId not set, sync middleware failed - return null to force error
    console.warn('⚠️ ownerId not set - cognitoSync middleware may have failed');
    return null;
};

const router = express.Router();

// Function to create Cognito user
const createCognitoUser = async (email, tempPassword, businessId) => {
    try {
        const userPoolId = process.env.AWS_USER_POOL_ID;

        const params = {
            UserPoolId: userPoolId,
            Username: email,
            UserAttributes: [
                {
                    Name: 'email',
                    Value: email
                },
                {
                    Name: 'email_verified',
                    Value: 'true'
                },
                {
                    Name: 'custom:userRole',
                    Value: 'employee'
                },
                {
                    Name: 'custom:businessId',
                    Value: businessId
                }
            ],
            TemporaryPassword: tempPassword,
            MessageAction: 'SUPPRESS' // Don't send welcome email
        };

        const result = await cognito.adminCreateUser(params).promise();
        console.log('✅ Cognito user created:', email);
        return result;
    } catch (error) {
        console.error('❌ Error creating Cognito user:', error);
        throw error;
    }
};

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
        console.log('👥 GET /api/employees - req.user:', {
            ownerId: req.user?.ownerId,
            businessId: req.user?.businessId,
            sub: req.user?.sub
        });
        const ownerId = getOwnerId(req);
        console.log('👥 Extracted ownerId:', ownerId, typeof ownerId);
        
        if (!ownerId) {
            console.error('❌ No ownerId found in request');
            return res.status(401).json({
                success: false,
                error: 'Unauthorized',
                message: 'Owner ID is required'
            });
        }

        // Validate UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(ownerId)) {
            console.error('❌ Invalid UUID format:', ownerId);
            return res.status(400).json({
                success: false,
                error: 'Invalid owner ID format',
                message: 'Owner ID must be a valid UUID'
            });
        }

        const { isActive, search } = req.query;
        const where = { ownerId };

        if (isActive !== undefined) {
            where.isActive = isActive === 'true';
        }

        if (search) {
            const { Op } = require('sequelize');
            where[Op.or] = [
                { firstName: { [Op.iLike]: `%${search}%` } },
                { lastName: { [Op.iLike]: `%${search}%` } },
                { email: { [Op.iLike]: `%${search}%` } }
            ];
        }

        const employees = await Employee.findAll({
            where,
            attributes: { exclude: ['password', 'tempPassword'] },
            order: [['createdAt', 'DESC']]
        });

        res.json({
            success: true,
            data: employees,
            count: employees.length
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
        const ownerId = getOwnerId(req);
        const { employeeId } = req.params;

        const employee = await Employee.findOne({
            where: {
                id: employeeId,
                ownerId: ownerId
            },
            attributes: { exclude: ['password', 'tempPassword'] }
        });

        if (!employee) {
            return res.status(404).json({
                success: false,
                error: 'Employee not found'
            });
        }

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
        const ownerId = getOwnerId(req);
        if (!ownerId) {
            return res.status(401).json({
                success: false,
                error: 'Unauthorized',
                message: 'Owner ID is required'
            });
        }

        // Validate input
        const { error, value } = employeeSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                error: 'Validation error',
                details: error.details
            });
        }

        // Check if employee with email already exists
        const existingEmployee = await Employee.findOne({
            where: { email: value.email }
        });
        if (existingEmployee) {
            return res.status(409).json({
                success: false,
                error: 'Employee with this email already exists'
            });
        }

        const tempPassword = Math.random().toString(36).slice(-8);
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        const employee = await Employee.create({
            ownerId,
            firstName: value.firstName,
            lastName: value.lastName,
            email: value.email,
            phone: value.phone,
            position: value.position,
            password: hashedPassword,
            tempPassword,
            isActive: value.isActive !== undefined ? value.isActive : true,
            loginCount: 0
        });

        // Create Cognito user (optional)
        try {
            await createCognitoUser(value.email, tempPassword, ownerId);
            console.log('✅ Cognito user created successfully');
        } catch (cognitoError) {
            console.error('❌ Cognito user creation failed:', cognitoError);
        }

        // Send login credentials email
        try {
            const owner = await Owner.findByPk(ownerId);
            const businessName = owner?.businessName || 'Your Restaurant';
            await sendEmployeeCredentials(
                value.email,
                `${value.firstName} ${value.lastName}`,
                tempPassword,
                businessName
            );
            console.log('✅ Employee credentials email sent successfully');
        } catch (emailError) {
            console.error('❌ Email sending failed:', emailError);
        }

        const safeEmployee = employee.toJSON();
        delete safeEmployee.password;
        delete safeEmployee.tempPassword;

        res.status(201).json({
            success: true,
            data: safeEmployee,
            message: 'Employee created successfully with login credentials',
            loginCredentials: {
                email: value.email,
                tempPassword: tempPassword,
                loginUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/employee-login`
            }
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
        console.log('📝 PUT /api/employees/:employeeId - Updating employee');
        const ownerId = getOwnerId(req);
        
        if (!ownerId) {
            console.error('❌ No ownerId in update request');
            return res.status(401).json({
                success: false,
                error: 'Unauthorized',
                message: 'Owner ID is required'
            });
        }

        const { employeeId } = req.params;
        console.log('📝 Update request - employeeId:', employeeId, 'ownerId:', ownerId);

        // Validate input
        const { error, value } = updateEmployeeSchema.validate(req.body);
        if (error) {
            console.error('❌ Validation error:', error.details);
            return res.status(400).json({
                success: false,
                error: 'Validation error',
                details: error.details
            });
        }

        // Check if employee exists
        const employee = await Employee.findOne({
            where: {
                id: employeeId,
                ownerId: ownerId
            }
        });

        if (!employee) {
            console.error('❌ Employee not found:', employeeId);
            return res.status(404).json({
                success: false,
                error: 'Employee not found',
                message: 'The employee does not exist or you do not have permission to update them'
            });
        }

        // If email is being updated, check for duplicates
        if (value.email && value.email !== employee.email) {
            const emailCheck = await Employee.findOne({
                where: { email: value.email }
            });
            if (emailCheck) {
                return res.status(409).json({
                    success: false,
                    error: 'Employee with this email already exists'
                });
            }
        }

        // Update employee
        await employee.update(value);
        await employee.reload(); // Reload to get updated values

        const safeEmployee = employee.toJSON();
        delete safeEmployee.password;
        delete safeEmployee.tempPassword;

        console.log('✅ Employee updated successfully:', employee.id);
        res.json({
            success: true,
            data: safeEmployee,
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
        console.log('🔄 PATCH /api/employees/:employeeId/status - Toggling employee status');
        const ownerId = getOwnerId(req);
        
        if (!ownerId) {
            console.error('❌ No ownerId in toggle status request');
            return res.status(401).json({
                success: false,
                error: 'Unauthorized',
                message: 'Owner ID is required'
            });
        }

        const { employeeId } = req.params;
        const { isActive } = req.body;
        console.log('🔄 Toggle status request - employeeId:', employeeId, 'isActive:', isActive, 'ownerId:', ownerId);

        if (typeof isActive !== 'boolean') {
            console.error('❌ Invalid isActive type:', typeof isActive);
            return res.status(400).json({
                success: false,
                error: 'isActive must be a boolean value'
            });
        }

        const employee = await Employee.findOne({
            where: {
                id: employeeId,
                ownerId: ownerId
            }
        });

        if (!employee) {
            console.error('❌ Employee not found:', employeeId);
            return res.status(404).json({
                success: false,
                error: 'Employee not found',
                message: 'The employee does not exist or you do not have permission to update them'
            });
        }

        employee.isActive = isActive;
        await employee.save();
        await employee.reload(); // Reload to get updated values

        const safeEmployee = employee.toJSON();
        delete safeEmployee.password;
        delete safeEmployee.tempPassword;

        console.log('✅ Employee status updated successfully:', employee.id, '→', isActive);
        res.json({
            success: true,
            data: safeEmployee,
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
        const ownerId = getOwnerId(req);
        const { employeeId } = req.params;

        const employee = await Employee.findOne({
            where: {
                id: employeeId,
                ownerId: ownerId
            }
        });

        if (!employee) {
            return res.status(404).json({
                success: false,
                error: 'Employee not found'
            });
        }

        // Generate new temporary password
        const tempPassword = Math.random().toString(36).slice(-8);
        employee.password = await bcrypt.hash(tempPassword, 10);
        employee.tempPassword = tempPassword;
        await employee.save();

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
        // Generate user-specific business ID for testing
        const businessId = req.user?.businessId || generateUserBusinessId(req);
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
        // Generate user-specific business ID for testing
        const businessId = req.user?.businessId || generateUserBusinessId(req);
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
        const ownerId = getOwnerId(req);
        
        const employees = await Employee.findAll({
            where: { ownerId }
        });

        const thisMonth = new Date();
        thisMonth.setDate(1);

        const stats = {
            totalEmployees: employees.length,
            activeEmployees: employees.filter(emp => emp.isActive).length,
            inactiveEmployees: employees.filter(emp => !emp.isActive).length,
            newThisMonth: employees.filter(emp => {
                const createdDate = new Date(emp.createdAt);
                return createdDate >= thisMonth;
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

// Resend login credentials to employee
router.post('/:employeeId/resend-credentials', async (req, res) => {
    try {
        const ownerId = getOwnerId(req);
        const { employeeId } = req.params;

        const employee = await Employee.findOne({
            where: {
                id: employeeId,
                ownerId: ownerId
            }
        });

        if (!employee) {
            return res.status(404).json({
                success: false,
                error: 'Employee not found'
            });
        }

        // Generate new temporary password
        const tempPassword = Math.random().toString(36).slice(-8);
        employee.password = await bcrypt.hash(tempPassword, 10);
        employee.tempPassword = tempPassword;
        await employee.save();

        // Update Cognito user password
        try {
            const userPoolId = process.env.AWS_USER_POOL_ID;
            await cognito.adminSetUserPassword({
                UserPoolId: userPoolId,
                Username: employee.email,
                Password: tempPassword,
                Permanent: false
            }).promise();
            console.log('✅ Cognito password updated for:', employee.email);
        } catch (cognitoError) {
            console.error('❌ Cognito password update failed:', cognitoError);
        }

        // Send new credentials email
        try {
            const owner = await Owner.findByPk(ownerId);
            const businessName = owner?.businessName || 'Your Restaurant';
            await sendEmployeeCredentials(
                employee.email,
                `${employee.firstName} ${employee.lastName}`,
                tempPassword,
                businessName
            );
            console.log('✅ New credentials email sent to:', employee.email);
        } catch (emailError) {
            console.error('❌ Email sending failed:', emailError);
        }

        res.json({
            success: true,
            message: 'Login credentials resent successfully',
            loginCredentials: {
                email: employee.email,
                tempPassword: tempPassword,
                loginUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/employee-login`
            }
        });

    } catch (error) {
        console.error('Error resending credentials:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to resend credentials',
            message: error.message
        });
    }
});

// Delete employee
router.delete('/:employeeId', async (req, res) => {
    try {
        console.log('🗑️ DELETE /api/employees/:employeeId - Deleting employee');
        const ownerId = getOwnerId(req);
        
        if (!ownerId) {
            console.error('❌ No ownerId in delete request');
            return res.status(401).json({
                success: false,
                error: 'Unauthorized',
                message: 'Owner ID is required'
            });
        }

        const { employeeId } = req.params;
        console.log('🗑️ Delete request - employeeId:', employeeId, 'ownerId:', ownerId);

        const employee = await Employee.findOne({
            where: {
                id: employeeId,
                ownerId: ownerId
            }
        });

        if (!employee) {
            console.error('❌ Employee not found:', employeeId);
            return res.status(404).json({
                success: false,
                error: 'Employee not found',
                message: 'The employee does not exist or you do not have permission to delete them'
            });
        }

        // Delete from database
        await employee.destroy();

        // Delete from Cognito
        try {
            const userPoolId = process.env.AWS_USER_POOL_ID;
            await cognito.adminDeleteUser({
                UserPoolId: userPoolId,
                Username: employee.email
            }).promise();
            console.log('✅ Cognito user deleted:', employee.email);
        } catch (cognitoError) {
            console.error('❌ Cognito user deletion failed:', cognitoError);
        }

        console.log('✅ Employee deleted:', {
            employeeId,
            email: employee.email,
            ownerId
        });

        res.json({
            success: true,
            message: 'Employee deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting employee:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete employee',
            message: error.message
        });
    }
});

module.exports = router;
