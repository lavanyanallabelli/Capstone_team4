import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';
import { Users, Hash, ArrowRight, Clock } from 'lucide-react';

const EmployeeLoginPage = () => {
    const { currentUser, loading, logout } = useAuth();
    const [employeeId, setEmployeeId] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            if (!employeeId.trim()) {
                setError('Employee ID is required');
                return;
            }
            const response = await apiService.employeeLogin({ employeeId: employeeId.trim() });
            if (!response?.success) {
                throw new Error(response?.message || 'Login failed');
            }
            const { token, user } = response.data || {};
            if (token) localStorage.setItem('employeeToken', token);
            if (user) localStorage.setItem('employeeUser', JSON.stringify(user));
            window.location.href = '/pos';
        } catch (err) {
            console.error('Employee login error:', err);
            setError('Invalid Employee ID. Please try again.');
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
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Employee Login</h1>
                    <p className="text-gray-600">Enter your Employee ID to access the POS system</p>
                </div>

                {currentUser && (
                    <div className="mb-6 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg p-3 text-sm">
                        An owner session is active. You can still log in with an Employee ID below, or
                        <button onClick={async () => { await logout(); }} className="ml-2 underline hover:no-underline">logout owner</button>
                        first.
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="employeeId" className="block text-sm font-medium text-gray-700 mb-2">
                            Employee ID
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Hash className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                id="employeeId"
                                name="employeeId"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                required
                                value={employeeId}
                                onChange={(e) => { setEmployeeId(e.target.value); if (error) setError(''); }}
                                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors font-mono tracking-wider"
                                placeholder="e.g., 1234561"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                            <p className="text-sm text-red-600">{error}</p>
                        </div>
                    )}

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

                <div className="mt-8 text-center">
                    <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 mb-4">
                        <Clock className="w-4 h-4" />
                        <span>Quick access for employees</span>
                    </div>
                    <p className="text-xs text-gray-400">Need help? Contact your manager</p>
                </div>
            </motion.div>
        </div>
    );
};

export default EmployeeLoginPage;
