const express = require('express');
const Joi = require('joi');
const { Setting, Owner } = require('../models');
const { authorizePermission } = require('../middleware/auth');

// Helper to get ownerId from request
const getOwnerId = (req) => {
    // ONLY use ownerId from cognitoSync middleware - it's the PostgreSQL UUID
    if (req.user?.ownerId) {
        return req.user.ownerId;
    }
    console.warn('⚠️ ownerId not set - cognitoSync middleware may have failed');
    return null;
};

// SECURITY: Verify that ownerId belongs to the authenticated user's email
const verifyOwnerEmail = async (req, ownerId) => {
    if (!req.user?.email) {
        console.error('🚨 SECURITY: No email in request user');
        return { valid: false, error: 'Email not found in authentication token' };
    }

    if (!ownerId) {
        console.error('🚨 SECURITY: No ownerId provided');
        return { valid: false, error: 'Owner ID is required' };
    }

    const owner = await Owner.findByPk(ownerId);
    if (!owner) {
        console.error('🚨 SECURITY: Owner not found:', ownerId);
        return { valid: false, error: 'Owner not found' };
    }

    // CRITICAL: Verify email matches
    if (owner.email !== req.user.email) {
        console.error('🚨 SECURITY ALERT: Email mismatch in settings access!', {
            authenticatedEmail: req.user.email,
            ownerEmail: owner.email,
            ownerId: owner.id
        });
        return { valid: false, error: 'Access denied: Email mismatch' };
    }

    console.log('✅ Email verification passed:', {
        authenticatedEmail: req.user.email,
        ownerEmail: owner.email,
        ownerId: owner.id
    });

    return { valid: true, owner };
};

const router = express.Router();

// Validation schemas
const generalSettingsSchema = Joi.object({
    restaurantName: Joi.string().min(1).max(100).required(),
    businessType: Joi.string().valid('Restaurant', 'Cafe', 'Fast Food', 'Fine Dining', 'Bar').required(),
    address: Joi.string().max(200).required(),
    phone: Joi.string().pattern(/^\+?[\d\s\-\(\)]+$/).required(),
    email: Joi.string().email().required(),
    website: Joi.string().uri().optional(),
    description: Joi.string().max(500).optional(),
    logo: Joi.string().uri().optional()
});

const hoursSettingsSchema = Joi.object({
    monday: Joi.object({
        open: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
        close: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
        closed: Joi.boolean().default(false)
    }).required(),
    tuesday: Joi.object({
        open: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
        close: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
        closed: Joi.boolean().default(false)
    }).required(),
    wednesday: Joi.object({
        open: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
        close: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
        closed: Joi.boolean().default(false)
    }).required(),
    thursday: Joi.object({
        open: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
        close: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
        closed: Joi.boolean().default(false)
    }).required(),
    friday: Joi.object({
        open: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
        close: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
        closed: Joi.boolean().default(false)
    }).required(),
    saturday: Joi.object({
        open: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
        close: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
        closed: Joi.boolean().default(false)
    }).required(),
    sunday: Joi.object({
        open: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
        close: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
        closed: Joi.boolean().default(false)
    }).required()
});

const paymentSettingsSchema = Joi.object({
    stripePublicKey: Joi.string().optional(),
    stripeSecretKey: Joi.string().optional(),
    paypalClientId: Joi.string().optional(),
    taxRate: Joi.number().min(0).max(100).precision(2).required(),
    serviceCharge: Joi.number().min(0).max(100).precision(2).default(0),
    currency: Joi.string().valid('USD', 'EUR', 'GBP', 'CAD').default('USD')
});

const notificationSettingsSchema = Joi.object({
    emailNotifications: Joi.boolean().default(true),
    smsNotifications: Joi.boolean().default(false),
    orderAlerts: Joi.boolean().default(true),
    lowInventoryAlerts: Joi.boolean().default(true),
    dailyReports: Joi.boolean().default(true),
    weeklyReports: Joi.boolean().default(true),
    monthlyReports: Joi.boolean().default(false)
});

