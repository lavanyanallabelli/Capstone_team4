import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import {
    User,
    ArrowRight,
    Clock,
    Users
} from 'lucide-react';

import apiService from '../services/api';
import { useNavigate } from 'react-router-dom';

const EmployeeLoginPage = () => {
    const { currentUser, loading, logout } = useAuth();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        employeeId: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Show different content if already logged in
    if (currentUser) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4"
                >
                    <div className="text-center">
                        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Users className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Already Logged In</h1>
                        <p className="text-gray-600 mb-6">
                            You are currently logged in as: <strong>{currentUser.email}</strong>
                        </p>
                        <div className="space-y-3">
                            <button
                                onClick={() => window.location.href = '/pos'}
                                className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-600 transition-colors"
                            >
                                Go to POS System
                            </button>
                            <button
                                onClick={async () => {
                                    await logout();
                                    window.location.reload();
                                }}
                                className="w-full bg-gray-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-600 transition-colors"
                            >
                                Logout & Login as Employee
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        );
    }

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear error when user starts typing
        if (error) setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            // Use employee login API (ID only, no password)
            const response = await apiService.employeeLogin({
                employeeId: formData.employeeId
            });
            
            if (response.success && response.data.token) {
                // Store token and user data
                localStorage.setItem('token', response.data.token);
                
                // Store complete user data including owner info if available
                const userData = {
                    ...response.data.user,
                    businessName: response.data.user.businessName || 'Restaurant',
                    userRole: 'employee'
                };
                localStorage.setItem('user', JSON.stringify(userData));
                
                // Update auth context by triggering a state update
                // We'll reload to ensure auth context picks up the new user
                setTimeout(() => {
                    window.location.href = '/pos';
                }, 100);
            } else {
                setError('Invalid Employee ID. Please try again.');
            }
        } catch (error) {
            console.error('Login error:', error);
            setError(error.response?.data?.message || 'Invalid Employee ID. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md"
            >
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Employee Login</h1>
                    <p className="text-gray-600">Access the POS system</p>
                </div>

                {/* Login Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Employee ID Field */}
                    <div>
                        <label htmlFor="employeeId" className="block text-sm font-medium text-gray-700 mb-2">
                            Employee ID
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <User className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                id="employeeId"
                                name="employeeId"
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                required
                                value={formData.employeeId}
                                onChange={handleInputChange}
                                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-lg font-mono"
                                placeholder="Enter your Employee ID (e.g., 1002001)"
                                maxLength="10"
                            />
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                            Enter the Employee ID you received via email
                        </p>
                    </div>


                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                            <p className="text-sm text-red-600">{error}</p>
                        </div>
                    )}

                    {/* Submit Button */}
                    <motion.button
                        type="submit"
                        disabled={isLoading}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                    >
                        {isLoading ? (
                            <>
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                <span>Signing in...</span>
                            </>
                        ) : (
                            <>
                                <span>Sign In</span>
                                <ArrowRight className="w-4 h-4" />
                            </>
                        )}
                    </motion.button>
                </form>

                {/* Footer */}
                <div className="mt-8 text-center">
                    <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 mb-4">
                        <Clock className="w-4 h-4" />
                        <span>Quick access for employees</span>
                    </div>
                    <p className="text-xs text-gray-400">
                        Need help? Contact your manager
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default EmployeeLoginPage;
