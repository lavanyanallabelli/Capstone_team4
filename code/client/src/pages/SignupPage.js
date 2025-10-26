import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { CreditCard, ArrowLeft } from 'lucide-react';
import SignupForm from '../components/auth/SignupForm';

const SignupPage = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center p-4">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-hero-pattern opacity-5"></div>

            <div className="w-full max-w-md relative z-10">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8"
                >
                    {/* Back to Home */}
                    <Link
                        to="/"
                        className="inline-flex items-center space-x-2 text-gray-600 hover:text-primary-600 transition-colors mb-6"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back to Home</span>
                    </Link>

                    {/* Brand */}
                    <div className="flex items-center justify-center space-x-3 mb-6">
                        <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-xl">
                            <CreditCard className="w-7 h-7 text-white" />
                        </div>
                        <span className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                            POS Pro
                        </span>
                    </div>
                </motion.div>

                {/* Signup Form Card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100"
                >
                    <SignupForm
                        onClose={() => { }} // Not needed for page
                        onSwitchToLogin={() => { }} // Not needed - we'll use Link
                        isPage={true}
                    />
                </motion.div>

                {/* Footer */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-center mt-8"
                >
                    <p className="text-gray-600">
                        Already have an account?{' '}
                        <Link
                            to="/login"
                            className="text-primary-600 hover:text-primary-500 font-medium transition-colors"
                        >
                            Sign in here
                        </Link>
                    </p>
                </motion.div>
            </div>
        </div>
    );
};

export default SignupPage;