// Get all settings
router.get('/', authorizePermission('canManageRestaurantDetails'), async (req, res) => {
    try {
        console.log('⚙️ GET /api/settings - Fetching settings');
        console.log('🔍 Request user info:', {
            email: req.user?.email,
            ownerId: req.user?.ownerId
        });

        const ownerId = getOwnerId(req);
        
        if (!ownerId) {
            console.error('❌ No ownerId in request');
            return res.status(401).json({
                success: false,
                error: 'Unauthorized',
                message: 'Owner ID is required'
            });
        }

        // SECURITY: Verify ownerId belongs to authenticated email
        const verification = await verifyOwnerEmail(req, ownerId);
        if (!verification.valid) {
            console.error('🚨 SECURITY: Email verification failed:', verification.error);
            return res.status(403).json({
                success: false,
                error: 'Access denied',
                message: verification.error || 'You do not have permission to access these settings'
            });
        }

        const settingsData = await Setting.findAll({
            where: { ownerId }
        });

        // Organize settings by type
        const settings = {
            general: null,
            hours: null,
            payment: null,
            notifications: null
        };

        settingsData.forEach(item => {
            settings[item.settingType] = item.data;
        });

        console.log('✅ Settings fetched successfully for owner:', {
            ownerId,
            email: req.user.email,
            settingsCount: settingsData.length
        });

        res.json({
            success: true,
            data: settings
        });
    } catch (error) {
        console.error('❌ Error fetching settings:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch settings',
            message: error.message
        });
    }
});

// Get specific setting type
router.get('/:settingType', authorizePermission('canManageRestaurantDetails'), async (req, res) => {
    try {
        console.log('⚙️ GET /api/settings/:settingType - Fetching setting:', req.params.settingType);
        console.log('🔍 Request user info:', {
            email: req.user?.email,
            ownerId: req.user?.ownerId
        });

        const ownerId = getOwnerId(req);
        const { settingType } = req.params;

        if (!ownerId) {
            console.error('❌ No ownerId in request');
            return res.status(401).json({
                success: false,
                error: 'Unauthorized',
                message: 'Owner ID is required'
            });
        }

        // SECURITY: Verify ownerId belongs to authenticated email
        const verification = await verifyOwnerEmail(req, ownerId);
        if (!verification.valid) {
            console.error('🚨 SECURITY: Email verification failed:', verification.error);
            return res.status(403).json({
                success: false,
                error: 'Access denied',
                message: verification.error || 'You do not have permission to access these settings'
            });
        }

        const validTypes = ['general', 'hours', 'payment', 'notifications'];
        if (!validTypes.includes(settingType)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid setting type',
                message: `Setting type must be one of: ${validTypes.join(', ')}`
            });
        }

        const setting = await Setting.findOne({
            where: {
                ownerId,
                settingType
            }
        });

        if (!setting) {
            return res.status(404).json({
                success: false,
                error: 'Settings not found',
                message: `No settings found for type: ${settingType}`
            });
        }

        console.log('✅ Setting fetched successfully:', {
            settingType,
            ownerId,
            email: req.user.email
        });

        res.json({
            success: true,
            data: setting.data
        });
    } catch (error) {
        console.error('❌ Error fetching setting:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch setting',
            message: error.message
        });
    }
});

// Update general settings
router.put('/general', authorizePermission('canManageRestaurantDetails'), async (req, res) => {
    try {
        console.log('⚙️ PUT /api/settings/general - Updating general settings');
        console.log('🔍 Request user info:', {
            email: req.user?.email,
            ownerId: req.user?.ownerId
        });

        const ownerId = getOwnerId(req);
        
        if (!ownerId) {
            console.error('❌ No ownerId in request');
            return res.status(401).json({
                success: false,
                error: 'Unauthorized',
                message: 'Owner ID is required'
            });
        }

        // SECURITY: Verify ownerId belongs to authenticated email
        const verification = await verifyOwnerEmail(req, ownerId);
        if (!verification.valid) {
            console.error('🚨 SECURITY: Email verification failed:', verification.error);
            return res.status(403).json({
                success: false,
                error: 'Access denied',
                message: verification.error || 'You do not have permission to update these settings'
            });
        }

        // Validate input
        const { error, value } = generalSettingsSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                error: 'Validation error',
                details: error.details
            });
        }

        const [setting] = await Setting.findOrCreate({
            where: {
                ownerId,
                settingType: 'general'
            },
            defaults: {
                ownerId,
                settingType: 'general',
                data: value
            }
        });

        if (!setting.isNewRecord) {
            setting.data = value;
            await setting.save();
        }

        console.log('✅ General settings updated successfully for owner:', {
            ownerId,
            email: req.user.email
        });

        res.json({
            success: true,
            data: setting.data,
            message: 'General settings updated successfully'
        });
    } catch (error) {
        console.error('❌ Error updating general settings:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update general settings',
            message: error.message
        });
    }
});

