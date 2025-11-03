const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');
const AWS = require('aws-sdk');

// Configure AWS
AWS.config.update({
    region: process.env.AWS_REGION || 'us-east-1'
});

const cognitoIdentityServiceProvider = new AWS.CognitoIdentityServiceProvider();

// JWKS client for token verification with proper error handling
let client;

try {
    const jwksUri = process.env.JWKS_URI || `https://cognito-idp.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${process.env.AWS_USER_POOL_ID}/.well-known/jwks.json`;
    console.log('🔧 Initializing JWKS client with URI:', jwksUri);

    client = jwksClient({
        jwksUri: jwksUri,
        requestHeaders: {}, // Additional headers
        timeout: 30000, // 30s timeout
        cache: true,
        cacheMaxEntries: 5,
        cacheMaxAge: 600000, // 10 minutes
        rateLimit: true,
        jwksRequestsPerMinute: 10 // Limit requests to avoid rate limiting
    });

    if (!client) {
        throw new Error('Failed to create JWKS client');
    }
    console.log('✅ JWKS client initialized successfully');
} catch (clientError) {
    console.error('❌ Failed to initialize JWKS client:', clientError);
    client = null;
}

// Get signing key for JWT verification
function getKey(header, callback) {
    if (!client) {
        console.error('❌ JWKS client not initialized');
        return callback(new Error('JWKS client not configured. Please check JWKS_URI in environment variables.'));
    }

    // Extract kid from header
    const kid = header.kid;

    if (!kid) {
        console.error('❌ No KID found in token header');
        return callback(new Error('Token header missing Key ID (kid)'));
    }

    console.log('🔑 Looking up signing key for kid:', kid);
    console.log('🔍 JWKS URI:', client.jwksUri || process.env.JWKS_URI);

    try {
        client.getSigningKey(kid, (err, key) => {
            if (err) {
                console.error('❌ Error getting signing key:', err.message);
                console.error('Error details:', {
                    message: err.message,
                    code: err.code,
                    statusCode: err.statusCode,
                    response: err.response
                });

                // Provide helpful error messages
                if (err.message && err.message.includes('uri')) {
                    console.error('⚠️ JWKS URI configuration issue. Check JWKS_URI environment variable.');
                    return callback(new Error('JWKS configuration error. Please check JWKS_URI in server configuration.'));
                }
                if (err.message && err.message.includes('Too many requests')) {
                    console.error('⚠️ Rate limited by JWKS endpoint. Caching should prevent this.');
                    return callback(new Error('JWKS endpoint rate limited. Please wait a moment and try again.'));
                }
                return callback(err);
            }

            if (!key) {
                console.error('❌ No signing key found for kid:', kid);
                return callback(new Error('No signing key found for token'));
            }

            const signingKey = key.publicKey || key.rsaPublicKey;
            if (!signingKey) {
                console.error('❌ Invalid key format:', Object.keys(key || {}));
                return callback(new Error('Invalid signing key format'));
            }

            console.log('✅ Signing key found for kid:', kid);
            callback(null, signingKey);
        });
    } catch (callError) {
        console.error('❌ Exception in getSigningKey call:', callError);
        callback(callError);
    }
}

// Verify JWT token from Cognito
function verifyToken(token) {
    return new Promise((resolve, reject) => {
        // First, decode the token header to check for kid
        try {
            const decodedHeader = jwt.decode(token, { complete: true });
            if (decodedHeader && decodedHeader.header) {
                const kid = decodedHeader.header.kid;
                if (!kid) {
                    console.error('⚠️ Token missing KID in header. Header:', decodedHeader.header);
                    // Continue anyway - getKey will handle it
                } else {
                    console.log('📋 Token KID found:', kid);
                }
            }
        } catch (decodeError) {
            console.error('❌ Error decoding token header:', decodeError.message);
            // Continue with verification anyway
        }

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

// Verify employee JWT token (different from Cognito token)
function verifyEmployeeToken(token) {
    return new Promise((resolve, reject) => {
        try {
            // Employee tokens use HS256 algorithm, not RS256
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret', {
                algorithms: ['HS256'] // Specify algorithm explicitly
            });
            resolve(decoded);
        } catch (error) {
            console.error('❌ Employee token verification failed:', error.message);
            reject(error);
        }
    });
}

// Authentication middleware - handles both Cognito and Employee tokens
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
        // First try to verify as Cognito token (for owners)
        let decoded;
        let isEmployeeToken = false;

        try {
            decoded = await verifyToken(token);
            // If this succeeds, it's a Cognito token
            console.log('✅ Cognito token verified (Owner)');
        } catch (cognitoError) {
            console.log('⚠️ Cognito verification failed, trying employee token...');
            console.log('Cognito error:', cognitoError.message);

            // If Cognito verification fails, try as employee JWT token
            try {
                decoded = await verifyEmployeeToken(token);
                isEmployeeToken = true;
                console.log('✅ Employee JWT token verified');
            } catch (employeeError) {
                console.error('❌ Token verification failed (both Cognito and Employee):', {
                    cognitoError: cognitoError.message,
                    employeeError: employeeError.message
                });

                // Provide more helpful error message
                let errorMessage = 'Token verification failed';
                if (cognitoError.message && cognitoError.message.includes('JWKS')) {
                    errorMessage = 'Unable to verify token. Please check JWKS configuration or try logging in again.';
                } else if (cognitoError.message && cognitoError.message.includes('rate')) {
                    errorMessage = 'Too many requests. Please wait a moment and try again.';
                }

                return res.status(403).json({
                    error: 'Invalid token',
                    message: errorMessage
                });
            }
        }

        // Build user object based on token type
        if (isEmployeeToken) {
            // Employee token structure
            req.user = {
                sub: decoded.sub,
                email: decoded.email,
                userRole: decoded['custom:userRole'] || 'employee',
                businessId: decoded['custom:businessId'],
                businessName: decoded['custom:businessName'],
                businessType: decoded['custom:businessType'],
                phone: decoded['custom:phone'],
                ownerId: decoded['custom:businessId'] // Employee's ownerId is in businessId
            };
        } else {
            // Cognito token structure (owner)
            req.user = {
                sub: decoded.sub,
                email: decoded.email,
                userRole: decoded['custom:userRole'] || 'owner', // Default to owner for Cognito users
                businessId: decoded['custom:businessId'],
                businessName: decoded['custom:businessName'],
                businessType: decoded['custom:businessType'],
                phone: decoded['custom:phone']
            };
        }

        console.log('✅ User authenticated:', {
            email: req.user.email,
            role: req.user.userRole,
            businessId: req.user.businessId,
            tokenType: isEmployeeToken ? 'Employee JWT' : 'Cognito'
        });
        next();
    } catch (error) {
        console.error('❌ Token verification error:', error);
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
