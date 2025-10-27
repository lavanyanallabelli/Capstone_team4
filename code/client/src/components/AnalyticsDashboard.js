import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { USER_ROLES, PERMISSIONS, hasPermission } from '../aws/userRoles';
import apiService from '../services/api';
import {
    BarChart3,
    TrendingUp,
    TrendingDown,
    DollarSign,
    ShoppingCart,
    Users,
    Clock,
    Calendar,
    Download,
    Filter,
    Eye,
    PieChart
} from 'lucide-react';

const AnalyticsDashboard = () => {
    const { currentUser } = useAuth();
    const [selectedPeriod, setSelectedPeriod] = useState('7d');
    const [selectedView, setSelectedView] = useState('overview');
    const [analyticsData, setAnalyticsData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const userRole = currentUser?.userRole || USER_ROLES.EMPLOYEE;
    const canViewAnalytics = hasPermission(userRole, PERMISSIONS.CAN_VIEW_SALES_ANALYTICS);
    const canViewEmployeePerformance = hasPermission(userRole, PERMISSIONS.CAN_VIEW_EMPLOYEE_PERFORMANCE);
    const canViewRevenueBreakdown = hasPermission(userRole, PERMISSIONS.CAN_VIEW_REVENUE_BREAKDOWN);

    // Load analytics data on component mount
    useEffect(() => {
        loadAnalyticsData();
    }, [selectedPeriod]);

    const loadAnalyticsData = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await apiService.getAnalyticsOverview({ period: selectedPeriod });
            if (response.success) {
                setAnalyticsData(response.data);
            }
        } catch (error) {
            console.error('Error loading analytics:', error);
            setError('Failed to load analytics data');
        } finally {
            setLoading(false);
        }
    };

    // Only show this component to owners
    if (userRole !== USER_ROLES.OWNER) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
                    <p className="text-gray-600">Only restaurant owners can view analytics.</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <BarChart3 className="w-16 h-16 text-red-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Analytics</h2>
                    <p className="text-gray-600">{error}</p>
                </div>
            </div>
        );
    }

    if (!analyticsData) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">No Data Available</h2>
                    <p className="text-gray-600">No analytics data found for the selected period.</p>
                </div>
            </div>
        );
    }

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

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                Analytics Dashboard
                            </h1>
                            <p className="text-gray-600">
                                Track your restaurant's performance and insights
                            </p>
                        </div>
                        <div className="flex items-center space-x-4">
                            <select
                                value={selectedPeriod}
                                onChange={(e) => setSelectedPeriod(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="7d">Last 7 days</option>
                                <option value="30d">Last 30 days</option>
                                <option value="90d">Last 90 days</option>
                                <option value="1y">Last year</option>
                            </select>
                            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center transition-colors">
                                <Download className="w-4 h-4 mr-2" />
                                Export Report
                            </button>
                        </div>
                    </div>
                </motion.div>

                {/* Overview Stats */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
                >
                    <motion.div variants={itemVariants} className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    ${analyticsData.sales.totalRevenue.toLocaleString()}
                                </p>
                                <div className="flex items-center mt-1">
                                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                                    <span className="text-sm text-green-600">
                                        +{analyticsData.sales.revenueGrowth}%
                                    </span>
                                </div>
                            </div>
                            <div className="p-3 bg-green-100 rounded-lg">
                                <DollarSign className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                    </motion.div>

                    <motion.div variants={itemVariants} className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {analyticsData.sales.totalOrders}
                                </p>
                                <div className="flex items-center mt-1">
                                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                                    <span className="text-sm text-green-600">
                                        +{analyticsData.sales.orderGrowth}%
                                    </span>
                                </div>
                            </div>
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <ShoppingCart className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </motion.div>

                    <motion.div variants={itemVariants} className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Avg Order Value</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    ${analyticsData.sales.averageOrderValue}
                                </p>
                                <div className="flex items-center mt-1">
                                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                                    <span className="text-sm text-green-600">+5.2%</span>
                                </div>
                            </div>
                            <div className="p-3 bg-purple-100 rounded-lg">
                                <BarChart3 className="w-6 h-6 text-purple-600" />
                            </div>
                        </div>
                    </motion.div>

                    <motion.div variants={itemVariants} className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Customers</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {analyticsData.customers.totalCustomers}
                                </p>
                                <div className="flex items-center mt-1">
                                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                                    <span className="text-sm text-green-600">
                                        +{analyticsData.customers.customerGrowth}%
                                    </span>
                                </div>
                            </div>
                            <div className="p-3 bg-orange-100 rounded-lg">
                                <Users className="w-6 h-6 text-orange-600" />
                            </div>
                        </div>
                    </motion.div>
                </motion.div>

                {/* Charts Section */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid lg:grid-cols-2 gap-8 mb-8"
                >
                    {/* Sales Chart */}
                    <motion.div variants={itemVariants} className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold text-gray-900">Daily Sales</h3>
                            <div className="flex items-center space-x-2">
                                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                <span className="text-sm text-gray-600">Revenue</span>
                            </div>
                        </div>
                        <div className="space-y-4">
                            {analyticsData.salesData.map((day, index) => (
                                <div key={day.day} className="flex items-center">
                                    <div className="w-12 text-sm text-gray-600">{day.day}</div>
                                    <div className="flex-1 mx-4">
                                        <div className="bg-gray-200 rounded-full h-2">
                                            <div
                                                className="bg-blue-500 h-2 rounded-full"
                                                style={{ width: `${(day.revenue / 2500) * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                    <div className="w-20 text-sm text-gray-900 text-right">
                                        ${day.revenue}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Revenue Breakdown */}
                    <motion.div variants={itemVariants} className="bg-white rounded-lg shadow-md p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-6">Revenue Breakdown</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <div className="w-4 h-4 bg-green-500 rounded-full mr-3"></div>
                                    <span className="text-gray-700">Dine-in</span>
                                </div>
                                <span className="font-semibold">{analyticsData.revenueBreakdown?.dineIn?.percentage || 0}%</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <div className="w-4 h-4 bg-blue-500 rounded-full mr-3"></div>
                                    <span className="text-gray-700">Online Orders</span>
                                </div>
                                <span className="font-semibold">{analyticsData.revenueBreakdown?.online?.percentage || 0}%</span>
                            </div>
                        </div>
                        <div className="mt-6">
                            <div className="bg-gray-200 rounded-full h-4">
                                <div className="flex h-4 rounded-full overflow-hidden">
                                    <div
                                        className="bg-green-500"
                                        style={{ width: `${analyticsData.revenueBreakdown?.dineIn?.percentage || 0}%` }}
                                    ></div>
                                    <div
                                        className="bg-blue-500"
                                        style={{ width: `${analyticsData.revenueBreakdown?.online?.percentage || 0}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>

                {/* Top Items and Employee Performance */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid lg:grid-cols-2 gap-8"
                >
                    {/* Top Selling Items */}
                    <motion.div variants={itemVariants} className="bg-white rounded-lg shadow-md p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-6">Top Selling Items</h3>
                        <div className="space-y-4">
                            {analyticsData.topItems.map((item, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center">
                                        <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold mr-3">
                                            {index + 1}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">{item.name}</p>
                                            <p className="text-sm text-gray-600">{item.sales} sales</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold text-gray-900">${item.revenue}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Employee Performance */}
                    <motion.div variants={itemVariants} className="bg-white rounded-lg shadow-md p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-6">Employee Performance</h3>
                        <div className="space-y-4">
                            {analyticsData.employeePerformance.map((employee, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center">
                                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold mr-3">
                                            {employee.name.split(' ').map(n => n[0]).join('')}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">{employee.name}</p>
                                            <p className="text-sm text-gray-600">{employee.orders} orders</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold text-gray-900">${employee.revenue}</p>
                                        <div className="flex items-center">
                                            <span className="text-sm text-yellow-600">★</span>
                                            <span className="text-sm text-gray-600 ml-1">{employee.rating}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
};

export default AnalyticsDashboard;