// Update hours settings
router.put('/hours', authorizePermission('canManageRestaurantDetails'), async (req, res) => {
    try {
        console.log('⚙️ PUT /api/settings/hours - Updating hours settings');
        console.log('🔍 Request user info:', {
            email: req.user?.email,
            ownerId: req.user?.ownerId
        });

        const ownerId = getOwnerId(req);
        
        if (!ownerId) {
            console.error('❌ No ownerId in request');
            return res.status(401).json({
                success: false,
                error: 'Unauthorized',
                message: 'Owner ID is required'
            });
        }

        // SECURITY: Verify ownerId belongs to authenticated email
        const verification = await verifyOwnerEmail(req, ownerId);
        if (!verification.valid) {
            console.error('🚨 SECURITY: Email verification failed:', verification.error);
            return res.status(403).json({
                success: false,
                error: 'Access denied',
                message: verification.error || 'You do not have permission to update these settings'
            });
        }

        // Validate input
        const { error, value } = hoursSettingsSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                error: 'Validation error',
                details: error.details
            });
        }

        const [setting] = await Setting.findOrCreate({
            where: {
                ownerId,
                settingType: 'hours'
            },
            defaults: {
                ownerId,
                settingType: 'hours',
                data: value
            }
        });

        if (!setting.isNewRecord) {
            setting.data = value;
            await setting.save();
        }

        console.log('✅ Hours settings updated successfully for owner:', {
            ownerId,
            email: req.user.email
        });

        res.json({
            success: true,
            data: setting.data,
            message: 'Hours settings updated successfully'
        });
    } catch (error) {
        console.error('❌ Error updating hours settings:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update hours settings',
            message: error.message
        });
    }
});

// Update payment settings
router.put('/payment', authorizePermission('canManagePaymentGateway'), async (req, res) => {
    try {
        console.log('⚙️ PUT /api/settings/payment - Updating payment settings');
        console.log('🔍 Request user info:', {
            email: req.user?.email,
            ownerId: req.user?.ownerId
        });

        const ownerId = getOwnerId(req);
        
        if (!ownerId) {
            console.error('❌ No ownerId in request');
            return res.status(401).json({
                success: false,
                error: 'Unauthorized',
                message: 'Owner ID is required'
            });
        }

        // SECURITY: Verify ownerId belongs to authenticated email
        const verification = await verifyOwnerEmail(req, ownerId);
        if (!verification.valid) {
            console.error('🚨 SECURITY: Email verification failed:', verification.error);
            return res.status(403).json({
                success: false,
                error: 'Access denied',
                message: verification.error || 'You do not have permission to update these settings'
            });
        }

        // Validate input
        const { error, value } = paymentSettingsSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                error: 'Validation error',
                details: error.details
            });
        }

        const [setting] = await Setting.findOrCreate({
            where: {
                ownerId,
                settingType: 'payment'
            },
            defaults: {
                ownerId,
                settingType: 'payment',
                data: value
            }
        });

        if (!setting.isNewRecord) {
            setting.data = value;
            await setting.save();
        }

        console.log('✅ Payment settings updated successfully for owner:', {
            ownerId,
            email: req.user.email
        });

        res.json({
            success: true,
            data: setting.data,
            message: 'Payment settings updated successfully'
        });
    } catch (error) {
        console.error('❌ Error updating payment settings:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update payment settings',
            message: error.message
        });
    }
});

