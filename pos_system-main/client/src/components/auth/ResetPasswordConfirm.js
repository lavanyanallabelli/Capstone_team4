import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, AlertCircle, Loader2, CheckCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

const ResetPasswordConfirm = () => {
    console.log('🔍 ResetPasswordConfirm - Component loaded');

    const [formData, setFormData] = useState({
        code: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState('');

    const { resetPasswordConfirm } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Get email from location state
    const email = location.state?.email || '';
    console.log('📧 ResetPasswordConfirm - Email from state:', email);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear error when user starts typing
        if (error) setError('');
    };

    const validateForm = () => {
        if (!formData.code.trim()) {
            setError('Verification code is required');
            return false;
        }

        if (!formData.newPassword) {
            setError('New password is required');
            return false;
        }

        if (formData.newPassword.length < 8) {
            setError('Password must be at least 8 characters long');
            return false;
        }

        if (formData.newPassword !== formData.confirmPassword) {
            setError('Passwords do not match');
            return false;
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log('🔄 ResetPasswordConfirm - Form submitted');

        if (!validateForm()) {
            console.log('❌ ResetPasswordConfirm - Form validation failed');
            return;
        }

        setIsLoading(true);
        setError('');
        console.log('📤 ResetPasswordConfirm - Calling resetPasswordConfirm with:', {
            email,
            code: formData.code,
            newPassword: '***' // Don't log actual password
        });

        try {
            await resetPasswordConfirm(email, formData.code, formData.newPassword);
            console.log('✅ ResetPasswordConfirm - Password reset successful');
            setIsSuccess(true);

            // Redirect to login after 3 seconds
            setTimeout(() => {
                console.log('🔄 ResetPasswordConfirm - Redirecting to login');
                navigate('/login');
            }, 3000);
        } catch (error) {
            console.error('❌ ResetPasswordConfirm - Password reset failed:', error);
            setError(error.message || 'Failed to reset password');
        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-2xl shadow-2xl p-8 text-center"
                    >
                        <div className="w-16 h-16 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-8 h-8 text-green-500" />
                        </div>

                        <h2 className="text-3xl font-bold text-gray-900 mb-4">Password Reset Successful!</h2>
                        <p className="text-gray-600 mb-8">
                            Your password has been successfully reset. You can now sign in with your new password.
                        </p>

                        <motion.button
                            onClick={() => navigate('/login')}
                            className="btn btn-primary w-full justify-center"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            Go to Sign In
                        </motion.button>

                        <p className="text-sm text-gray-500 mt-4">
                            Redirecting to sign in page in 3 seconds...
                        </p>
                    </motion.div>
                </div>
            </div>
        );
    }

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
                            <Lock className="w-7 h-7 text-white" />
                        </div>
                        <span className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                            POS Pro
                        </span>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Reset Your Password</h1>
                    <p className="text-gray-600">
                        Enter the verification code sent to <strong>{email}</strong> and your new password
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100"
                >
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
                                name="code"
                                value={formData.code}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary-500 transition-colors text-center text-lg tracking-widest"
                                placeholder="Enter 6-digit code"
                                maxLength="6"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                New Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="newPassword"
                                    value={formData.newPassword}
                                    onChange={handleChange}
                                    className="w-full pl-10 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary-500 transition-colors"
                                    placeholder="Enter new password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Confirm New Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    className="w-full pl-10 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary-500 transition-colors"
                                    placeholder="Confirm new password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
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
                                    Resetting Password...
                                </>
                            ) : (
                                'Reset Password'
                            )}
                        </motion.button>
                    </form>

                    <div className="mt-6 text-center">
                        <button
                            onClick={() => navigate('/login')}
                            className="flex items-center justify-center space-x-2 text-gray-600 hover:text-primary-600 transition-colors mx-auto"
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

export default ResetPasswordConfirm;
