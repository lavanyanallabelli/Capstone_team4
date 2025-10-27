import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, User, Calendar, CreditCard, BarChart3, Package, DollarSign, ShoppingCart, Users, Settings, TrendingUp, ChefHat } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/api';

const Dashboard = () => {
    const { currentUser, logout, userRole } = useAuth();
    const navigate = useNavigate();
    const [dashboardData, setDashboardData] = useState({
        menuItemsCount: 0,
        employeesCount: 0,
        totalSales: 0,
        ordersToday: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const isOwner = userRole === 'owner';

    useEffect(() => {
        if (currentUser) {
            fetchDashboardData();
        }
    }, [currentUser, isOwner]);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            
            if (isOwner) {
                const [menuResponse, employeesResponse, analyticsResponse] = await Promise.all([
                    apiService.getMenuItems(),
                    apiService.getEmployees(),
                    apiService.getAnalyticsOverview('7d')
                ]);

                const newData = {
                    menuItemsCount: menuResponse.success ? menuResponse.data.length : 0,
                    employeesCount: employeesResponse.success ? employeesResponse.data.length : 0,
                    totalSales: analyticsResponse.success ? (analyticsResponse.data.data?.sales?.totalRevenue || analyticsResponse.data.sales?.totalRevenue || 0) : 0,
                    ordersToday: analyticsResponse.success ? (analyticsResponse.data.data?.sales?.totalOrders || analyticsResponse.data.sales?.totalOrders || 0) : 0
                };
                
                setDashboardData(newData);
            } else {
                const menuResponse = await apiService.getMenuItems();
                setDashboardData({
                    menuItemsCount: menuResponse.success ? menuResponse.data.length : 0,
                    employeesCount: 0,
                    totalSales: 0,
                    ordersToday: 0
                });
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            setError('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const stats = [
        { label: 'Total Sales', value: `$${dashboardData.totalSales.toFixed(2)}`, icon: DollarSign, color: 'from-green-500 to-green-600' },
        { label: 'Orders Today', value: dashboardData.ordersToday.toString(), icon: ShoppingCart, color: 'from-blue-500 to-blue-600' },
        { label: 'Menu Items', value: dashboardData.menuItemsCount.toString(), icon: Package, color: 'from-purple-500 to-purple-600' },
        { label: 'Employees', value: dashboardData.employeesCount.toString(), icon: Users, color: 'from-orange-500 to-orange-600' },
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

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-600 mb-4">{error}</p>
                    <button
                        onClick={fetchDashboardData}
                        className="bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    if (!currentUser) {
        navigate('/login');
        return null;
    }

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

                    {/* Main Features Section */}
                    <motion.div
                        variants={itemVariants}
                        className="grid lg:grid-cols-2 gap-8"
                    >
                        {/* Main Features */}
                        <div className="card p-8">
                            <h3 className="text-xl font-bold text-gray-900 mb-6">Main Features</h3>
                            <div className="space-y-4">
                                {isOwner && (
                                    <>
                                        <button 
                                            onClick={() => navigate('/employees')}
                                            className="w-full text-left p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                        >
                                            <div className="flex items-center space-x-3">
                                                <Users className="w-6 h-6 text-primary-600" />
                                                <div>
                                                    <h4 className="font-semibold text-gray-900">Manage Employees</h4>
                                                    <p className="text-sm text-gray-600">Add, edit, and manage your team members</p>
                                                </div>
                                            </div>
                                        </button>
                                        <button 
                                            onClick={() => navigate('/menu/manage')}
                                            className="w-full text-left p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                        >
                                            <div className="flex items-center space-x-3">
                                                <ChefHat className="w-6 h-6 text-primary-600" />
                                                <div>
                                                    <h4 className="font-semibold text-gray-900">Menu Management</h4>
                                                    <p className="text-sm text-gray-600">Create and manage your restaurant menu</p>
                                                </div>
                                            </div>
                                        </button>
                                        <button 
                                            onClick={() => navigate('/analytics')}
                                            className="w-full text-left p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                        >
                                            <div className="flex items-center space-x-3">
                                                <TrendingUp className="w-6 h-6 text-primary-600" />
                                                <div>
                                                    <h4 className="font-semibold text-gray-900">View Analytics</h4>
                                                    <p className="text-sm text-gray-600">Track sales, performance, and insights</p>
                                                </div>
                                            </div>
                                        </button>
                                        <button 
                                            onClick={() => navigate('/settings')}
                                            className="w-full text-left p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                        >
                                            <div className="flex items-center space-x-3">
                                                <Settings className="w-6 h-6 text-primary-600" />
                                                <div>
                                                    <h4 className="font-semibold text-gray-900">Restaurant Settings</h4>
                                                    <p className="text-sm text-gray-600">Configure your restaurant preferences</p>
                                                </div>
                                            </div>
                                        </button>
                                    </>
                                )}
                                <button 
                                    onClick={() => navigate('/menu')}
                                    className="w-full text-left p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                    <div className="flex items-center space-x-3">
                                        <Package className="w-6 h-6 text-primary-600" />
                                        <div>
                                            <h4 className="font-semibold text-gray-900">View Menu</h4>
                                            <p className="text-sm text-gray-600">Browse available menu items</p>
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
