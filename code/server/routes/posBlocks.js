const express = require('express');
const { POSBlocks } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { syncCognitoUserToOwner } = require('../middleware/cognitoSync');

const router = express.Router();

// Helper to get ownerId from request
const getOwnerId = (req) => {
    if (req.user?.ownerId) {
        return req.user.ownerId;
    }
    console.warn('⚠️ ownerId not set - cognitoSync middleware may have failed');
    return null;
};

// Get custom blocks for the owner
router.get('/', authenticateToken, syncCognitoUserToOwner, async (req, res) => {
    try {
        const ownerId = getOwnerId(req);

        if (!ownerId) {
            return res.status(401).json({
                success: false,
                error: 'Unauthorized',
                message: 'Owner ID is required'
            });
        }

        let posBlocks = await POSBlocks.findOne({
            where: { ownerId }
        });

        // If no blocks exist, create default
        if (!posBlocks) {
            const defaultBlocks = {
                proteinTop: Array(3).fill(null),
                protein: Array(3).fill(null),
                toppings: Array(5).fill(null),
                extraProtein: Array(5).fill(null),
                snacks: Array(5).fill(null),
                drinks: Array(5).fill(null),
                categories: Array(9).fill(null)
            };

            posBlocks = await POSBlocks.create({
                ownerId,
                blocks: defaultBlocks
            });
        }

        res.json({
            success: true,
            data: posBlocks.blocks
        });
    } catch (error) {
        console.error('Error fetching POS blocks:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch POS blocks',
            message: error.message
        });
    }
});

// Save custom blocks (only owners can save)
router.post('/', authenticateToken, syncCognitoUserToOwner, async (req, res) => {
    try {
        const ownerId = getOwnerId(req);

        if (!ownerId) {
            return res.status(401).json({
                success: false,
                error: 'Unauthorized',
                message: 'Owner ID is required'
            });
        }

        // Only owners can save blocks
        if (req.user?.userRole !== 'owner') {
            return res.status(403).json({
                success: false,
                error: 'Forbidden',
                message: 'Only owners can update POS blocks'
            });
        }

        const { blocks } = req.body;

        if (!blocks || typeof blocks !== 'object') {
            return res.status(400).json({
                success: false,
                error: 'Invalid blocks data',
                message: 'Blocks must be an object'
            });
        }

        // Validate blocks structure
        const requiredKeys = ['proteinTop', 'protein', 'toppings', 'extraProtein', 'snacks', 'drinks', 'categories'];
        for (const key of requiredKeys) {
            if (!Array.isArray(blocks[key])) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid blocks structure',
                    message: `${key} must be an array`
                });
            }
        }

        // Upsert blocks
        const [posBlocks, created] = await POSBlocks.upsert({
            ownerId,
            blocks
        }, {
            returning: true
        });

        res.json({
            success: true,
            data: posBlocks.blocks,
            message: created ? 'POS blocks created successfully' : 'POS blocks updated successfully'
        });
    } catch (error) {
        console.error('Error saving POS blocks:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to save POS blocks',
            message: error.message
        });
    }
});

module.exports = router;

