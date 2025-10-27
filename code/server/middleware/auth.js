const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');
const AWS = require('aws-sdk');

// Configure AWS
AWS.config.update({
    region: process.env.AWS_REGION || 'us-east-1'
});

const cognitoIdentityServiceProvider = new AWS.CognitoIdentityServiceProvider();

// JWKS client for token verification
const client = jwksClient({
    jwksUri: process.env.JWKS_URI || `https://cognito-idp.${process.env.AWS_REGION}.amazonaws.com/${process.env.AWS_USER_POOL_ID}/.well-known/jwks.json`
});

// Get signing key for JWT verification
function getKey(header, callback) {
    client.getSigningKey(header.kid, (err, key) => {
        if (err) {
            console.error('Error getting signing key:', err);
            return callback(err);
        }
        
        if (!key) {
            console.error('No signing key found for kid:', header.kid);
            return callback(new Error('No signing key found'));
        }
        
        const signingKey = key.publicKey || key.rsaPublicKey;
        if (!signingKey) {
            console.error('Invalid key format:', key);
            return callback(new Error('Invalid key format'));
        }
        
        callback(null, signingKey);
    });
}

// Verify JWT token from Cognito
function verifyToken(token) {
    return new Promise((resolve, reject) => {
        jwt.verify(token, getKey, {
            audience: process.env.AWS_USER_POOL_WEB_CLIENT_ID,
            issuer: `https://cognito-idp.${process.env.AWS_REGION}.amazonaws.com/${process.env.AWS_USER_POOL_ID}`,
            algorithms: ['RS256']
        }, (err, decoded) => {
            if (err) {
                reject(err);
            } else {
                resolve(decoded);
            }
        });
    });
}

// Authentication middleware
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({
            error: 'Access token required',
            message: 'Please provide a valid access token'
        });
    }

    try {
        const decoded = await verifyToken(token);
        req.user = {
            sub: decoded.sub,
            email: decoded.email,
            userRole: decoded['custom:userRole'] || 'owner', // Default to owner for Cognito users
            businessId: decoded['custom:businessId'],
            businessName: decoded['custom:businessName'],
            businessType: decoded['custom:businessType'],
            phone: decoded['custom:phone']
        };

        console.log('✅ User authenticated:', {
            email: req.user.email,
            role: req.user.userRole,
            businessId: req.user.businessId
        });
        next();
    } catch (error) {
        console.error('Token verification error:', error);
        return res.status(403).json({
            error: 'Invalid token',
            message: 'Token verification failed'
        });
    }
};

// Role-based authorization middleware
const authorizeRole = (requiredRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                error: 'Authentication required',
                message: 'User not authenticated'
            });
        }

        const userRole = req.user.userRole;

        if (!requiredRoles.includes(userRole)) {
            return res.status(403).json({
                error: 'Insufficient permissions',
                message: `Access denied. Required roles: ${requiredRoles.join(', ')}. Your role: ${userRole}`
            });
        }

        next();
    };
};

// Permission-based authorization middleware
const authorizePermission = (requiredPermission) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                error: 'Authentication required',
                message: 'User not authenticated'
            });
        }

        const userRole = req.user.userRole;

        // Import permissions mapping (you might want to move this to a separate file)
        const rolePermissions = {
            owner: {
                // User Management
                canCreateEmployee: true,
                canEditEmployee: true,
                canDeactivateEmployee: true,
                canViewEmployeeActivity: true,

                // Menu Management
                canManageMenuItems: true,
                canManageMenuCategories: true,
                canToggleItemAvailability: true,

                // Order Management
                canViewAllOrders: true,
                canUpdateOrders: true,
                canCancelOrders: true,
                canTakeDineInOrders: true,
                canHandleOnlineOrders: true,
                canUpdateOrderStatus: true,
                canGenerateBills: true,

                // Payment Management
                canViewAllTransactions: true,
                canProcessPayments: true,
                canHandleRefunds: true,
                canManageTaxRates: true,
                canManageDiscounts: true,
                canApplyDiscounts: true,

                // Analytics & Reports
                canViewSalesAnalytics: true,
                canViewEmployeePerformance: true,
                canViewRevenueBreakdown: true,

                // System Configuration
                canManageRestaurantDetails: true,
                canManagePaymentGateway: true,
                canManageNotificationSettings: true,

                // Menu Interaction
                canViewMenuItems: true,
                canNotifyItemUnavailable: true,

                // Account Management
                canUpdatePersonalDetails: true
            },
            employee: {
                // User Management
                canCreateEmployee: false,
                canEditEmployee: false,
                canDeactivateEmployee: false,
                canViewEmployeeActivity: false,

                // Menu Management
                canManageMenuItems: false,
                canManageMenuCategories: false,
                canToggleItemAvailability: false,

                // Order Management
                canViewAllOrders: false, // Can only see assigned orders
                canUpdateOrders: true,
                canCancelOrders: false,
                canTakeDineInOrders: true,
                canHandleOnlineOrders: true,
                canUpdateOrderStatus: true,
                canGenerateBills: true,

                // Payment Management
                canViewAllTransactions: false,
                canProcessPayments: true,
                canHandleRefunds: false,
                canManageTaxRates: false,
                canManageDiscounts: false,
                canApplyDiscounts: true, // Can apply owner-configured discounts

                // Analytics & Reports
                canViewSalesAnalytics: false,
                canViewEmployeePerformance: false,
                canViewRevenueBreakdown: false,

                // System Configuration
                canManageRestaurantDetails: false,
                canManagePaymentGateway: false,
                canManageNotificationSettings: false,

                // Menu Interaction
                canViewMenuItems: true,
                canNotifyItemUnavailable: true,

                // Account Management
                canUpdatePersonalDetails: true
            }
        };

        const userPermissions = rolePermissions[userRole] || {};

        if (!userPermissions[requiredPermission]) {
            return res.status(403).json({
                error: 'Insufficient permissions',
                message: `Access denied. Required permission: ${requiredPermission}. Your role: ${userRole}`
            });
        }

        next();
    };
};

module.exports = {
    authenticateToken,
    authorizeRole,
    authorizePermission
};
