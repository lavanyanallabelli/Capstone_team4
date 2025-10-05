import React, { createContext, useContext, useState, useEffect } from 'react';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile,
    sendPasswordResetEmail
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

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
            const { user } = await createUserWithEmailAndPassword(auth, email, password);

            // Update user profile
            await updateProfile(user, {
                displayName: userData.businessName
            });

            // Save additional user data to Firestore
            await setDoc(doc(db, 'users', user.uid), {
                uid: user.uid,
                email: email,
                businessName: userData.businessName,
                phone: userData.phone || '',
                businessType: userData.businessType || '',
                createdAt: new Date().toISOString(),
                plan: 'trial',
                trialStartDate: new Date().toISOString(),
                trialEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days trial
            });

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
            const { user } = await signInWithEmailAndPassword(auth, email, password);
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
            await signOut(auth);
        } catch (error) {
            setError(error.message);
            throw error;
        }
    };

    // Reset password
    const resetPassword = async (email) => {
        try {
            setError('');
            await sendPasswordResetEmail(auth, email);
        } catch (error) {
            setError(error.message);
            throw error;
        }
    };

    // Get user data from Firestore
    const getUserData = async (uid) => {
        try {
            const docRef = doc(db, 'users', uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                return docSnap.data();
            }
            return null;
        } catch (error) {
            console.error('Error getting user data:', error);
            return null;
        }
    };

    // Clear error
    const clearError = () => setError('');

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                // Get additional user data from Firestore
                const userData = await getUserData(user.uid);
                setCurrentUser({ ...user, ...userData });
            } else {
                setCurrentUser(null);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const value = {
        currentUser,
        signup,
        login,
        logout,
        resetPassword,
        getUserData,
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
