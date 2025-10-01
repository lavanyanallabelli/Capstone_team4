import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, Phone, Building, Eye, EyeOff, AlertCircle, Loader2, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
// import { Link } from 'react-router-dom'; // Unused import - keeping for future use

const SignupForm = ({ onClose, onSwitchToLogin, isPage = false }) => {
    const [formData, setFormData] = useState({
        businessName: '',
        email: '',
        phone: '',
        businessType: '',
        password: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const { signup, error, clearError } = useAuth();
    const navigate = useNavigate();

    const businessTypes = [
        { value: '', label: 'Select Business Type' },
        { value: 'retail', label: 'Retail Store' },
        { value: 'restaurant', label: 'Restaurant' },
        { value: 'cafe', label: 'Café/Coffee Shop' },
        { value: 'salon', label: 'Salon/Spa' },
        { value: 'pharmacy', label: 'Pharmacy' },
        { value: 'grocery', label: 'Grocery Store' },
        { value: 'clothing', label: 'Clothing Store' },
        { value: 'electronics', label: 'Electronics' },
        { value: 'other', label: 'Other' }
    ];

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

        if (!formData.businessName) {
            newErrors.businessName = 'Business name is required';
        }

        if (!formData.email) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Email is invalid';
        }

        if (!formData.phone) {
            newErrors.phone = 'Phone number is required';
        }

        if (!formData.businessType) {
            newErrors.businessType = 'Business type is required';
        }

        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }

        if (!formData.confirmPassword) {
            newErrors.confirmPassword = 'Please confirm your password';
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
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
            await signup(formData.email, formData.password, {
                businessName: formData.businessName,
                phone: formData.phone,
                businessType: formData.businessType
            });
            if (!isPage && onClose) onClose();
            navigate('/dashboard');
        } catch (error) {
            console.error('Signup error:', error);
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
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Start Your Free Trial</h2>
                <p className="text-gray-600">Create your POS Pro account in minutes</p>
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

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Business Name
                    </label>
                    <div className="relative">
                        <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            name="businessName"
                            value={formData.businessName}
                            onChange={handleChange}
                            className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:outline-none transition-colors ${errors.businessName
                                ? 'border-red-300 focus:border-red-500'
                                : 'border-gray-200 focus:border-primary-500'
                                }`}
                            placeholder="Your business name"
                        />
                    </div>
                    {errors.businessName && (
                        <motion.p
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-1 text-sm text-red-600"
                        >
                            {errors.businessName}
                        </motion.p>
                    )}
                </div>

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
                            placeholder="your@email.com"
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
                        Phone Number
                    </label>
                    <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:outline-none transition-colors ${errors.phone
                                ? 'border-red-300 focus:border-red-500'
                                : 'border-gray-200 focus:border-primary-500'
                                }`}
                            placeholder="(555) 123-4567"
                        />
                    </div>
                    {errors.phone && (
                        <motion.p
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-1 text-sm text-red-600"
                        >
                            {errors.phone}
                        </motion.p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Business Type
                    </label>
                    <select
                        name="businessType"
                        value={formData.businessType}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-colors ${errors.businessType
                            ? 'border-red-300 focus:border-red-500'
                            : 'border-gray-200 focus:border-primary-500'
                            }`}
                    >
                        {businessTypes.map((type) => (
                            <option key={type.value} value={type.value}>
                                {type.label}
                            </option>
                        ))}
                    </select>
                    {errors.businessType && (
                        <motion.p
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-1 text-sm text-red-600"
                        >
                            {errors.businessType}
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
                            placeholder="Create a password"
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

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Confirm Password
                    </label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            className={`w-full pl-10 pr-12 py-3 border-2 rounded-xl focus:outline-none transition-colors ${errors.confirmPassword
                                ? 'border-red-300 focus:border-red-500'
                                : 'border-gray-200 focus:border-primary-500'
                                }`}
                            placeholder="Confirm your password"
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                    </div>
                    {errors.confirmPassword && (
                        <motion.p
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-1 text-sm text-red-600"
                        >
                            {errors.confirmPassword}
                        </motion.p>
                    )}
                </div>

                <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <p className="text-sm text-green-700">30-day free trial • No credit card required</p>
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
                            Creating Account...
                        </>
                    ) : (
                        'Start Free Trial'
                    )}
                </motion.button>
            </form>

            {!isPage && (
                <div className="mt-6 text-center">
                    <p className="text-gray-600">
                        Already have an account?{' '}
                        <button
                            onClick={onSwitchToLogin}
                            className="text-primary-600 hover:text-primary-500 font-medium"
                        >
                            Sign in here
                        </button>
                    </p>
                </div>
            )}
        </motion.div>
    );
};

export default SignupForm;
