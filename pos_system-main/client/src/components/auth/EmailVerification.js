import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

const EmailVerification = () => {
    console.log('🔍 EmailVerification - Component loaded');

    const [code, setCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const { confirmSignUp, resendConfirmationCode, error: authError, clearError } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Get email from location state or use a default
    const email = location.state?.email || '';
    console.log('📧 EmailVerification - Email from state:', email);

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log('🔄 EmailVerification - Form submitted');

        if (!code.trim()) {
            setError('Please enter the verification code');
            return;
        }

        setIsLoading(true);
        setError('');
        setMessage('');
        console.log('📤 EmailVerification - Calling confirmSignUp with:', { email, code });

        try {
            await confirmSignUp(email, code);
            console.log('✅ EmailVerification - Email verification successful');
            setMessage('Email verified successfully! You can now sign in.');
            setTimeout(() => {
                console.log('🔄 EmailVerification - Redirecting to login');
                navigate('/login');
            }, 2000);
        } catch (error) {
            console.error('❌ EmailVerification - Email verification failed:', error);
            setError(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendCode = async () => {
        console.log('🔄 EmailVerification - Resending code for:', email);
        setIsResending(true);
        setError('');
        setMessage('');

        try {
            await resendConfirmationCode(email);
            console.log('✅ EmailVerification - Code resent successfully');
            setMessage('Verification code sent! Please check your email.');
        } catch (error) {
            console.error('❌ EmailVerification - Resend failed:', error);
            setError(error.message);
        } finally {
            setIsResending(false);
        }
    };

    const handleBackToLogin = () => {
        navigate('/login');
    };

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
                            <Mail className="w-7 h-7 text-white" />
                        </div>
                        <span className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                            POS Pro
                        </span>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Verify Your Email</h1>
                    <p className="text-gray-600">
                        We've sent a verification code to <strong>{email}</strong>
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100"
                >
                    {message && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-3"
                        >
                            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                            <p className="text-green-700 text-sm">{message}</p>
                        </motion.div>
                    )}

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
                                Verification Code
                            </label>
                            <input
                                type="text"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary-500 transition-colors text-center text-lg tracking-widest"
                                placeholder="Enter 6-digit code"
                                maxLength="6"
                            />
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
                                    Verifying...
                                </>
                            ) : (
                                'Verify Email'
                            )}
                        </motion.button>
                    </form>

                    <div className="mt-6 space-y-4">
                        <button
                            onClick={handleResendCode}
                            disabled={isResending}
                            className="w-full text-center text-primary-600 hover:text-primary-500 font-medium transition-colors disabled:opacity-50"
                        >
                            {isResending ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin inline" />
                                    Sending...
                                </>
                            ) : (
                                "Didn't receive the code? Resend"
                            )}
                        </button>

                        <button
                            onClick={handleBackToLogin}
                            className="w-full flex items-center justify-center space-x-2 text-gray-600 hover:text-primary-600 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span>Back to Sign In</span>
                        </button>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default EmailVerification;
