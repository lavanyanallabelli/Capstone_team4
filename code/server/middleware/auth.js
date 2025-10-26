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
        const signingKey = key.publicKey || key.rsaPublicKey;
        callback(null, signingKey);
    });
}

// Verify JWT token
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
            userRole: decoded['custom:userRole'] || 'cashier',
            businessId: decoded['custom:businessId'],
            businessName: decoded['custom:businessName'],
            businessType: decoded['custom:businessType'],
            phone: decoded['custom:phone']
        };
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
            admin: {
                canProcessSales: true,
                canManageInventory: true,
                canViewReports: true,
                canManageUsers: true,
                canManageSettings: true,
                canProcessRefunds: true,
                canViewAnalytics: true,
                canManageProducts: true,
                canViewCustomers: true,
                canManageCustomers: true,
                canVoidTransactions: true,
                canAdjustInventory: true,
                canExportData: true,
                canManageRoles: true,
                canManageSystem: true,
                canViewFinancials: true,
                canManageBilling: true
            },
            owner: {
                canProcessSales: true,
                canManageInventory: true,
                canViewReports: true,
                canManageUsers: true,
                canManageSettings: true,
                canProcessRefunds: true,
                canViewAnalytics: true,
                canManageProducts: true,
                canViewCustomers: true,
                canManageCustomers: true,
                canVoidTransactions: true,
                canAdjustInventory: true,
                canExportData: true,
                canManageRoles: false,
                canManageSystem: false,
                canViewFinancials: true,
                canManageBilling: true
            },
            manager: {
                canProcessSales: true,
                canManageInventory: true,
                canViewReports: true,
                canManageUsers: false,
                canManageSettings: false,
                canProcessRefunds: true,
                canViewAnalytics: true,
                canManageProducts: true,
                canViewCustomers: true,
                canManageCustomers: true,
                canVoidTransactions: true,
                canAdjustInventory: true,
                canExportData: true,
                canManageRoles: false,
                canManageSystem: false,
                canViewFinancials: true,
                canManageBilling: false
            },
            cashier: {
                canProcessSales: true,
                canManageInventory: false,
                canViewReports: false,
                canManageUsers: false,
                canManageSettings: false,
                canProcessRefunds: false,
                canViewAnalytics: false,
                canManageProducts: false,
                canViewCustomers: true,
                canManageCustomers: false,
                canVoidTransactions: false,
                canAdjustInventory: false,
                canExportData: false,
                canManageRoles: false,
                canManageSystem: false,
                canViewFinancials: false,
                canManageBilling: false
            },
            readonly: {
                canProcessSales: false,
                canManageInventory: false,
                canViewReports: true,
                canManageUsers: false,
                canManageSettings: false,
                canProcessRefunds: false,
                canViewAnalytics: true,
                canManageProducts: false,
                canViewCustomers: true,
                canManageCustomers: false,
                canVoidTransactions: false,
                canAdjustInventory: false,
                canExportData: true,
                canManageRoles: false,
                canManageSystem: false,
                canViewFinancials: true,
                canManageBilling: false
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
