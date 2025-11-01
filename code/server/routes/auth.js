const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const Joi = require('joi');
const { Owner, Employee } = require('../models');

const router = express.Router();

// Validation schemas
const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required()
});

const registerSchema = Joi.object({
    firstName: Joi.string().min(1).max(50).required(),
    lastName: Joi.string().min(1).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    businessName: Joi.string().min(1).max(100).required(),
    businessType: Joi.string().valid('Restaurant', 'Cafe', 'Fast Food', 'Fine Dining', 'Bar').required(),
    phone: Joi.string().pattern(/^\+?[\d\s\-\(\)]+$/).required()
});

const changePasswordSchema = Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().min(6).required()
});

// Register new business owner
router.post('/register', async (req, res) => {
    try {
        // Validate input
        const { error, value } = registerSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                error: 'Validation error',
                details: error.details
            });
        }

        const { firstName, lastName, email, password, businessName, businessType, phone } = value;

        // Check if user already exists
        const existingUser = await Owner.findOne({ where: { email } });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                error: 'User already exists',
                message: 'An account with this email already exists'
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = await Owner.create({
            name: `${firstName} ${lastName}`,
            email,
            password: hashedPassword,
            phone,
            businessName,
            businessType,
            isActive: true,
            loginCount: 0
        });

        // Generate JWT token
        const token = jwt.sign(
            {
                sub: user.id,
                email: user.email,
                'custom:userRole': 'owner',
                'custom:businessId': user.id,
                'custom:businessName': businessName,
                'custom:businessType': businessType,
                'custom:phone': phone
            },
            process.env.JWT_SECRET || 'fallback-secret',
            { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
        );

        // Remove sensitive data from response
        const safeUser = user.toJSON();
        delete safeUser.password;

        res.status(201).json({
            success: true,
            data: {
                user: safeUser,
                token
            },
            message: 'Account created successfully'
        });
    } catch (error) {
        console.error('Error during registration:', error);
        res.status(500).json({
            success: false,
            error: 'Registration failed',
            message: error.message
        });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        // Validate input
        const { error, value } = loginSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                error: 'Validation error',
                details: error.details
            });
        }

        const { email, password } = value;

        // Find user by email
        const user = await Owner.findOne({ where: { email } });
        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials',
                message: 'Email or password is incorrect'
            });
        }

        // Check if user is active
        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                error: 'Account deactivated',
                message: 'Your account has been deactivated. Please contact support.'
            });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials',
                message: 'Email or password is incorrect'
            });
        }

        // Update last login and login count
        user.lastLogin = new Date();
        user.loginCount = (user.loginCount || 0) + 1;
        await user.save();

        // Generate JWT token
        const token = jwt.sign(
            {
                sub: user.id,
                email: user.email,
                'custom:userRole': 'owner',
                'custom:businessId': user.id,
                'custom:businessName': user.businessName,
                'custom:businessType': user.businessType,
                'custom:phone': user.phone
            },
            process.env.JWT_SECRET || 'fallback-secret',
            { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
        );

        // Remove sensitive data from response
        const safeUser = user.toJSON();
        delete safeUser.password;

        res.json({
            success: true,
            data: {
                user: safeUser,
                token
            },
            message: 'Login successful'
        });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({
            success: false,
            error: 'Login failed',
            message: error.message
        });
    }
});

// Employee login (using employee ID and temporary password)
router.post('/employee-login', async (req, res) => {
    try {
        const { employeeId, password } = req.body;

        if (!employeeId || !password) {
            return res.status(400).json({
                success: false,
                error: 'Missing credentials',
                message: 'Employee ID and password are required'
            });
        }

        // Find employee by ID
        const employee = await Employee.findByPk(employeeId);
        if (!employee) {
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials',
                message: 'Employee ID or password is incorrect'
            });
        }

        // Check if employee is active
        if (!employee.isActive) {
            return res.status(401).json({
                success: false,
                error: 'Account deactivated',
                message: 'Your employee account has been deactivated. Please contact your manager.'
            });
        }

        // Verify password (check both hashed password and temporary password)
        const isValidPassword = (employee.password && await bcrypt.compare(password, employee.password)) ||
            password === employee.tempPassword;

        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials',
                message: 'Employee ID or password is incorrect'
            });
        }

        // Update last login
        employee.lastLogin = new Date();
        employee.loginCount = (employee.loginCount || 0) + 1;
        await employee.save();

        // Get owner/business info
        const owner = await Owner.findByPk(employee.ownerId);

        // Generate JWT token
        const token = jwt.sign(
            {
                sub: employee.id,
                email: employee.email,
                'custom:userRole': 'employee',
                'custom:businessId': employee.ownerId,
                'custom:businessName': owner?.businessName || 'Restaurant',
                'custom:businessType': owner?.businessType || 'Restaurant',
                'custom:phone': employee.phone
            },
            process.env.JWT_SECRET || 'fallback-secret',
            { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
        );

        // Remove sensitive data from response
        const safeEmployee = employee.toJSON();
        delete safeEmployee.password;
        delete safeEmployee.tempPassword;

        res.json({
            success: true,
            data: {
                user: safeEmployee,
                token
            },
            message: 'Employee login successful'
        });
    } catch (error) {
        console.error('Error during employee login:', error);
        res.status(500).json({
            success: false,
            error: 'Employee login failed',
            message: error.message
        });
    }
});

// Change password
router.post('/change-password', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Access token required'
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
        const userId = decoded.sub;

        // Validate input
        const { error, value } = changePasswordSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                error: 'Validation error',
                details: error.details
            });
        }

        const { currentPassword, newPassword } = value;

        // Get user
        const user = await Owner.findByPk(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        // Verify current password
        const isValidPassword = await bcrypt.compare(currentPassword, user.password);
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                error: 'Invalid current password'
            });
        }

        // Hash new password and update
        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        res.json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error) {
        console.error('Error changing password:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to change password',
            message: error.message
        });
    }
});

// Verify token
router.get('/verify', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Access token required'
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');

        res.json({
            success: true,
            data: {
                valid: true,
                user: {
                    sub: decoded.sub,
                    email: decoded.email,
                    userRole: decoded['custom:userRole'] || 'owner',
                    businessId: decoded['custom:businessId'],
                    businessName: decoded['custom:businessName'],
                    businessType: decoded['custom:businessType'],
                    phone: decoded['custom:phone']
                }
            }
        });
    } catch (error) {
        res.status(401).json({
            success: false,
            error: 'Invalid token',
            data: { valid: false }
        });
    }
});

// Logout (client-side token removal)
router.post('/logout', (req, res) => {
    res.json({
        success: true,
        message: 'Logout successful'
    });
});

module.exports = router;
