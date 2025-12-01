import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, AlertCircle, Loader2, RefreshCw, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import apiService from '../../services/api';

const LoginForm = ({ onClose, onSwitchToSignup, onSwitchToReset, isPage = false }) => {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [showReactivation, setShowReactivation] = useState(false);
    const [reactivationEmail, setReactivationEmail] = useState('');
    const [reactivationSent, setReactivationSent] = useState(false);

    const { login, error, clearError } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear error for this field
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.email) {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Email is invalid';
        }

        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }

        return newErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const newErrors = validateForm();
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setIsLoading(true);
        clearError();

        try {
            // Try backend login first to check for inactive accounts
            try {
                const response = await apiService.login({
                    email: formData.email,
                    password: formData.password
                });

                if (response.success) {
                    // Backend login successful - also try Cognito login
                    await login(formData.email, formData.password);
                    if (!isPage && onClose) onClose();
                    navigate('/dashboard');
                    return;
                } else if (response.accountInactive) {
                    // Account is inactive - show reactivation UI
                    setShowReactivation(true);
                    setReactivationEmail(formData.email);
                    setIsLoading(false);
                    return;
                }
            } catch (apiError) {
                // Check if error indicates inactive account
                if (apiError.response?.data?.accountInactive || apiError.message?.includes('deactivated')) {
                    setShowReactivation(true);
                    setReactivationEmail(formData.email);
                    setIsLoading(false);
                    return;
                }
                // If backend login fails for other reasons, try Cognito login
                console.log('Backend login failed, trying Cognito:', apiError);
            }

            // Fallback to Cognito login (but cognitoSync middleware will block inactive accounts)
            try {
                await login(formData.email, formData.password);
                if (!isPage && onClose) onClose();
                navigate('/dashboard');
            } catch (cognitoError) {
                // Cognito login might succeed, but API calls will be blocked by cognitoSync middleware
                // Check if the error is about inactive account
                if (cognitoError.message && cognitoError.message.includes('deactivated')) {
                    setShowReactivation(true);
                    setReactivationEmail(formData.email);
                } else {
                    throw cognitoError;
                }
            }
        } catch (error) {
            console.error('Login error:', error);
            // Check if error indicates inactive account
            if (error.message && (error.message.includes('deactivated') || error.message.includes('inactive'))) {
                setShowReactivation(true);
                setReactivationEmail(formData.email);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleRequestReactivation = async () => {
        if (!reactivationEmail) {
            setErrors({ email: 'Email is required' });
            return;
        }

        setIsLoading(true);
        try {
            const response = await apiService.requestReactivation(reactivationEmail);
            if (response.success) {
                setReactivationSent(true);
            } else {
                setErrors({ general: response.message || 'Failed to send reactivation email' });
            }
        } catch (error) {
            console.error('Reactivation request error:', error);
            setErrors({ general: 'Failed to send reactivation email. Please try again.' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-md mx-auto"
        >
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h2>
                <p className="text-gray-600">Sign in to your POS Pro account</p>
            </div>

            {error && !showReactivation && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-3"
                >
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    <p className="text-red-700 text-sm">{error}</p>
                </motion.div>
            )}

            {showReactivation ? (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                >
                    <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-start space-x-3 mb-4">
                            <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <h3 className="text-lg font-semibold text-yellow-900 mb-2">
                                    Your account is inactive
                                </h3>
                                <p className="text-yellow-800 text-sm">
                                    Your account has been deactivated. Would you like to reactivate it?
                                </p>
                            </div>
                        </div>

                        {reactivationSent ? (
                            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                                <div className="flex items-center space-x-2 text-green-800">
                                    <CheckCircle className="w-5 h-5" />
                                    <p className="text-sm font-medium">
                                        Reactivation email sent! Please check your inbox and click the link to reactivate your account.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="mt-4">
                                <p className="text-sm text-yellow-800 mb-4">
                                    We'll send a verification email to <strong>{reactivationEmail}</strong> to confirm your identity.
                                </p>
                                <div className="flex space-x-3">
                                    <motion.button
                                        type="button"
                                        onClick={handleRequestReactivation}
                                        disabled={isLoading}
                                        className="flex-1 btn btn-primary justify-center"
                                        whileHover={{ scale: isLoading ? 1 : 1.02 }}
                                        whileTap={{ scale: isLoading ? 1 : 0.98 }}
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                                Sending...
                                            </>
                                        ) : (
                                            <>
                                                <RefreshCw className="w-5 h-5 mr-2" />
                                                Reactivate
                                            </>
                                        )}
                                    </motion.button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowReactivation(false);
                                            setReactivationSent(false);
                                            setReactivationEmail('');
                                        }}
                                        className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}

                        {errors.general && (
                            <motion.p
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-3 text-sm text-red-600"
                            >
                                {errors.general}
                            </motion.p>
                        )}
                    </div>
                </motion.div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                    </label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:outline-none transition-colors ${errors.email
                                ? 'border-red-300 focus:border-red-500'
                                : 'border-gray-200 focus:border-primary-500'
                                }`}
                            placeholder="Enter your email"
                        />
                    </div>
                    {errors.email && (
                        <motion.p
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-1 text-sm text-red-600"
                        >
                            {errors.email}
                        </motion.p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Password
                    </label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type={showPassword ? 'text' : 'password'}
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className={`w-full pl-10 pr-12 py-3 border-2 rounded-xl focus:outline-none transition-colors ${errors.password
                                ? 'border-red-300 focus:border-red-500'
                                : 'border-gray-200 focus:border-primary-500'
                                }`}
                            placeholder="Enter your password"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                    </div>
                    {errors.password && (
                        <motion.p
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-1 text-sm text-red-600"
                        >
                            {errors.password}
                        </motion.p>
                    )}
                </div>

                <div className="flex items-center justify-between">
                    <label className="flex items-center">
                        <input type="checkbox" className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                        <span className="ml-2 text-sm text-gray-600">Remember me</span>
                    </label>
                    {isPage ? (
                        <Link
                            to="/reset-password"
                            className="text-sm text-primary-600 hover:text-primary-500"
                        >
                            Forgot password?
                        </Link>
                    ) : (
                        <button
                            type="button"
                            onClick={onSwitchToReset}
                            className="text-sm text-primary-600 hover:text-primary-500"
                        >
                            Forgot password?
                        </button>
                    )}
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
                            Signing In...
                        </>
                    ) : (
                        'Sign In'
                    )}
                </motion.button>
            </form>
            )}

            {!isPage && !showReactivation && (
                <div className="mt-6 text-center">
                    <p className="text-gray-600">
                        Don't have an account?{' '}
                        <button
                            onClick={onSwitchToSignup}
                            className="text-primary-600 hover:text-primary-500 font-medium"
                        >
                            Sign up here
                        </button>
                    </p>
                </div>
            )}
        </motion.div>
    );
};

export default LoginForm;
