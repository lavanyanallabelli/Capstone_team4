import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, User, Calendar, CreditCard, BarChart3, Package, DollarSign, ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const stats = [
        { label: 'Total Sales', value: '$0', icon: DollarSign, color: 'from-green-500 to-green-600' },
        { label: 'Orders Today', value: '0', icon: ShoppingCart, color: 'from-blue-500 to-blue-600' },
        { label: 'Inventory Items', value: '0', icon: Package, color: 'from-purple-500 to-purple-600' },
        { label: 'Revenue Growth', value: '0%', icon: BarChart3, color: 'from-orange-500 to-orange-600' },
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2,
            },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.5,
                ease: 'easeOut',
            },
        },
    };

    // Calculate trial days remaining
    const trialEndDate = new Date(currentUser?.trialEndDate);
    const today = new Date();
    const daysRemaining = Math.max(0, Math.ceil((trialEndDate - today) / (1000 * 60 * 60 * 24)));

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-gray-200">
                <div className="container py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-xl">
                                <CreditCard className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">POS Pro Dashboard</h1>
                                <p className="text-sm text-gray-600">Welcome back, {currentUser?.businessName || 'User'}!</p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-4">
                            {/* Trial Status */}
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2">
                                <p className="text-sm font-medium text-yellow-800">
                                    <Calendar className="w-4 h-4 inline mr-1" />
                                    {daysRemaining} days left in trial
                                </p>
                            </div>

                            {/* User Menu */}
                            <div className="flex items-center space-x-3">
                                <div className="flex items-center space-x-2 text-gray-700">
                                    <User className="w-5 h-5" />
                                    <span className="font-medium">{currentUser?.email}</span>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center space-x-2 text-gray-600 hover:text-red-600 transition-colors"
                                >
                                    <LogOut className="w-5 h-5" />
                                    <span>Logout</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container py-8">
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    {/* Welcome Section */}
                    <motion.div
                        variants={itemVariants}
                        className="bg-gradient-to-r from-primary-500 to-secondary-500 rounded-2xl p-8 text-white mb-8"
                    >
                        <h2 className="text-3xl font-bold mb-4">Welcome to Your POS Pro Dashboard! 🚀</h2>
                        <p className="text-lg text-blue-100 mb-6">
                            You're now part of our beta community. Your {daysRemaining}-day free trial has started,
                            and we're excited to help you grow your business.
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <motion.button
                                className="bg-white text-primary-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                Set Up Your Store
                            </motion.button>
                            <motion.button
                                className="border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-primary-600 transition-colors"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                Watch Tutorial
                            </motion.button>
                        </div>
                    </motion.div>

                    {/* Stats Grid */}
                    <motion.div
                        variants={itemVariants}
                        className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
                    >
                        {stats.map((stat, index) => {
                            const IconComponent = stat.icon;
                            return (
                                <motion.div
                                    key={index}
                                    variants={itemVariants}
                                    className="card p-6 hover:shadow-lg transition-all duration-300"
                                    whileHover={{ y: -5 }}
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${stat.color} flex items-center justify-center`}>
                                            <IconComponent className="w-6 h-6 text-white" />
                                        </div>
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</h3>
                                    <p className="text-gray-600">{stat.label}</p>
                                </motion.div>
                            );
                        })}
                    </motion.div>

                    {/* Getting Started Section */}
                    <motion.div
                        variants={itemVariants}
                        className="grid lg:grid-cols-2 gap-8"
                    >
                        {/* Quick Actions */}
                        <div className="card p-8">
                            <h3 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h3>
                            <div className="space-y-4">
                                <button className="w-full text-left p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                    <div className="flex items-center space-x-3">
                                        <Package className="w-6 h-6 text-primary-600" />
                                        <div>
                                            <h4 className="font-semibold text-gray-900">Add Products</h4>
                                            <p className="text-sm text-gray-600">Start by adding your first products to inventory</p>
                                        </div>
                                    </div>
                                </button>
                                <button className="w-full text-left p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                    <div className="flex items-center space-x-3">
                                        <CreditCard className="w-6 h-6 text-primary-600" />
                                        <div>
                                            <h4 className="font-semibold text-gray-900">Process Sale</h4>
                                            <p className="text-sm text-gray-600">Make your first sale with POS Pro</p>
                                        </div>
                                    </div>
                                </button>
                                <button className="w-full text-left p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                    <div className="flex items-center space-x-3">
                                        <BarChart3 className="w-6 h-6 text-primary-600" />
                                        <div>
                                            <h4 className="font-semibold text-gray-900">View Reports</h4>
                                            <p className="text-sm text-gray-600">Analyze your business performance</p>
                                        </div>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Account Info */}
                        <div className="card p-8">
                            <h3 className="text-xl font-bold text-gray-900 mb-6">Account Information</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                    <span className="text-gray-600">Business Name</span>
                                    <span className="font-medium">{currentUser?.businessName}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                    <span className="text-gray-600">Email</span>
                                    <span className="font-medium">{currentUser?.email}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                    <span className="text-gray-600">Business Type</span>
                                    <span className="font-medium capitalize">{currentUser?.businessType || 'Not specified'}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                    <span className="text-gray-600">Plan</span>
                                    <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                                        Free Trial
                                    </span>
                                </div>
                                <div className="flex justify-between items-center py-2">
                                    <span className="text-gray-600">Trial Expires</span>
                                    <span className="font-medium">{trialEndDate.toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            </main>
        </div>
    );
};

export default Dashboard;
