import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, AlertCircle, Loader2, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const ResetPasswordForm = ({ onClose, onSwitchToLogin }) => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState('');

    const { resetPassword } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!email) {
            setError('Email is required');
            return;
        }

        if (!/\S+@\S+\.\S+/.test(email)) {
            setError('Please enter a valid email address');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            await resetPassword(email);
            setIsSuccess(true);
        } catch (error) {
            setError(error.message || 'Failed to send reset email');
        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md mx-auto text-center"
            >
                <div className="w-16 h-16 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-green-500" />
                </div>

                <h2 className="text-3xl font-bold text-gray-900 mb-4">Check Your Email</h2>
                <p className="text-gray-600 mb-8">
                    We've sent a password reset link to <strong>{email}</strong>.
                    Click the link in the email to reset your password.
                </p>

                <div className="space-y-4">
                    <button
                        onClick={onSwitchToLogin}
                        className="btn btn-primary w-full justify-center"
                    >
                        Back to Sign In
                    </button>

                    <p className="text-sm text-gray-500">
                        Didn't receive the email? Check your spam folder or{' '}
                        <button
                            onClick={() => setIsSuccess(false)}
                            className="text-primary-600 hover:text-primary-500"
                        >
                            try again
                        </button>
                    </p>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-md mx-auto"
        >
            <button
                onClick={onSwitchToLogin}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 mb-6 transition-colors"
            >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Sign In</span>
            </button>

            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Reset Password</h2>
                <p className="text-gray-600">
                    Enter your email address and we'll send you a link to reset your password.
                </p>
            </div>

            {error && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-3"
                >
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    <p className="text-red-700 text-sm">{error}</p>
                </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                    </label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none transition-colors"
                            placeholder="Enter your email"
                            required
                        />
                    </div>
                </div>

                <motion.button
                    type="submit"
                    disabled={isLoading}
                    className="btn btn-primary w-full justify-center"
                    whileHover={{ scale: isLoading ? 1 : 1.02 }}
                    whileTap={{ scale: isLoading ? 1 : 0.98 }}
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Sending Reset Link...
                        </>
                    ) : (
                        'Send Reset Link'
                    )}
                </motion.button>
            </form>
        </motion.div>
    );
};

export default ResetPasswordForm;
