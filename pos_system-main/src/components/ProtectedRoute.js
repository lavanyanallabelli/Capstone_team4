import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

const ProtectedRoute = ({ children }) => {
    const { currentUser, loading } = useAuth();

    if (loading) {
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

    return currentUser ? children : <Navigate to="/" replace />;
};

export default ProtectedRoute;
