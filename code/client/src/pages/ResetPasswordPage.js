import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ResetPasswordForm from '../components/auth/ResetPasswordForm';

const ResetPasswordPage = () => {
    console.log('🔍 ResetPasswordPage - Component loaded');
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8"
                >
                    <div className="flex items-center justify-center space-x-3 mb-6">
                        <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-xl">
                            <span className="text-white font-bold text-xl">P</span>
                        </div>
                        <span className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                            POS Pro
                        </span>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100"
                >
                    <button
                        onClick={() => navigate('/login')}
                        className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 mb-6 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back to Sign In</span>
                    </button>

                    <ResetPasswordForm
                        onSwitchToLogin={() => navigate('/login')}
                        isPage={true}
                    />
                </motion.div>
            </div>
        </div>
    );
};

export default ResetPasswordPage;
