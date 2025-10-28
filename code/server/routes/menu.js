const express = require('express');
const { v4: uuidv4 } = require('uuid');
const Joi = require('joi');
const { docClient } = require('../config/dynamodb');
const { authorizePermission } = require('../middleware/auth');

// Generate user-specific business ID for testing
const generateUserBusinessId = (req) => {
    // Use email from request body or headers to generate consistent business ID
    const email = req.body?.email || req.headers['x-user-email'] || 'default@example.com';
    const hash = require('crypto').createHash('md5').update(email).digest('hex').substring(0, 8);
    return `biz_${hash}_${Date.now()}`;
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
        // Generate user-specific business ID for testing
        const businessId = req.user?.businessId || generateUserBusinessId(req);
        const { category, search, availability } = req.query;

        let params = {
            TableName: 'pos-menu-items',
            KeyConditionExpression: 'businessId = :businessId',
            ExpressionAttributeValues: {
                ':businessId': businessId
            }
        };

        // Add filters
        let filterExpressions = [];

        if (category && category !== 'All') {
            filterExpressions.push('category = :category');
            params.ExpressionAttributeValues[':category'] = category;
        }

        if (search) {
            filterExpressions.push('(contains(#name, :search) OR contains(description, :search))');
            params.ExpressionAttributeValues[':search'] = search.toLowerCase();
            params.ExpressionAttributeNames = { '#name': 'name' };
        }

        if (availability !== undefined) {
            filterExpressions.push('availability = :availability');
            params.ExpressionAttributeValues[':availability'] = availability === 'true';
        }

        if (filterExpressions.length > 0) {
            params.FilterExpression = filterExpressions.join(' AND ');
        }

        const result = await docClient.query(params).promise();

        res.json({
            success: true,
            data: result.Items,
            count: result.Count
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
        const { businessId } = req.user;
        const { itemId } = req.params;

        const params = {
            TableName: 'pos-menu-items',
            Key: {
                businessId,
                itemId
            }
        };

        const result = await docClient.get(params).promise();

        if (!result.Item) {
            return res.status(404).json({
                success: false,
                error: 'Menu item not found'
            });
        }

        res.json({
            success: true,
            data: result.Item
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
        // Generate user-specific business ID for testing
        const businessId = req.user?.businessId || generateUserBusinessId(req);

        // Validate input
        const { error, value } = menuItemSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                error: 'Validation error',
                details: error.details
            });
        }

        const itemId = uuidv4();
        const menuItem = {
            businessId,
            itemId,
            ...value,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const params = {
            TableName: 'pos-menu-items',
            Item: menuItem
        };

        await docClient.put(params).promise();

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
        // Generate user-specific business ID for testing
        const businessId = req.user?.businessId || generateUserBusinessId(req);
        const { itemId } = req.params;

        // Validate input
        const { error, value } = updateMenuItemSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                error: 'Validation error',
                details: error.details
            });
        }

        // Check if item exists
        const getParams = {
            TableName: 'pos-menu-items',
            Key: { businessId, itemId }
        };

        const existingItem = await docClient.get(getParams).promise();
        if (!existingItem.Item) {
            return res.status(404).json({
                success: false,
                error: 'Menu item not found'
            });
        }

        // Update item
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
            TableName: 'pos-menu-items',
            Key: { businessId, itemId },
            UpdateExpression: `SET ${updateExpressions.join(', ')}`,
            ExpressionAttributeNames: expressionAttributeNames,
            ExpressionAttributeValues: expressionAttributeValues,
            ReturnValues: 'ALL_NEW'
        };

        const result = await docClient.update(updateParams).promise();

        res.json({
            success: true,
            data: result.Attributes,
            message: 'Menu item updated successfully'
        });
    } catch (error) {
        console.error('Error updating menu item:', error);
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
        // Generate user-specific business ID for testing
        const businessId = req.user?.businessId || generateUserBusinessId(req);
        const { itemId } = req.params;

        const params = {
            TableName: 'pos-menu-items',
            Key: { businessId, itemId }
        };

        await docClient.delete(params).promise();

        res.json({
            success: true,
            message: 'Menu item deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting menu item:', error);
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
        // Generate user-specific business ID for testing
        const businessId = req.user?.businessId || generateUserBusinessId(req);
        const { itemId } = req.params;
        const { availability } = req.body;

        if (typeof availability !== 'boolean') {
            return res.status(400).json({
                success: false,
                error: 'Availability must be a boolean value'
            });
        }

        const params = {
            TableName: 'pos-menu-items',
            Key: { businessId, itemId },
            UpdateExpression: 'SET availability = :availability, updatedAt = :updatedAt',
            ExpressionAttributeValues: {
                ':availability': availability,
                ':updatedAt': new Date().toISOString()
            },
            ReturnValues: 'ALL_NEW'
        };

        const result = await docClient.update(params).promise();

        res.json({
            success: true,
            data: result.Attributes,
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
        // Generate user-specific business ID for testing
        const businessId = req.user?.businessId || generateUserBusinessId(req);

        const params = {
            TableName: 'pos-menu-items',
            KeyConditionExpression: 'businessId = :businessId',
            ProjectionExpression: 'category',
            ExpressionAttributeValues: {
                ':businessId': businessId
            }
        };

        const result = await docClient.query(params).promise();

        // Extract unique categories
        const categories = [...new Set(result.Items.map(item => item.category))];

        res.json({
            success: true,
            data: categories
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
        const { businessId } = req.user;

        const params = {
            TableName: 'pos-menu-items',
            KeyConditionExpression: 'businessId = :businessId',
            ExpressionAttributeValues: {
                ':businessId': businessId
            }
        };

        const result = await docClient.query(params).promise();

        const stats = {
            totalItems: result.Count,
            availableItems: result.Items.filter(item => item.availability).length,
            unavailableItems: result.Items.filter(item => !item.availability).length,
            categories: [...new Set(result.Items.map(item => item.category))].length
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
