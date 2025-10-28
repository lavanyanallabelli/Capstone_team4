import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import {
    User,
    Clock,
    LogOut,
    Settings,
    ShoppingCart,
    BarChart3
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const EmployeeQuickAccess = ({ onClose }) => {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const quickActions = [
        {
            name: 'POS System',
            icon: ShoppingCart,
            action: () => navigate('/pos'),
            color: 'bg-blue-500'
        },
        {
            name: 'Dashboard',
            icon: BarChart3,
            action: () => navigate('/dashboard'),
            color: 'bg-green-500'
        },
        {
            name: 'Settings',
            icon: Settings,
            action: () => navigate('/settings'),
            color: 'bg-gray-500'
        }
    ];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-gray-900">Employee Access</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        ✕
                    </button>
                </div>

                {/* Employee Info */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                            <User className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h4 className="font-semibold text-gray-900">{currentUser?.email}</h4>
                            <p className="text-sm text-gray-600">
                                {currentUser?.userRole === 'owner' ? '👑 Owner' : '👨‍🍳 Employee'}
                            </p>
                            <p className="text-xs text-gray-500">
                                {currentUser?.businessName}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="space-y-3 mb-6">
                    <h4 className="font-medium text-gray-900">Quick Actions</h4>
                    {quickActions.map((action, index) => {
                        const Icon = action.icon;
                        return (
                            <motion.button
                                key={index}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={action.action}
                                className="w-full flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                <div className={`w-8 h-8 ${action.color} rounded-lg flex items-center justify-center`}>
                                    <Icon className="w-4 h-4 text-white" />
                                </div>
                                <span className="font-medium text-gray-900">{action.name}</span>
                            </motion.button>
                        );
                    })}
                </div>

                {/* Logout Section */}
                <div className="border-t pt-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Clock className="w-4 h-4" />
                            <span>Logged in since {new Date().toLocaleTimeString()}</span>
                        </div>
                        <button
                            onClick={() => setShowLogoutConfirm(true)}
                            className="flex items-center space-x-2 text-red-600 hover:text-red-700 text-sm"
                        >
                            <LogOut className="w-4 h-4" />
                            <span>Logout</span>
                        </button>
                    </div>
                </div>

                {/* Logout Confirmation */}
                {showLogoutConfirm && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
                        <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
                            <h4 className="text-lg font-semibold text-gray-900 mb-2">Confirm Logout</h4>
                            <p className="text-gray-600 mb-4">Are you sure you want to logout?</p>
                            <div className="flex space-x-3">
                                <button
                                    onClick={handleLogout}
                                    className="flex-1 bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition-colors"
                                >
                                    Yes, Logout
                                </button>
                                <button
                                    onClick={() => setShowLogoutConfirm(false)}
                                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default EmployeeQuickAccess;
