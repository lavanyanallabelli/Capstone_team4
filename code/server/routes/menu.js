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
    image: Joi.string().uri().optional(),
    hasSizes: Joi.boolean().optional().default(false),
    sizes: Joi.alternatives().try(
        Joi.object().pattern(
            Joi.string(),
            Joi.object({
                name: Joi.string().required(),
                price: Joi.number().positive().precision(2).required()
            })
        ),
        Joi.valid(null)
    ).optional().allow(null)
});

const updateMenuItemSchema = Joi.object({
    name: Joi.string().min(1).max(100).optional(),
    category: Joi.string().min(1).max(50).optional(),
    description: Joi.string().max(500).optional(),
    price: Joi.number().positive().precision(2).optional(),
    prepTime: Joi.string().max(20).optional(),
    tags: Joi.array().items(Joi.string().max(30)).optional(),
    availability: Joi.boolean().optional(),
    image: Joi.string().uri().optional(),
    hasSizes: Joi.boolean().optional(),
    sizes: Joi.alternatives().try(
        Joi.object().pattern(
            Joi.string(),
            Joi.object({
                name: Joi.string().required(),
                price: Joi.number().positive().precision(2).required()
            })
        ),
        Joi.valid(null)
    ).optional().allow(null)
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
            order: [['createdAt', 'DESC']],
            // Use raw: false to get Sequelize instances (handles missing columns gracefully)
            raw: false
        });

        // Convert to plain objects and ensure hasSizes and sizes are included
        const itemsData = menuItems.map(item => {
            const plainItem = item.toJSON ? item.toJSON() : item;
            // Ensure hasSizes and sizes have default values if not present
            if (plainItem.hasSizes === undefined) {
                plainItem.hasSizes = false;
            }
            if (plainItem.sizes === undefined) {
                plainItem.sizes = null;
            }
            return plainItem;
        });

        res.json({
            success: true,
            data: itemsData,
            count: itemsData.length
        });
    } catch (error) {
        console.error('Error fetching menu items:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        res.status(500).json({
            success: false,
            error: 'Failed to fetch menu items',
            message: error.message || 'An unexpected error occurred while fetching menu items'
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

        // Log the incoming request for debugging
        console.log('📝 Create menu item request body:', JSON.stringify(req.body, null, 2));

        // Validate input
        const { error, value } = menuItemSchema.validate(req.body, { abortEarly: false });
        if (error) {
            console.error('❌ Validation error details:', JSON.stringify(error.details, null, 2));
            return res.status(400).json({
                success: false,
                error: 'Validation error',
                message: error.details.map(d => d.message).join(', '),
                details: error.details
            });
        }

        // Ensure hasSizes is always a boolean (default to false if not provided)
        if (value.hasSizes === undefined || value.hasSizes === null) {
            value.hasSizes = false;
        }
        value.hasSizes = Boolean(value.hasSizes);

        // If hasSizes is false, ensure sizes is null
        if (!value.hasSizes) {
            value.sizes = null;
        }
        // If hasSizes is true but sizes is empty/null, set hasSizes to false
        if (value.hasSizes && (!value.sizes || Object.keys(value.sizes).length === 0)) {
            value.hasSizes = false;
            value.sizes = null;
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
        console.log('📝 Update data received:', JSON.stringify(req.body, null, 2));

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

        // Ensure hasSizes is always a boolean if provided
        if (value.hasSizes !== undefined && value.hasSizes !== null) {
            value.hasSizes = Boolean(value.hasSizes);
        }

        // Ensure hasSizes is set correctly based on sizes
        if (value.sizes === null || (typeof value.sizes === 'object' && Object.keys(value.sizes || {}).length === 0)) {
            value.hasSizes = false;
            value.sizes = null;
        } else if (value.sizes && typeof value.sizes === 'object' && Object.keys(value.sizes).length > 0) {
            value.hasSizes = true;
        }

        // If hasSizes is explicitly set to false, ensure sizes is null
        if (value.hasSizes === false) {
            value.sizes = null;
        }

        console.log('📝 Processed update data:', JSON.stringify(value, null, 2));

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
        console.log('✅ Updated item data:', JSON.stringify({
            id: menuItem.id,
            name: menuItem.name,
            hasSizes: menuItem.hasSizes,
            sizes: menuItem.sizes
        }, null, 2));
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

// Get or update menu item availability schedule
router.get('/:itemId/availability-schedule', async (req, res) => {
    try {
        const ownerId = getOwnerId(req);
        const { itemId } = req.params;

        if (!ownerId) {
            return res.status(401).json({
                success: false,
                error: 'Unauthorized',
                message: 'Owner ID is required'
            });
        }

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
            data: {
                itemId: menuItem.id,
                name: menuItem.name,
                availabilitySchedule: menuItem.availabilitySchedule || null
            }
        });
    } catch (error) {
        console.error('Error fetching availability schedule:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch availability schedule',
            message: error.message
        });
    }
});

// Update menu item availability schedule
router.patch('/:itemId/availability-schedule', async (req, res) => {
    try {
        const ownerId = getOwnerId(req);
        const { itemId } = req.params;
        const { availabilitySchedule } = req.body;

        if (!ownerId) {
            return res.status(401).json({
                success: false,
                error: 'Unauthorized',
                message: 'Owner ID is required'
            });
        }

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

        menuItem.availabilitySchedule = availabilitySchedule;
        await menuItem.save();

        res.json({
            success: true,
            data: menuItem,
            message: 'Availability schedule updated successfully'
        });
    } catch (error) {
        console.error('Error updating availability schedule:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update availability schedule',
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
