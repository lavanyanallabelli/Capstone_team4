import React, { createContext, useContext, useState, useEffect } from 'react';
import { Hub } from 'aws-amplify';
import authService from '../aws/authService';
import { USER_ROLES, hasPermission } from '../aws/userRoles';
import '../aws/config'; // Initialize AWS Amplify

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Sign up with email and password
    const signup = async (email, password, userData) => {
        try {
            setError('');
            const user = await authService.signUp(email, password, userData);
            return user;
        } catch (error) {
            setError(error.message);
            throw error;
        }
    };

    // Sign in with email and password
    const login = async (email, password) => {
        try {
            setError('');
            const user = await authService.signIn(email, password);
            return user;
        } catch (error) {
            setError(error.message);
            throw error;
        }
    };

    // Sign out
    const logout = async () => {
        try {
            setError('');
            await authService.signOut();
        } catch (error) {
            setError(error.message);
            throw error;
        }
    };

    // Reset password
    const resetPassword = async (email) => {
        try {
            setError('');
            await authService.forgotPassword(email);
        } catch (error) {
            setError(error.message);
            throw error;
        }
    };

    // Confirm password reset
    const resetPasswordConfirm = async (email, code, newPassword) => {
        try {
            setError('');
            await authService.forgotPasswordSubmit(email, code, newPassword);
        } catch (error) {
            setError(error.message);
            throw error;
        }
    };

    // Confirm sign up
    const confirmSignUp = async (email, code) => {
        try {
            setError('');
            await authService.confirmSignUp(email, code);
        } catch (error) {
            setError(error.message);
            throw error;
        }
    };

    // Resend confirmation code
    const resendConfirmationCode = async (email) => {
        try {
            setError('');
            await authService.resendSignUp(email);
        } catch (error) {
            setError(error.message);
            throw error;
        }
    };

    // Get user data from Cognito attributes
    const getUserData = async () => {
        try {
            const attributes = await authService.getUserAttributes();
            return {
                uid: attributes.sub,
                email: attributes.email,
                businessName: authService.getBusinessName(attributes),
                businessType: authService.getBusinessType(attributes),
                phone: authService.getPhone(attributes),
                userRole: authService.getUserRole(attributes),
                businessId: authService.getBusinessId(attributes),
                createdAt: attributes.created_at,
                emailVerified: attributes.email_verified === 'true'
            };
        } catch (error) {
            console.error('Error getting user data:', error);
            return null;
        }
    };

    // Check if user has permission
    const hasUserPermission = (permission) => {
        if (!currentUser?.userRole) return false;
        return hasPermission(currentUser.userRole, permission);
    };

    // Clear error
    const clearError = () => setError('');

    useEffect(() => {
        // Check for existing session
        const checkAuthState = async () => {
            try {
                const user = await authService.getCurrentUser();
                if (user) {
                    const userData = await getUserData();
                    setCurrentUser(userData);
                } else {
                    setCurrentUser(null);
                }
            } catch (error) {
                setCurrentUser(null);
            }
            setLoading(false);
        };

        checkAuthState();

        // Listen for auth events
        const hubListener = Hub.listen('auth', ({ payload: { event, data } }) => {
            switch (event) {
                case 'signIn':
                    getUserData().then(userData => {
                        setCurrentUser(userData);
                    });
                    break;
                case 'signOut':
                    setCurrentUser(null);
                    break;
                case 'signUp':
                    // Handle sign up event if needed
                    break;
                default:
                    break;
            }
        });

        return () => {
            hubListener();
        };
    }, []);

    const value = {
        currentUser,
        signup,
        login,
        logout,
        resetPassword,
        resetPasswordConfirm,
        confirmSignUp,
        resendConfirmationCode,
        getUserData,
        hasUserPermission,
        loading,
        error,
        clearError
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
