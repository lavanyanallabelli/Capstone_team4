const express = require('express');
const { v4: uuidv4 } = require('uuid');
const Joi = require('joi');
const { MenuItem } = require('../models');
const { authorizePermission } = require('../middleware/auth');
const { Op } = require('sequelize');

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

// Validation schemas
const menuItemSchema = Joi.object({
    name: Joi.string().min(1).max(100).required(),
    category: Joi.string().min(1).max(50).required(),
    description: Joi.string().max(500).required(),
    price: Joi.number().positive().precision(2).required(),
    prepTime: Joi.string().max(20).optional(),
    tags: Joi.array().items(Joi.string().max(30)).optional(),
    availability: Joi.boolean().default(true),
    image: Joi.string().uri().optional()
});

const updateMenuItemSchema = Joi.object({
    name: Joi.string().min(1).max(100).optional(),
    category: Joi.string().min(1).max(50).optional(),
    description: Joi.string().max(500).optional(),
    price: Joi.number().positive().precision(2).optional(),
    prepTime: Joi.string().max(20).optional(),
    tags: Joi.array().items(Joi.string().max(30)).optional(),
    availability: Joi.boolean().optional(),
    image: Joi.string().uri().optional()
});

// Get all menu items for a business
router.get('/', async (req, res) => {
    try {
        console.log('📋 GET /api/menu - req.user:', JSON.stringify({
            ownerId: req.user?.ownerId,
            businessId: req.user?.businessId,
            sub: req.user?.sub,
            email: req.user?.email
        }, null, 2));

        const ownerId = getOwnerId(req);
        console.log('📋 Extracted ownerId:', ownerId, typeof ownerId);
        console.log('📋 getOwnerId fallback chain:', {
            hasOwnerId: !!req.user?.ownerId,
            hasBusinessId: !!req.user?.businessId,
            businessIdValue: req.user?.businessId,
            hasSub: !!req.user?.sub
        });

        if (!ownerId) {
            console.error('❌ No ownerId found in request');
            return res.status(401).json({
                success: false,
                error: 'Unauthorized',
                message: 'Owner ID is required'
            });
        }

        // Validate UUID format - if it's not a UUID, sync middleware didn't run properly
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(ownerId)) {
            console.error('❌ Invalid UUID format - cognitoSync middleware likely failed!');
            console.error('❌ Got Cognito businessId instead:', ownerId);
            console.error('❌ This means sync middleware did not set req.user.ownerId properly');
            return res.status(400).json({
                success: false,
                error: 'Invalid owner ID format',
                message: 'Owner ID must be a valid UUID. Please ensure you are properly authenticated.'
            });
        }

        const { category, search, availability } = req.query;

        const where = { ownerId };

        if (category && category !== 'All') {
            where.category = category;
        }

        if (search) {
            where[Op.or] = [
                { name: { [Op.iLike]: `%${search}%` } },
                { description: { [Op.iLike]: `%${search}%` } }
            ];
        }

        if (availability !== undefined) {
            where.availability = availability === 'true';
        }

        const menuItems = await MenuItem.findAll({
            where,
            order: [['createdAt', 'DESC']]
        });

        res.json({
            success: true,
            data: menuItems,
            count: menuItems.length
        });
    } catch (error) {
        console.error('Error fetching menu items:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch menu items',
            message: error.message
        });
    }
});

// Get menu item by ID
router.get('/:itemId', authorizePermission('canViewMenuItems'), async (req, res) => {
    try {
        const ownerId = getOwnerId(req);
        const { itemId } = req.params;

        const menuItem = await MenuItem.findOne({
            where: {
                id: itemId,
                ownerId: ownerId
            }
        });

        if (!menuItem) {
            return res.status(404).json({
                success: false,
                error: 'Menu item not found'
            });
        }

        res.json({
            success: true,
            data: menuItem
        });
    } catch (error) {
        console.error('Error fetching menu item:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch menu item',
            message: error.message
        });
    }
});

// Create new menu item
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
        const { error, value } = menuItemSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                error: 'Validation error',
                details: error.details
            });
        }

        const menuItem = await MenuItem.create({
            ownerId,
            ...value
        });

        res.status(201).json({
            success: true,
            data: menuItem,
            message: 'Menu item created successfully'
        });
    } catch (error) {
        console.error('Error creating menu item:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create menu item',
            message: error.message
        });
    }
});

