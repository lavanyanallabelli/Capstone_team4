const express = require('express');
const { Owner } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { syncCognitoUserToOwner } = require('../middleware/cognitoSync');
const Joi = require('joi');

const router = express.Router();

// Helper to get owner ID
const getOwnerId = (req) => {
    if (!req.user || !req.user.ownerId) {
        console.error('❌ getOwnerId: No ownerId in req.user');
        return null;
    }
    return req.user.ownerId;
};

// Validation schema for subscription purchase
const purchaseSubscriptionSchema = Joi.object({
    plan: Joi.string().valid('Basic', 'Pro', 'Enterprise').required(),
    cardNumber: Joi.string().pattern(/^\d{13,19}$/).required(),
    cardHolderName: Joi.string().min(2).max(100).required(),
    expiryMonth: Joi.number().integer().min(1).max(12).required(),
    expiryYear: Joi.number().integer().min(new Date().getFullYear()).required(),
    cvv: Joi.string().pattern(/^\d{3,4}$/).required(),
    enableAutoPayment: Joi.boolean().default(true)
});

// Check subscription status
router.get('/status', authenticateToken, syncCognitoUserToOwner, async (req, res) => {
    try {
        const ownerId = getOwnerId(req);
        if (!ownerId) {
            return res.status(401).json({
                success: false,
                error: 'Unauthorized',
                message: 'Owner ID is required'
            });
        }

        const owner = await Owner.findByPk(ownerId);
        if (!owner) {
            return res.status(404).json({
                success: false,
                error: 'Owner not found'
            });
        }

        // Check if trial is expired
        const now = new Date();
        const trialEndDate = owner.trialEndDate ? new Date(owner.trialEndDate) : null;
        const isTrialExpired = trialEndDate && now > trialEndDate;

        // Update subscription status if trial expired
        if (isTrialExpired && owner.subscriptionStatus === 'trial') {
            await owner.update({ subscriptionStatus: 'expired' });
        }

        res.json({
            success: true,
            data: {
                subscriptionPlan: owner.subscriptionPlan,
                subscriptionStatus: owner.subscriptionStatus,
                trialEndDate: owner.trialEndDate,
                subscriptionStartDate: owner.subscriptionStartDate,
                subscriptionEndDate: owner.subscriptionEndDate,
                autoPayment: owner.autoPayment,
                isTrialExpired: isTrialExpired,
                isActive: owner.subscriptionStatus === 'active'
            }
        });
    } catch (error) {
        console.error('Error checking subscription status:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to check subscription status',
            message: error.message
        });
    }
});

// Purchase subscription - requires authentication
router.post('/purchase', authenticateToken, syncCognitoUserToOwner, async (req, res) => {
    try {
        const ownerId = getOwnerId(req);
        if (!ownerId) {
            return res.status(401).json({
                success: false,
                error: 'Unauthorized',
                message: 'Owner ID is required'
            });
        }

        // Validate request
        const { error, value } = purchaseSubscriptionSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                error: 'Validation error',
                message: error.details[0].message
            });
        }

        const { plan, cardNumber, cardHolderName, expiryMonth, expiryYear, cvv, enableAutoPayment } = value;

        const owner = await Owner.findByPk(ownerId);
        if (!owner) {
            return res.status(404).json({
                success: false,
                error: 'Owner not found'
            });
        }

        // Calculate subscription dates
        const now = new Date();
        const subscriptionStartDate = now;
        const subscriptionEndDate = new Date(now);
        subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1); // 1 month subscription

        // Store payment method (masked card number)
        const last4 = cardNumber.slice(-4);
        const paymentMethod = {
            cardNumber: `**** **** **** ${last4}`,
            cardHolderName: cardHolderName,
            expiryMonth: expiryMonth,
            expiryYear: expiryYear,
            lastUpdated: now.toISOString()
        };

        // Update owner subscription
        await owner.update({
            subscriptionPlan: plan,
            subscriptionStatus: 'active',
            subscriptionStartDate: subscriptionStartDate,
            subscriptionEndDate: subscriptionEndDate,
            autoPayment: enableAutoPayment,
            paymentMethod: paymentMethod
        });

        console.log('✅ Subscription purchased:', {
            ownerId: owner.id,
            email: owner.email,
            plan: plan,
            autoPayment: enableAutoPayment
        });

        res.json({
            success: true,
            message: 'Subscription activated successfully!',
            data: {
                subscriptionPlan: plan,
                subscriptionStatus: 'active',
                subscriptionStartDate: subscriptionStartDate,
                subscriptionEndDate: subscriptionEndDate,
                autoPayment: enableAutoPayment
            }
        });
    } catch (error) {
        console.error('Error purchasing subscription:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to process subscription',
            message: error.message
        });
    }
});

module.exports = router;

