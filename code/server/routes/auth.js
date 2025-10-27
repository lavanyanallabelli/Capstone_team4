const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const Joi = require('joi');
const { docClient } = require('../config/dynamodb');

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
        const existingUserParams = {
            TableName: 'pos-users',
            IndexName: 'email-index',
            KeyConditionExpression: 'email = :email',
            ExpressionAttributeValues: {
                ':email': email
            }
        };

        const existingUser = await docClient.query(existingUserParams).promise();
        if (existingUser.Items.length > 0) {
            return res.status(409).json({
                success: false,
                error: 'User already exists',
                message: 'An account with this email already exists'
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        const userId = uuidv4();
        const businessId = uuidv4();

        // Create user
        const user = {
            userId,
            businessId,
            email,
            password: hashedPassword,
            firstName,
            lastName,
            businessName,
            businessType,
            phone,
            userRole: 'owner',
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lastLogin: null,
            loginCount: 0
        };

        const userParams = {
            TableName: 'pos-users',
            Item: user
        };

        await docClient.put(userParams).promise();

        // Generate JWT token
        const token = jwt.sign(
            {
                sub: userId,
                email: user.email,
                'custom:userRole': user.userRole,
                'custom:businessId': businessId,
                'custom:businessName': businessName,
                'custom:businessType': businessType,
                'custom:phone': phone
            },
            process.env.JWT_SECRET || 'fallback-secret',
            { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
        );

        // Remove sensitive data from response
        const { password: _, ...safeUser } = user;

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
        const userParams = {
            TableName: 'pos-users',
            IndexName: 'email-index',
            KeyConditionExpression: 'email = :email',
            ExpressionAttributeValues: {
                ':email': email
            }
        };

        const userResult = await docClient.query(userParams).promise();
        if (userResult.Items.length === 0) {
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials',
                message: 'Email or password is incorrect'
            });
        }

        const user = userResult.Items[0];

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
        const updateParams = {
            TableName: 'pos-users',
            Key: { userId: user.userId },
            UpdateExpression: 'SET lastLogin = :lastLogin, loginCount = :loginCount, updatedAt = :updatedAt',
            ExpressionAttributeValues: {
                ':lastLogin': new Date().toISOString(),
                ':loginCount': (user.loginCount || 0) + 1,
                ':updatedAt': new Date().toISOString()
            }
        };

        await docClient.update(updateParams).promise();

        // Generate JWT token
        const token = jwt.sign(
            {
                sub: user.userId,
                email: user.email,
                'custom:userRole': user.userRole,
                'custom:businessId': user.businessId,
                'custom:businessName': user.businessName,
                'custom:businessType': user.businessType,
                'custom:phone': user.phone
            },
            process.env.JWT_SECRET || 'fallback-secret',
            { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
        );

        // Remove sensitive data from response
        const { password: _, ...safeUser } = user;

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

        // Find employee by employeeId
        const employeeParams = {
            TableName: 'pos-employees',
            FilterExpression: 'employeeId = :employeeId',
            ExpressionAttributeValues: {
                ':employeeId': employeeId
            }
        };

        const employeeResult = await docClient.scan(employeeParams).promise();
        if (employeeResult.Items.length === 0) {
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials',
                message: 'Employee ID or password is incorrect'
            });
        }

        const employee = employeeResult.Items[0];

        // Check if employee is active
        if (!employee.isActive) {
            return res.status(401).json({
                success: false,
                error: 'Account deactivated',
                message: 'Your employee account has been deactivated. Please contact your manager.'
            });
        }

        // Verify password (check both hashed password and temporary password)
        const isValidPassword = await bcrypt.compare(password, employee.password) ||
            password === employee.tempPassword;

        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials',
                message: 'Employee ID or password is incorrect'
            });
        }

        // Update last login
        const updateParams = {
            TableName: 'pos-employees',
            Key: {
                businessId: employee.businessId,
                employeeId: employee.employeeId
            },
            UpdateExpression: 'SET lastLogin = :lastLogin, loginCount = :loginCount, updatedAt = :updatedAt',
            ExpressionAttributeValues: {
                ':lastLogin': new Date().toISOString(),
                ':loginCount': (employee.loginCount || 0) + 1,
                ':updatedAt': new Date().toISOString()
            }
        };

        await docClient.update(updateParams).promise();

        // Generate JWT token
        const token = jwt.sign(
            {
                sub: employee.employeeId,
                email: employee.email,
                'custom:userRole': 'employee',
                'custom:businessId': employee.businessId,
                'custom:businessName': employee.businessName || 'Restaurant',
                'custom:businessType': 'Restaurant',
                'custom:phone': employee.phone
            },
            process.env.JWT_SECRET || 'fallback-secret',
            { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
        );

        // Remove sensitive data from response
        const { password: _, tempPassword: __, ...safeEmployee } = employee;

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
        const userParams = {
            TableName: 'pos-users',
            Key: { userId }
        };

        const userResult = await docClient.get(userParams).promise();
        if (!userResult.Item) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        const user = userResult.Item;

        // Verify current password
        const isValidPassword = await bcrypt.compare(currentPassword, user.password);
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                error: 'Invalid current password'
            });
        }

        // Hash new password
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        // Update password
        const updateParams = {
            TableName: 'pos-users',
            Key: { userId },
            UpdateExpression: 'SET password = :password, updatedAt = :updatedAt',
            ExpressionAttributeValues: {
                ':password': hashedNewPassword,
                ':updatedAt': new Date().toISOString()
            }
        };

        await docClient.update(updateParams).promise();

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
                    userRole: decoded['custom:userRole'],
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