// Update notification settings
router.put('/notifications', authorizePermission('canManageNotificationSettings'), async (req, res) => {
    try {
        console.log('⚙️ PUT /api/settings/notifications - Updating notification settings');
        console.log('🔍 Request user info:', {
            email: req.user?.email,
            ownerId: req.user?.ownerId
        });

        const ownerId = getOwnerId(req);
        
        if (!ownerId) {
            console.error('❌ No ownerId in request');
            return res.status(401).json({
                success: false,
                error: 'Unauthorized',
                message: 'Owner ID is required'
            });
        }

        // SECURITY: Verify ownerId belongs to authenticated email
        const verification = await verifyOwnerEmail(req, ownerId);
        if (!verification.valid) {
            console.error('🚨 SECURITY: Email verification failed:', verification.error);
            return res.status(403).json({
                success: false,
                error: 'Access denied',
                message: verification.error || 'You do not have permission to update these settings'
            });
        }

        // Validate input
        const { error, value } = notificationSettingsSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                error: 'Validation error',
                details: error.details
            });
        }

        const [setting] = await Setting.findOrCreate({
            where: {
                ownerId,
                settingType: 'notifications'
            },
            defaults: {
                ownerId,
                settingType: 'notifications',
                data: value
            }
        });

        if (!setting.isNewRecord) {
            setting.data = value;
            await setting.save();
        }

        console.log('✅ Notification settings updated successfully for owner:', {
            ownerId,
            email: req.user.email
        });

        res.json({
            success: true,
            data: setting.data,
            message: 'Notification settings updated successfully'
        });
    } catch (error) {
        console.error('❌ Error updating notification settings:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update notification settings',
            message: error.message
        });
    }
});

// Initialize default settings for a business
router.post('/initialize', authorizePermission('canManageRestaurantDetails'), async (req, res) => {
    try {
        const ownerId = getOwnerId(req);

        // Default settings
        const defaultSettings = {
            general: {
                restaurantName: 'My Restaurant',
                businessType: 'Restaurant',
                address: '',
                phone: '',
                email: '',
                website: '',
                description: '',
                logo: null
            },
            hours: {
                monday: { open: '09:00', close: '22:00', closed: false },
                tuesday: { open: '09:00', close: '22:00', closed: false },
                wednesday: { open: '09:00', close: '22:00', closed: false },
                thursday: { open: '09:00', close: '22:00', closed: false },
                friday: { open: '09:00', close: '23:00', closed: false },
                saturday: { open: '10:00', close: '23:00', closed: false },
                sunday: { open: '10:00', close: '21:00', closed: false }
            },
            payment: {
                stripePublicKey: '',
                stripeSecretKey: '',
                paypalClientId: '',
                taxRate: 8.5,
                serviceCharge: 0,
                currency: 'USD'
            },
            notifications: {
                emailNotifications: true,
                smsNotifications: false,
                orderAlerts: true,
                lowInventoryAlerts: true,
                dailyReports: true,
                weeklyReports: true,
                monthlyReports: false
            }
        };

        // Create settings items
        const settingsItems = Object.entries(defaultSettings).map(([settingType, data]) => ({
            ownerId,
            settingType,
            data
        }));

        await Setting.bulkCreate(settingsItems, {
            updateOnDuplicate: ['data', 'updatedAt']
        });

        res.status(201).json({
            success: true,
            data: defaultSettings,
            message: 'Default settings initialized successfully'
        });
    } catch (error) {
        console.error('Error initializing settings:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to initialize settings',
            message: error.message
        });
    }
});

// Test payment gateway connection
router.post('/payment/test', authorizePermission('canManagePaymentGateway'), async (req, res) => {
    try {
        const { businessId } = req.user;
        const { gateway } = req.body;

        // Mock payment gateway test
        // In real implementation, you would test actual API connections
        const testResults = {
            stripe: {
                connected: true,
                message: 'Stripe connection successful',
                lastTested: new Date().toISOString()
            },
            paypal: {
                connected: true,
                message: 'PayPal connection successful',
                lastTested: new Date().toISOString()
            }
        };

        const result = testResults[gateway] || {
            connected: false,
            message: 'Unknown payment gateway',
            lastTested: new Date().toISOString()
        };

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Error testing payment gateway:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to test payment gateway',
            message: error.message
        });
    }
});

// Send test notification
router.post('/notifications/test', authorizePermission('canManageNotificationSettings'), async (req, res) => {
    try {
        const { businessId } = req.user;
        const { type, recipient } = req.body;

        // Mock notification test
        // In real implementation, you would send actual notifications
        const testResult = {
            sent: true,
            type,
            recipient,
            message: `Test ${type} notification sent successfully`,
            timestamp: new Date().toISOString()
        };

        res.json({
            success: true,
            data: testResult
        });
    } catch (error) {
        console.error('Error sending test notification:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to send test notification',
            message: error.message
        });
    }
});

module.exports = router;
