const express = require('express');
const Joi = require('joi');
const bcrypt = require('bcryptjs');
const { Owner } = require('../models');

// Helper to get ownerId from request
const getOwnerId = (req) => {
    // ONLY use ownerId from cognitoSync middleware - it's the PostgreSQL UUID
    if (req.user?.ownerId) {
        return req.user.ownerId;
    }
    console.warn('⚠️ ownerId not set - cognitoSync middleware may have failed');
    return null;
};

const router = express.Router();

// Validation schemas
const updateOwnerSchema = Joi.object({
    name: Joi.string().min(1).max(100).optional(),
    email: Joi.string().email().optional(),
    phone: Joi.string().pattern(/^\+?[\d\s\-\(\)]+$/).optional(),
    businessName: Joi.string().min(1).max(100).optional(),
    businessType: Joi.string().valid('Italian Restaurant', 'Chinese Restaurant', 'Indian Restaurant', 'Mexican Restaurant', 'Cafe').optional()
});

// Get owner/restaurant details
router.get('/profile', async (req, res) => {
    try {
        console.log('👤 GET /api/owner/profile - Fetching owner profile');
        console.log('🔍 Request user info:', {
            email: req.user?.email,
            sub: req.user?.sub,
            ownerId: req.user?.ownerId,
            businessId: req.user?.businessId
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

        // SECURITY: Double-check that the ownerId matches the authenticated user's email
        const owner = await Owner.findByPk(ownerId, {
            attributes: { exclude: ['password'] } // Don't return password
        });

        if (!owner) {
            console.error('❌ Owner not found:', ownerId);
            return res.status(404).json({
                success: false,
                error: 'Owner not found',
                message: 'The owner record does not exist'
            });
        }

        // SECURITY CHECK: Verify the owner's email matches the authenticated user's email
        if (req.user?.email && owner.email !== req.user.email) {
            console.error('🚨 SECURITY ALERT: Owner email mismatch!', {
                authenticatedEmail: req.user.email,
                ownerEmail: owner.email,
                ownerId: owner.id
            });
            return res.status(403).json({
                success: false,
                error: 'Access denied',
                message: 'You do not have permission to access this profile'
            });
        }

        // If trialEndDate is not set, calculate it from createdAt (30 days from registration)
        let ownerData = owner.toJSON();
        if (!ownerData.trialEndDate && ownerData.createdAt) {
            const createdAt = new Date(ownerData.createdAt);
            const trialEndDate = new Date(createdAt);
            trialEndDate.setDate(trialEndDate.getDate() + 30);
            ownerData.trialEndDate = trialEndDate.toISOString();

            // Update the owner record in database
            await owner.update({ trialEndDate: trialEndDate });
            console.log('📅 Set trialEndDate for existing user:', {
                email: owner.email,
                createdAt: createdAt.toISOString(),
                trialEndDate: trialEndDate.toISOString()
            });
        }

        console.log('✅ Owner profile fetched successfully:', {
            ownerId: owner.id,
            email: owner.email,
            businessName: owner.businessName,
            trialEndDate: ownerData.trialEndDate,
            subscriptionPlan: ownerData.subscriptionPlan,
            subscriptionStatus: ownerData.subscriptionStatus
        });

        res.json({
            success: true,
            data: ownerData
        });
    } catch (error) {
        console.error('❌ Error fetching owner profile:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch owner profile',
            message: error.message
        });
    }
});

// Update owner/restaurant details
router.put('/profile', async (req, res) => {
    try {
        console.log('📝 PUT /api/owner/profile - Updating owner profile');
        const ownerId = getOwnerId(req);

        if (!ownerId) {
            console.error('❌ No ownerId in update request');
            return res.status(401).json({
                success: false,
                error: 'Unauthorized',
                message: 'Owner ID is required'
            });
        }

        // Validate input
        const { error, value } = updateOwnerSchema.validate(req.body);
        if (error) {
            console.error('❌ Validation error:', error.details);
            return res.status(400).json({
                success: false,
                error: 'Validation error',
                details: error.details
            });
        }

        const owner = await Owner.findByPk(ownerId);

        if (!owner) {
            console.error('❌ Owner not found:', ownerId);
            return res.status(404).json({
                success: false,
                error: 'Owner not found',
                message: 'The owner record does not exist'
            });
        }

        // SECURITY CHECK: Verify the owner's email matches the authenticated user's email
        if (req.user?.email && owner.email !== req.user.email) {
            console.error('🚨 SECURITY ALERT: Owner email mismatch on update!', {
                authenticatedEmail: req.user.email,
                ownerEmail: owner.email,
                ownerId: owner.id
            });
            return res.status(403).json({
                success: false,
                error: 'Access denied',
                message: 'You do not have permission to update this profile'
            });
        }

        // If email is being updated, check for duplicates
        if (value.email && value.email !== owner.email) {
            const emailCheck = await Owner.findOne({
                where: { email: value.email }
            });
            if (emailCheck) {
                return res.status(409).json({
                    success: false,
                    error: 'Email already exists',
                    message: 'Another account is using this email address'
                });
            }
        }

        // Update owner
        await owner.update(value);
        await owner.reload();

        const safeOwner = owner.toJSON();
        delete safeOwner.password;

        console.log('✅ Owner profile updated successfully:', owner.id);
        res.json({
            success: true,
            data: safeOwner,
            message: 'Profile updated successfully'
        });
    } catch (error) {
        console.error('❌ Error updating owner profile:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update owner profile',
            message: error.message
        });
    }
});

// Delete/Deactivate owner account
router.delete('/profile', async (req, res) => {
    try {
        console.log('🗑️ DELETE /api/owner/profile - Deleting owner account');
        const ownerId = getOwnerId(req);

        if (!ownerId) {
            console.error('❌ No ownerId in delete request');
            return res.status(401).json({
                success: false,
                error: 'Unauthorized',
                message: 'Owner ID is required'
            });
        }

        const owner = await Owner.findByPk(ownerId);

        if (!owner) {
            console.error('❌ Owner not found:', ownerId);
            return res.status(404).json({
                success: false,
                error: 'Owner not found',
                message: 'The owner record does not exist'
            });
        }

        // SECURITY CHECK: Verify the owner's email matches the authenticated user's email
        if (req.user?.email && owner.email !== req.user.email) {
            console.error('🚨 SECURITY ALERT: Owner email mismatch on delete!', {
                authenticatedEmail: req.user.email,
                ownerEmail: owner.email,
                ownerId: owner.id
            });
            return res.status(403).json({
                success: false,
                error: 'Access denied',
                message: 'You do not have permission to delete this account'
            });
        }

        // Instead of hard delete, deactivate the account
        // This preserves data integrity and allows for account recovery
        await owner.update({ isActive: false });

        console.log('✅ Owner account deactivated successfully:', owner.id);
        res.json({
            success: true,
            message: 'Account deactivated successfully. Your account has been disabled but not permanently deleted.'
        });
    } catch (error) {
        console.error('❌ Error deactivating owner account:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to deactivate account',
            message: error.message
        });
    }
});

module.exports = router;

