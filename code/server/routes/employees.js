const express = require('express');
const { v4: uuidv4 } = require('uuid');
const Joi = require('joi');
const bcrypt = require('bcryptjs');
const { Employee, Owner } = require('../models');
const { sendEmployeeCredentials } = require('../services/emailService');

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

// Function to get or create owner prefix (6-digit random number)
const getOwnerPrefix = async (ownerId) => {
    const { Owner } = require('../models');
    const owner = await Owner.findByPk(ownerId);

    if (!owner) {
        throw new Error('Owner not found');
    }

    // Check if owner has a prefix stored (we'll add a custom field, but for now generate based on owner ID)
    // Generate a consistent 6-digit prefix based on owner ID hash
    // This ensures each owner gets their own unique prefix
    const ownerIdHash = ownerId.split('-').join('');
    const prefix = parseInt(ownerIdHash.slice(0, 6), 16).toString().padStart(6, '0').slice(0, 6);

    // Ensure it's exactly 6 digits and starts with 1-9 (not 0)
    let numericPrefix = parseInt(prefix);
    if (numericPrefix === 0 || numericPrefix.toString().length < 6) {
        // If hash results in too small number, use a different method
        numericPrefix = parseInt(ownerIdHash.slice(0, 12), 16) % 900000 + 100000; // Range: 100000-999999
    }

    return numericPrefix.toString().padStart(6, '0');
};

