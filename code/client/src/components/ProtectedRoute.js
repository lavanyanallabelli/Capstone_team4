import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import apiService from '../services/api';
import { USER_ROLES } from '../aws/userRoles';

const ProtectedRoute = ({ children }) => {
    const { currentUser, loading } = useAuth();
    const [subscriptionCheck, setSubscriptionCheck] = useState({ loading: true, expired: false });

    useEffect(() => {
        const checkSubscription = async () => {
            // Only check for owners (not employees)
            if (!currentUser || currentUser.userRole !== USER_ROLES.OWNER) {
                setSubscriptionCheck({ loading: false, expired: false });
                return;
            }

            try {
                // First check if account is active
                const ownerProfileResponse = await apiService.getOwnerProfile();
                if (ownerProfileResponse.success && ownerProfileResponse.data) {
                    const ownerData = ownerProfileResponse.data;
                    if (ownerData.isActive === false) {
                        console.error('🚫 Account is inactive, redirecting to login');
                        // Clear auth and redirect
                        try {
                            const { Auth } = await import('aws-amplify');
                            await Auth.signOut();
                        } catch (e) {
                            // Ignore Cognito signout errors
                        }
                        localStorage.clear();
                        window.location.href = '/login';
                        return;
                    }
                }

                // Then check subscription status
                const response = await apiService.getSubscriptionStatus();
                if (response.success && response.data) {
                    const isExpired = response.data.isTrialExpired && !response.data.isActive;
                    setSubscriptionCheck({ loading: false, expired: isExpired });
                } else {
                    setSubscriptionCheck({ loading: false, expired: false });
                }
            } catch (error) {
                console.error('Error checking subscription:', error);
                // Check if error is due to inactive account
                if (error.accountInactive || error.response?.data?.accountInactive) {
                    console.error('🚫 Account is inactive, redirecting to login');
                    try {
                        const { Auth } = await import('aws-amplify');
                        await Auth.signOut();
                    } catch (e) {
                        // Ignore Cognito signout errors
                    }
                    localStorage.clear();
                    window.location.href = '/login';
                    return;
                }
                // On error, check if it's a subscription expired error
                if (error.response?.status === 403 && error.response?.data?.redirectTo) {
                    setSubscriptionCheck({ loading: false, expired: true });
                } else {
                    setSubscriptionCheck({ loading: false, expired: false });
                }
            }
        };

        if (!loading && currentUser) {
            checkSubscription();
        } else if (!loading && !currentUser) {
            setSubscriptionCheck({ loading: false, expired: false });
        }
    }, [currentUser, loading]);

    if (loading || subscriptionCheck.loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center"
                >
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="inline-block"
                    >
                        <Loader2 className="w-12 h-12 text-primary-600" />
                    </motion.div>
                    <p className="mt-4 text-gray-600 font-medium">Loading your dashboard...</p>
                </motion.div>
            </div>
        );
    }

    if (!currentUser) {
        return <Navigate to="/" replace />;
    }

    // Redirect to trial expired page if subscription expired
    if (subscriptionCheck.expired) {
        return <Navigate to="/trial-expired" replace />;
    }

    return children;
};

export default ProtectedRoute;