// Update menu item
router.put('/:itemId', async (req, res) => {
    try {
        console.log('📝 PUT /api/menu/:itemId - Updating menu item');
        const ownerId = getOwnerId(req);

        if (!ownerId) {
            console.error('❌ No ownerId in update request');
            return res.status(401).json({
                success: false,
                error: 'Unauthorized',
                message: 'Owner ID is required'
            });
        }

        const { itemId } = req.params;
        console.log('📝 Update request - itemId:', itemId, 'ownerId:', ownerId);

        // Validate input
        const { error, value } = updateMenuItemSchema.validate(req.body);
        if (error) {
            console.error('❌ Validation error:', error.details);
            return res.status(400).json({
                success: false,
                error: 'Validation error',
                details: error.details
            });
        }

        const menuItem = await MenuItem.findOne({
            where: {
                id: itemId,
                ownerId: ownerId
            }
        });

        if (!menuItem) {
            console.error('❌ Menu item not found:', itemId);
            return res.status(404).json({
                success: false,
                error: 'Menu item not found',
                message: 'The menu item does not exist or you do not have permission to update it'
            });
        }

        await menuItem.update(value);
        await menuItem.reload(); // Reload to get updated values

        console.log('✅ Menu item updated successfully:', menuItem.id);
        res.json({
            success: true,
            data: menuItem,
            message: 'Menu item updated successfully'
        });
    } catch (error) {
        console.error('❌ Error updating menu item:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update menu item',
            message: error.message
        });
    }
});

// Delete menu item
router.delete('/:itemId', async (req, res) => {
    try {
        console.log('🗑️ DELETE /api/menu/:itemId - Deleting menu item');
        const ownerId = getOwnerId(req);

        if (!ownerId) {
            console.error('❌ No ownerId in delete request');
            return res.status(401).json({
                success: false,
                error: 'Unauthorized',
                message: 'Owner ID is required'
            });
        }

        const { itemId } = req.params;
        console.log('🗑️ Delete request - itemId:', itemId, 'ownerId:', ownerId);

        const menuItem = await MenuItem.findOne({
            where: {
                id: itemId,
                ownerId: ownerId
            }
        });

        if (!menuItem) {
            console.error('❌ Menu item not found:', itemId);
            return res.status(404).json({
                success: false,
                error: 'Menu item not found',
                message: 'The menu item does not exist or you do not have permission to delete it'
            });
        }

        await menuItem.destroy();
        console.log('✅ Menu item deleted successfully:', itemId);

        res.json({
            success: true,
            message: 'Menu item deleted successfully'
        });
    } catch (error) {
        console.error('❌ Error deleting menu item:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete menu item',
            message: error.message
        });
    }
});

// Toggle item availability
router.patch('/:itemId/availability', async (req, res) => {
    try {
        console.log('🔄 PATCH /api/menu/:itemId/availability - Toggling availability');
        const ownerId = getOwnerId(req);

        if (!ownerId) {
            console.error('❌ No ownerId in toggle availability request');
            return res.status(401).json({
                success: false,
                error: 'Unauthorized',
                message: 'Owner ID is required'
            });
        }

        const { itemId } = req.params;
        const { availability } = req.body;
        console.log('🔄 Toggle request - itemId:', itemId, 'availability:', availability, 'ownerId:', ownerId);

        if (typeof availability !== 'boolean') {
            console.error('❌ Invalid availability type:', typeof availability);
            return res.status(400).json({
                success: false,
                error: 'Availability must be a boolean value'
            });
        }

        const menuItem = await MenuItem.findOne({
            where: {
                id: itemId,
                ownerId: ownerId
            }
        });

        if (!menuItem) {
            console.error('❌ Menu item not found:', itemId);
            return res.status(404).json({
                success: false,
                error: 'Menu item not found',
                message: 'The menu item does not exist or you do not have permission to update it'
            });
        }

        menuItem.availability = availability;
        await menuItem.save();
        await menuItem.reload(); // Reload to get updated values

        console.log('✅ Availability updated successfully:', menuItem.id, '→', availability);
        res.json({
            success: true,
            data: menuItem,
            message: `Menu item ${availability ? 'enabled' : 'disabled'} successfully`
        });
    } catch (error) {
        console.error('Error toggling item availability:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to toggle item availability',
            message: error.message
        });
    }
});

// Get menu categories
router.get('/categories/list', async (req, res) => {
    try {
        const ownerId = getOwnerId(req);

        const menuItems = await MenuItem.findAll({
            where: { ownerId },
            attributes: ['category'],
            group: ['category']
        });

        const categories = menuItems.map(item => item.category).filter(Boolean);

        res.json({
            success: true,
            data: [...new Set(categories)]
        });
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch categories',
            message: error.message
        });
    }
});

// Get menu statistics
router.get('/stats/overview', authorizePermission('canViewMenuItems'), async (req, res) => {
    try {
        const ownerId = getOwnerId(req);

        const menuItems = await MenuItem.findAll({
            where: { ownerId }
        });

        const categories = [...new Set(menuItems.map(item => item.category).filter(Boolean))];

        const stats = {
            totalItems: menuItems.length,
            availableItems: menuItems.filter(item => item.availability).length,
            unavailableItems: menuItems.filter(item => !item.availability).length,
            categories: categories.length
        };

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Error fetching menu stats:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch menu statistics',
            message: error.message
        });
    }
});

module.exports = router;