// Function to generate sequential employee ID for each owner (e.g., 1234561, 1234562)
const generateEmployeeId = async (ownerId) => {
    const prefix = '100200'; // Will be replaced with owner-specific prefix
    try {
        const { Op } = require('sequelize');

        // Get owner-specific prefix (6-digit number)
        const ownerPrefix = await getOwnerPrefix(ownerId);
        console.log(`🔑 Owner prefix: ${ownerPrefix} for owner ${ownerId}`);

        // Find all employees for this owner (regardless of prefix, in case prefix changes)
        const employees = await Employee.findAll({
            where: {
                ownerId: ownerId,
                employeeId: {
                    [Op.ne]: null
                }
            },
            attributes: ['employeeId']
        });

        console.log(`🔍 Found ${employees.length} employees for owner ${ownerId}`);

        let maxNumber = 0;
        if (employees.length > 0) {
            // Extract numbers from all employeeIds that match this owner's prefix
            employees.forEach(emp => {
                if (emp.employeeId && emp.employeeId.startsWith(ownerPrefix)) {
                    const number = parseInt(emp.employeeId.substring(6), 10); // Extract number after 6-digit prefix
                    if (!isNaN(number) && number > maxNumber) {
                        maxNumber = number;
                    }
                }
            });
            console.log(`📊 Max employee number found for owner: ${maxNumber}`);
        }

        const nextNumber = maxNumber + 1;
        const newEmployeeId = `${ownerPrefix}${nextNumber}`;

        console.log(`✅ Generated new employee ID: ${newEmployeeId}`);

        // Double-check this ID doesn't already exist (race condition protection)
        const exists = await Employee.findOne({
            where: {
                employeeId: newEmployeeId
            }
        });

        if (exists) {
            console.warn(`⚠️ Employee ID ${newEmployeeId} already exists! Trying next number...`);
            // Try next number
            const nextAttempt = `${ownerPrefix}${nextNumber + 1}`;
            const existsNext = await Employee.findOne({
                where: {
                    employeeId: nextAttempt
                }
            });
            if (existsNext) {
                // Try a few more numbers
                for (let i = nextNumber + 2; i < nextNumber + 10; i++) {
                    const testId = `${ownerPrefix}${i}`;
                    const testExists = await Employee.findOne({
                        where: { employeeId: testId }
                    });
                    if (!testExists) {
                        return testId;
                    }
                }
                // If all fail, throw error
                throw new Error(`Multiple employee IDs conflict. Unable to generate unique ID.`);
            }
            return nextAttempt;
        }

        return newEmployeeId;
    } catch (error) {
        console.error('❌ Error generating employee ID:', error);
        // Fallback: use owner prefix + timestamp
        try {
            const ownerPrefix = await getOwnerPrefix(ownerId);
            const fallbackId = `${ownerPrefix}${Date.now().toString().slice(-4)}`;
            console.log(`⚠️ Using fallback employee ID: ${fallbackId}`);
            return fallbackId;
        } catch (fallbackError) {
            // Last resort: use owner ID hash + timestamp
            const emergencyPrefix = ownerId.slice(0, 6).replace(/-/g, '');
            const fallbackId = `${emergencyPrefix}${Date.now().toString().slice(-4)}`;
            console.log(`⚠️ Using emergency fallback employee ID: ${fallbackId}`);
            return fallbackId;
        }
    }
};

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
    firstName: Joi.string().trim().min(1).max(50).required()
        .messages({
            'string.empty': 'First name is required',
            'string.min': 'First name must be at least 1 character',
            'any.required': 'First name is required'
        }),
    lastName: Joi.string().trim().min(1).max(50).required()
        .messages({
            'string.empty': 'Last name is required',
            'string.min': 'Last name must be at least 1 character',
            'any.required': 'Last name is required'
        }),
    email: Joi.string().email().trim().lowercase().required()
        .messages({
            'string.email': 'Email must be a valid email address',
            'string.empty': 'Email is required',
            'any.required': 'Email is required'
        }),
    phone: Joi.string().trim().pattern(/^\+?[\d\s\-\(\)]+$/).allow('', null).optional()
        .messages({
            'string.pattern.base': 'Phone number format is invalid'
        }),
    position: Joi.string().trim().max(50).allow('', null).optional(),
    hireDate: Joi.date().optional().allow(null),
    salary: Joi.number().positive().optional().allow(null),
    isActive: Joi.boolean().default(true),
    permissions: Joi.array().items(Joi.string()).optional().default([])
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
        console.log('📝 POST /api/employees - Request body:', req.body);
        const { error, value } = employeeSchema.validate(req.body, {
            abortEarly: false, // Return all validation errors
            stripUnknown: true // Remove unknown fields
        });
        if (error) {
            console.error('❌ Validation error details:', error.details);
            console.error('❌ Validation error messages:', error.details.map(d => d.message).join(', '));
            return res.status(400).json({
                success: false,
                error: 'Validation error',
                message: error.details.map(d => d.message).join(', '),
                details: error.details
            });
        }

        // Check if employee with email already exists (case-insensitive)
        const normalizedEmail = value.email.trim().toLowerCase();
        const existingEmployee = await Employee.findOne({
            where: {
                email: normalizedEmail
            }
        });
        if (existingEmployee) {
            console.error('❌ Duplicate email detected:', normalizedEmail);
            return res.status(409).json({
                success: false,
                error: 'Employee with this email already exists',
                message: `An employee with the email "${normalizedEmail}" already exists. Please use a different email address.`
            });
        }

        // No password required - employees login with employee ID only
        const hashedPassword = null;

        // Generate sequential employee ID (1002001, 1002002, etc.)
        let employeeId = await generateEmployeeId(ownerId);
        console.log('📝 Generated employee ID:', employeeId);

        // Check again if this ID exists (race condition protection)
        const idExists = await Employee.findOne({
            where: { employeeId: employeeId }
        });
        if (idExists) {
            console.error(`❌ Race condition detected: Employee ID ${employeeId} exists! Regenerating...`);
            // Regenerate with a new number
            employeeId = await generateEmployeeId(ownerId);
            console.log('📝 Regenerated employee ID:', employeeId);
        }

        // Define manager permissions based on position
        let employeePermissions = value.permissions || [];
        if (value.position && value.position.trim().toLowerCase() === 'manager') {
            // Assign manager permissions: Add staff, Schedule management, Manage menu, View analytics
            employeePermissions = [
                'canCreateEmployee',      // Add staff
                'canEditEmployee',
                'canDeactivateEmployee',
                'canViewEmployeeActivity',
                'canManageMenuItems',     // Manage menu
                'canManageMenuCategories',
                'canToggleItemAvailability',
                'canManageSchedules',     // Schedule management
                'canViewSalesAnalytics',  // View analytics
                'canViewEmployeePerformance',
                'canViewRevenueBreakdown',
                'canViewAllOrders',
                'canUpdateOrders',
                'canCancelOrders',
                'canProcessPayments',
                'canViewAllTransactions',
                'canHandleRefunds',
                'canApplyDiscounts',
                'canViewMenuItems',
                'canNotifyItemUnavailable',
                'canUpdatePersonalDetails'
                // Note: CAN_MANAGE_RESTAURANT_DETAILS is intentionally excluded
            ];
            console.log('👔 Manager permissions assigned:', employeePermissions);
        }

        // Normalize empty strings to null for optional fields
        // Set hireDate to current date if not provided
        const hireDate = value.hireDate ? new Date(value.hireDate) : new Date();

        const employee = await Employee.create({
            ownerId,
            employeeId, // Add the generated employee ID
            firstName: value.firstName.trim(),
            lastName: value.lastName.trim(),
            email: value.email.trim().toLowerCase(),
            phone: value.phone && value.phone.trim() ? value.phone.trim() : null,
            position: value.position && value.position.trim() ? value.position.trim() : null,
            hireDate: hireDate,
            password: hashedPassword,
            tempPassword: null,
            isActive: value.isActive !== undefined ? value.isActive : true,
            permissions: employeePermissions,
            loginCount: 0
        });

        // Email sending removed - owner will send emails manually via the email modal

        const safeEmployee = employee.toJSON();
        delete safeEmployee.password;
        delete safeEmployee.tempPassword;

        res.status(201).json({
            success: true,
            data: safeEmployee,
            message: 'Employee created successfully. Use the email icon to send login credentials.',
            loginCredentials: {
                employeeId: employeeId,
                email: value.email,
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

// Send email to employee (manual email sending)
router.post('/:employeeId/send-email', async (req, res) => {
    try {
        const ownerId = getOwnerId(req);
        const { employeeId } = req.params;
        const { to, subject, message } = req.body;

        if (!to || !subject || !message) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields',
                message: 'to, subject, and message are required'
            });
        }

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

        // Use Gmail email (SMTP_USER) - no business email
        const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
        const smtpUser = process.env.SMTP_USER;
        const smtpPass = process.env.SMTP_PASS;
        const smtpPort = parseInt(process.env.SMTP_PORT) || 587;
        const smtpSecure = process.env.SMTP_SECURE === 'true' || smtpPort === 465;

        // Debug logging (mask sensitive data)
        console.log('🔍 SMTP Configuration Check:');
        console.log('   SMTP_HOST:', smtpHost);
        console.log('   SMTP_USER:', smtpUser ? `${smtpUser.substring(0, 3)}***${smtpUser.substring(smtpUser.indexOf('@'))}` : 'NOT SET');
        console.log('   SMTP_PASS:', smtpPass ? `${smtpPass.substring(0, 4)}***` : 'NOT SET');
        console.log('   SMTP_PORT:', smtpPort);

        if (!smtpUser || !smtpPass) {
            console.error('❌ SMTP configuration missing!');
            console.error('   SMTP_USER:', smtpUser || 'MISSING');
            console.error('   SMTP_PASS:', smtpPass ? 'SET' : 'MISSING');
            return res.status(500).json({
                success: false,
                error: 'SMTP configuration missing',
                message: 'Please configure SMTP_HOST, SMTP_USER, and SMTP_PASS (App Password) in your .env file. Make sure you restarted the server after updating .env!'
            });
        }

        // Get owner info for business name in email content only
        const owner = await Owner.findByPk(ownerId);
        const businessName = owner?.businessName || 'Your Restaurant';

        // Send email using SMTP (Gmail with App Password)
        try {
            const nodemailer = require('nodemailer');

            // Detect email provider and configure accordingly
            let config;
            const isGmail = smtpHost.includes('gmail.com') || smtpUser.includes('@gmail.com');
            const isOutlook = smtpHost.includes('outlook.com') || smtpHost.includes('hotmail.com') || smtpHost.includes('live.com');

            if (isGmail) {
                // Gmail SMTP configuration
                config = {
                    host: 'smtp.gmail.com',
                    port: 587,
                    secure: false, // false for 587 (STARTTLS)
                    auth: {
                        user: smtpUser.trim(), // Gmail email
                        pass: smtpPass.trim().replace(/\s+/g, '') // Gmail App Password (remove spaces)
                    },
                    tls: {
                        rejectUnauthorized: false
                    },
                    connectionTimeout: 20000,
                    greetingTimeout: 20000,
                    socketTimeout: 20000
                };
                console.log('📧 Using Gmail SMTP configuration');
            } else if (isOutlook) {
                // Outlook SMTP configuration
                config = {
                    host: 'smtp-mail.outlook.com',
                    port: 587,
                    secure: false,
                    requireTLS: true,
                    auth: {
                        user: smtpUser.trim().toLowerCase(),
                        pass: smtpPass.trim().replace(/\s+/g, '')
                    },
                    tls: {
                        rejectUnauthorized: false
                    },
                    connectionTimeout: 20000,
                    greetingTimeout: 20000,
                    socketTimeout: 20000
                };
                console.log('📧 Using Outlook SMTP configuration');
            } else {
                // Generic SMTP configuration
                config = {
                    host: smtpHost,
                    port: smtpPort,
                    secure: smtpSecure,
                    auth: {
                        user: smtpUser.trim(),
                        pass: smtpPass.trim().replace(/\s+/g, '')
                    },
                    tls: {
                        rejectUnauthorized: false
                    },
                    connectionTimeout: 20000,
                    greetingTimeout: 20000,
                    socketTimeout: 20000
                };
                console.log('📧 Using generic SMTP configuration');
            }

            console.log('📧 Attempting SMTP connection...');
            console.log('   Host:', config.host);
            console.log('   Port:', config.port);
            console.log('   User:', smtpUser.substring(0, 3) + '***' + smtpUser.substring(smtpUser.indexOf('@')));

            const transporter = nodemailer.createTransport(config);

            // Test connection
            try {
                await transporter.verify();
                console.log('✅ SMTP connection verified');
                console.log('   📧 Authenticated as:', smtpUser);
            } catch (verifyError) {
                console.error('❌ SMTP verification failed:', verifyError.message);
                throw verifyError;
            }

            // Use Gmail/email (SMTP_USER) for everything - sender and reply-to
            const mailOptions = {
                from: `"${businessName}" <${smtpUser}>`, // Gmail email as sender
                replyTo: smtpUser, // Replies also go to Gmail email
                to: to,
                subject: subject,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                            <h1 style="color: white; margin: 0; font-size: 24px;">${businessName}</h1>
                        </div>
                        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                            <div style="white-space: pre-wrap; color: #333; line-height: 1.6;">${message.replace(/\n/g, '<br>')}</div>
                        </div>
                        <p style="color: #999; font-size: 12px; text-align: center; margin-top: 20px;">
                            This is an automated message from ${businessName} POS System.
                        </p>
                    </div>
                `
            };

            await transporter.sendMail(mailOptions);
            console.log('✅ Email sent successfully via SMTP!');
            console.log('   📧 From:', smtpUser);
            console.log('   📬 Reply-To:', smtpUser);
            console.log('   📨 To:', to);
            console.log('   📝 Subject:', subject);

            res.json({
                success: true,
                message: 'Email sent successfully'
            });
        } catch (emailError) {
            console.error('❌ Email sending failed:', emailError);
            res.status(500).json({
                success: false,
                error: 'Failed to send email',
                message: emailError.message || 'Email sending failed. Please check SMTP configuration.'
            });
        }

    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to send email',
            message: error.message
        });
    }
});

// Resend login credentials to employee (kept for backward compatibility, but email sending removed)
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

        // Email sending removed - owner will send emails manually via the email modal

        res.json({
            success: true,
            message: 'Credentials updated successfully. Use the email icon to send login credentials.',
            loginCredentials: {
                employeeId: employee.employeeId,
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
