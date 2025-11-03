const { Owner } = require('../models');

/**
 * Middleware to sync Cognito user with PostgreSQL Owner record
 * This ensures that when a Cognito user authenticates, they have a corresponding Owner record
 */
const syncCognitoUserToOwner = async (req, res, next) => {
    try {
        // If user is already authenticated and has ownerId, continue
        if (req.user && req.user.ownerId) {
            console.log('✅ Already has ownerId:', req.user.ownerId);
            return next();
        }

        // If no user from auth middleware, skip
        if (!req.user) {
            console.log('⚠️ No user in request, skipping sync');
            return next();
        }

        console.log('🔍 Syncing Cognito user to Owner. Current req.user:', {
            email: req.user.email,
            sub: req.user.sub,
            businessId: req.user.businessId,
            hasOwnerId: !!req.user.ownerId
        });

        const cognitoSub = req.user.sub;
        const email = req.user.email;
        
        if (!email) {
            console.error('❌ No email in Cognito token - cannot sync to Owner');
            return res.status(400).json({
                success: false,
                error: 'Missing email',
                message: 'Email is required for authentication'
            });
        }
        
        const businessId = req.user.businessId; // This is a Cognito string like "biz_xxx", not a UUID
        const businessName = req.user.businessName;
        let businessType = req.user.businessType;
        const phone = req.user.phone;
        
        // Try to get actual user name from Cognito attributes
        // Cognito might have name, given_name, or family_name attributes
        const userFirstName = req.user.given_name || req.user['custom:firstName'];
        const userLastName = req.user.family_name || req.user['custom:lastName'];
        const userName = req.user.name || (userFirstName && userLastName ? `${userFirstName} ${userLastName}` : null);

        // Normalize businessType to match PostgreSQL enum values (capitalized)
        // Cognito might send lowercase, but enum expects: 'Restaurant', 'Cafe', 'Fast Food', 'Fine Dining', 'Bar'
        const businessTypeMap = {
            'restaurant': 'Restaurant',
            'cafe': 'Cafe',
            'fast food': 'Fast Food',
            'fastfood': 'Fast Food',
            'fine dining': 'Fine Dining',
            'finedining': 'Fine Dining',
            'bar': 'Bar'
        };
        
        if (businessType) {
            const normalized = businessTypeMap[businessType.toLowerCase()];
            if (normalized) {
                businessType = normalized;
                console.log('✅ Normalized businessType:', req.user.businessType, '→', businessType);
            } else {
                // If not in map, capitalize first letter as fallback
                businessType = businessType.charAt(0).toUpperCase() + businessType.slice(1).toLowerCase();
                console.log('⚠️ Unknown businessType, capitalized:', businessType);
            }
        } else {
            businessType = 'Restaurant'; // Default
        }

        console.log('🔍 Looking up Owner by email:', email);
        console.log('🔍 Authenticated user:', {
            email,
            sub: cognitoSub,
            businessId,
            businessName
        });
        
        // SECURITY: Find Owner by email - must match exactly with authenticated user's email
        let owner = await Owner.findOne({
            where: {
                email: email // Exact match required
            }
        });
        
        console.log('🔍 Owner lookup result:', owner ? {
            found: true,
            ownerId: owner.id,
            ownerEmail: owner.email,
            matchesAuthenticatedEmail: owner.email === email
        } : 'Not found');

        if (!owner) {
            // Create new Owner record from Cognito user data
            // PostgreSQL will auto-generate a UUID for the id field
            // Ensure all required fields have values
            const defaultName = userName || businessName || email.split('@')[0] || 'Owner';
            const defaultBusinessName = businessName || email.split('@')[0] || 'My Business';
            
            const ownerData = {
                email: email,
                name: defaultName,
                businessName: defaultBusinessName,
                businessType: businessType || 'Restaurant', // Ensure businessType has a default
                phone: phone || null,
                password: 'cognito-auth', // Placeholder - Cognito handles auth
                isActive: true,
                loginCount: 0
            };
            
            console.log('📝 Creating new Owner with:', ownerData);
            
            try {
                owner = await Owner.create(ownerData);
                console.log('✅ Created Owner record for Cognito user:', {
                    email,
                    ownerId: owner.id,
                    cognitoBusinessId: businessId
                });
            } catch (createError) {
                console.error('❌ Error creating Owner record:', createError);
                console.error('Error name:', createError.name);
                console.error('Error message:', createError.message);
                
                // If unique constraint violation (email already exists), try to find again
                if (createError.name === 'SequelizeUniqueConstraintError' || createError.message.includes('unique')) {
                    console.log('🔄 Email might already exist, attempting to find Owner again...');
                    owner = await Owner.findOne({ where: { email: email } });
                    if (owner) {
                        console.log('✅ Found existing Owner after unique constraint error');
                    } else {
                        throw new Error(`Failed to create Owner: ${createError.message}`);
                    }
                } else {
                    throw createError; // Re-throw other errors
                }
            }
        } else {
            // SECURITY: Double-check email matches before updating or using this owner
            if (owner.email !== email) {
                console.error('🚨 SECURITY ALERT: Email mismatch in existing owner!', {
                    ownerEmail: owner.email,
                    authenticatedEmail: email,
                    ownerId: owner.id
                });
                // This is a different owner - don't use this record
                // Create a new owner record instead
                console.log('📝 Creating new Owner record due to email mismatch');
                owner = await Owner.create({
                    email: email,
                    name: userName || businessName || email.split('@')[0],
                    businessName: businessName || email.split('@')[0],
                    businessType: businessType,
                    phone: phone || null,
                    password: 'cognito-auth',
                    isActive: true,
                    loginCount: 0
                });
                console.log('✅ Created new Owner record:', {
                    email,
                    ownerId: owner.id
                });
            } else {
                // Email matches - safe to update existing owner
                // Only update name if it's currently set to businessName (fix incorrect sync)
                if (userName && (owner.name === owner.businessName || !owner.name)) {
                    owner.name = userName;
                }
                if (businessName && !owner.businessName) {
                    owner.businessName = businessName;
                }
                if (businessType && !owner.businessType) {
                    owner.businessType = businessType;
                }
                if (phone && !owner.phone) {
                    owner.phone = phone;
                }
                await owner.save();
                
                console.log('✅ Found existing Owner record (email matches):', {
                    email,
                    ownerId: owner.id,
                    emailMatches: owner.email === email
                });
            }
        }

        // CRITICAL: Verify owner was created/found before continuing
        if (!owner || !owner.id) {
            console.error('❌ CRITICAL: Owner record not found or has no ID after sync attempt');
            return res.status(500).json({
                success: false,
                error: 'Account sync failed',
                message: 'Failed to sync user account to database. Please contact support or try logging out and back in.',
                details: process.env.NODE_ENV === 'development' ? 'Owner record not found after creation/lookup' : undefined
            });
        }

        // IMPORTANT: Use the PostgreSQL UUID (owner.id) not the Cognito string
        // Attach ownerId to req.user for use in routes - this is the UUID from PostgreSQL
        req.user.ownerId = owner.id; // PostgreSQL UUID
        req.user.businessId = owner.id; // Override Cognito string with UUID

        // Final verification that ownerId is set correctly
        if (!req.user.ownerId || typeof req.user.ownerId !== 'string') {
            console.error('❌ CRITICAL: ownerId not properly set after sync:', {
                ownerId: req.user.ownerId,
                ownerIdType: typeof req.user.ownerId,
                ownerExists: !!owner,
                ownerIdExists: !!(owner && owner.id)
            });
            return res.status(500).json({
                success: false,
                error: 'Account sync failed',
                message: 'Failed to set user account ID. Please try logging out and back in.',
                details: process.env.NODE_ENV === 'development' ? 'ownerId not properly assigned to req.user' : undefined
            });
        }

        console.log('✅ Sync complete. Set req.user:', {
            ownerId: req.user.ownerId,
            businessId: req.user.businessId,
            email: req.user.email,
            ownerIdType: typeof req.user.ownerId,
            isUUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(req.user.ownerId)
        });

        next();
    } catch (error) {
        console.error('❌ Error syncing Cognito user to Owner:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            reqUser: req.user ? {
                email: req.user.email,
                sub: req.user.sub,
                hasOwnerId: !!req.user.ownerId
            } : 'No req.user'
        });
        
        // CRITICAL: If sync fails, we MUST return an error
        // Don't continue without ownerId - routes will fail with "Owner ID is required"
        return res.status(500).json({
            success: false,
            error: 'Authentication sync failed',
            message: 'Failed to sync user account. Please try logging out and logging in again.',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

module.exports = { syncCognitoUserToOwner };

