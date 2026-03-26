const { Owner } = require('../models');

/**
 * Middleware to check if user's subscription is active
 * Redirects to trial expired page if trial has ended and subscription is not active
 */
const checkSubscription = async (req, res, next) => {
    try {
        // Skip subscription check for subscription-related routes
        if (req.path.startsWith('/api/subscription') || req.path.startsWith('/pricing') || req.path === '/') {
            return next();
        }

        // Skip for employees (they don't have subscriptions)
        if (req.user && req.user.sub && !req.user.ownerId) {
            return next();
        }

        const ownerId = req.user?.ownerId;
        if (!ownerId) {
            return next(); // Let auth middleware handle unauthorized
        }

        const owner = await Owner.findByPk(ownerId);
        if (!owner) {
            return next(); // Owner not found, let other middleware handle
        }

        // Check if trial is expired
        const now = new Date();
        const trialEndDate = owner.trialEndDate ? new Date(owner.trialEndDate) : null;
        const isTrialExpired = trialEndDate && now > trialEndDate;

        // Update subscription status if trial expired
        if (isTrialExpired && owner.subscriptionStatus === 'trial') {
            await owner.update({ subscriptionStatus: 'expired' });
        }

        // If subscription is not active (expired or cancelled), block access
        if (owner.subscriptionStatus !== 'active' && owner.subscriptionStatus !== 'trial') {
            // Set flag for frontend to redirect
            req.subscriptionExpired = true;
            return res.status(403).json({
                success: false,
                error: 'Subscription expired',
                message: 'Your free trial has ended. Please subscribe to continue using the service.',
                redirectTo: '/trial-expired'
            });
        }

        // If trial expired but not subscribed yet, block access
        if (isTrialExpired && owner.subscriptionStatus === 'expired') {
            req.subscriptionExpired = true;
            return res.status(403).json({
                success: false,
                error: 'Trial expired',
                message: 'Your free trial has ended. Please subscribe to continue using the service.',
                redirectTo: '/trial-expired'
            });
        }

        next();
    } catch (error) {
        console.error('Error checking subscription:', error);
        next(); // Continue on error, let other middleware handle
    }
};

module.exports = { checkSubscription };

