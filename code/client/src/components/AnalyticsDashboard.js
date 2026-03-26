import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { USER_ROLES } from '../aws/userRoles';
import apiService from '../services/api';
import {
    BarChart3,
    TrendingUp,
    DollarSign,
    ShoppingCart,
    Users,
    Download,
    Heart
} from 'lucide-react';

const AnalyticsDashboard = () => {
    const { currentUser } = useAuth();
    const [selectedPeriod, setSelectedPeriod] = useState('7d');
    // const [selectedView, setSelectedView] = useState('overview'); // Commented out for future use
    const [analyticsData, setAnalyticsData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [customDateRange, setCustomDateRange] = useState({
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });
    const [showCustomPicker, setShowCustomPicker] = useState(false);

    const userRole = currentUser?.userRole || USER_ROLES.EMPLOYEE;
    // const canViewAnalytics = hasPermission(userRole, PERMISSIONS.CAN_VIEW_SALES_ANALYTICS); // Commented out for future use
    // const canViewEmployeePerformance = hasPermission(userRole, PERMISSIONS.CAN_VIEW_EMPLOYEE_PERFORMANCE); // Commented out for future use
    // const canViewRevenueBreakdown = hasPermission(userRole, PERMISSIONS.CAN_VIEW_REVENUE_BREAKDOWN); // Commented out for future use

    const loadAnalyticsData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            // Prepare params based on selected period
            let params = {};
            if (selectedPeriod === 'custom') {
                params = {
                    period: 'custom',
                    startDate: customDateRange.startDate,
                    endDate: customDateRange.endDate
                };
            } else {
                params = { period: selectedPeriod };
            }

            const response = await apiService.getAnalyticsOverview(params);
            console.log('Analytics response:', response);
            console.log('Response type:', typeof response);
            console.log('Response keys:', response ? Object.keys(response) : 'null');

            if (response && response.success) {
                // Backend returns: { success: true, data: { sales: {...}, customers: {...}, ... } }
                // API service returns the full response object
                const analytics = response.data;
                console.log('Analytics data:', analytics);
                console.log('Sales data:', analytics?.sales);

                if (analytics) {
                    setAnalyticsData(analytics);
                } else {
                    console.error('No analytics data in response');
                    setError('No data received from server');
                }
            } else {
                console.error('Response not successful:', response);
                setError('Failed to load analytics data');
            }
        } catch (error) {
            console.error('Error loading analytics:', error);
            setError('Failed to load analytics data: ' + (error.message || 'Unknown error'));
        } finally {
            setLoading(false);
        }
    }, [selectedPeriod, customDateRange]);

    // Load analytics data on component mount and when period changes
    useEffect(() => {
        if (selectedPeriod !== 'custom') {
            loadAnalyticsData();
        }
    }, [selectedPeriod, loadAnalyticsData]);

    // Listen for order updates to refresh analytics
    useEffect(() => {
        const handleOrderUpdate = () => {
            loadAnalyticsData();
        };

        window.addEventListener('orderUpdated', handleOrderUpdate);
        return () => {
            window.removeEventListener('orderUpdated', handleOrderUpdate);
        };
    }, [loadAnalyticsData]);


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
                            <div className="relative">
                                <select
                                    value={selectedPeriod}
                                    onChange={(e) => {
                                        setSelectedPeriod(e.target.value);
                                        setShowCustomPicker(e.target.value === 'custom');
                                    }}
                                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="today">Today</option>
                                    <option value="7d">Last 7 days</option>
                                    <option value="30d">Last 30 days</option>
                                    <option value="90d">Last 90 days</option>
                                    <option value="1y">Last year</option>
                                    <option value="custom">Custom Range</option>
                                </select>

                                {/* Custom Date Range Picker */}
                                {showCustomPicker && (
                                    <div className="absolute top-full left-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg p-4 z-50 min-w-[300px]">
                                        <div className="mb-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                From Date
                                            </label>
                                            <input
                                                type="date"
                                                value={customDateRange.startDate}
                                                onChange={(e) => setCustomDateRange({
                                                    ...customDateRange,
                                                    startDate: e.target.value
                                                })}
                                                max={customDateRange.endDate}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div className="mb-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                To Date
                                            </label>
                                            <input
                                                type="date"
                                                value={customDateRange.endDate}
                                                onChange={(e) => setCustomDateRange({
                                                    ...customDateRange,
                                                    endDate: e.target.value
                                                })}
                                                min={customDateRange.startDate}
                                                max={new Date().toISOString().split('T')[0]}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div className="flex justify-end space-x-2">
                                            <button
                                                onClick={() => {
                                                    setShowCustomPicker(false);
                                                    setSelectedPeriod('7d');
                                                }}
                                                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setShowCustomPicker(false);
                                                    loadAnalyticsData();
                                                }}
                                                className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                                            >
                                                Apply
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
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
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8"
                >
                    <motion.div variants={itemVariants} className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    ${(analyticsData?.sales?.totalRevenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </p>
                                <div className="flex items-center mt-1">
                                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                                    <span className={`text-sm ${(analyticsData?.sales?.revenueGrowth || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {(analyticsData?.sales?.revenueGrowth || 0) >= 0 ? '+' : ''}{(analyticsData?.sales?.revenueGrowth || 0).toFixed(1)}%
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
                                    {analyticsData?.sales?.totalOrders || 0}
                                </p>
                                <div className="flex items-center mt-1">
                                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                                    <span className={`text-sm ${(analyticsData?.sales?.orderGrowth || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {(analyticsData?.sales?.orderGrowth || 0) >= 0 ? '+' : ''}{(analyticsData?.sales?.orderGrowth || 0).toFixed(1)}%
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
                                    ${(analyticsData?.sales?.averageOrderValue || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </p>
                                <div className="flex items-center mt-1">
                                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                                    <span className="text-sm text-gray-600">Average</span>
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
                                    {analyticsData?.customers?.totalCustomers || 0}
                                </p>
                                <div className="flex items-center mt-1">
                                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                                    <span className={`text-sm ${(analyticsData?.customers?.customerGrowth || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {(analyticsData?.customers?.customerGrowth || 0) >= 0 ? '+' : ''}{(analyticsData?.customers?.customerGrowth || 0).toFixed(1)}%
                                    </span>
                                </div>
                            </div>
                            <div className="p-3 bg-orange-100 rounded-lg">
                                <Users className="w-6 h-6 text-orange-600" />
                            </div>
                        </div>
                    </motion.div>

                    <motion.div variants={itemVariants} className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Tips</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    ${(analyticsData?.sales?.totalTips || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </p>
                                <div className="flex items-center mt-1">
                                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                                    <span className={`text-sm ${(analyticsData?.sales?.tipGrowth || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {(analyticsData?.sales?.tipGrowth || 0) >= 0 ? '+' : ''}{(analyticsData?.sales?.tipGrowth || 0).toFixed(1)}%
                                    </span>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    Avg: ${(analyticsData?.sales?.averageTip || 0).toFixed(2)} • {(analyticsData?.sales?.tipPercentage || 0).toFixed(1)}% of revenue
                                </p>
                            </div>
                            <div className="p-3 bg-pink-100 rounded-lg">
                                <Heart className="w-6 h-6 text-pink-600" />
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
                            {analyticsData.salesData && analyticsData.salesData.length > 0 ? (() => {
                                // Calculate max revenue once outside the map
                                const revenues = analyticsData.salesData.map(d => parseFloat(d.revenue || 0));
                                const maxRevenue = Math.max(...revenues, 1);

                                // Sort by date to ensure correct order
                                const sortedSalesData = [...analyticsData.salesData].sort((a, b) => {
                                    return new Date(a.date) - new Date(b.date);
                                });

                                // Remove duplicates by date
                                const uniqueSalesData = [];
                                const seenDates = new Set();
                                sortedSalesData.forEach(day => {
                                    if (!seenDates.has(day.date)) {
                                        seenDates.add(day.date);
                                        uniqueSalesData.push(day);
                                    }
                                });

                                return uniqueSalesData.map((day, index) => {
                                    const revenue = parseFloat(day.revenue || 0);
                                    const percentage = maxRevenue > 0 ? (revenue / maxRevenue) * 100 : 0;

                                    return (
                                        <div key={`${day.date}-${index}`} className="flex items-center">
                                            <div className="w-12 text-sm text-gray-600">
                                                {day.day || new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                                            </div>
                                            <div className="flex-1 mx-4">
                                                <div className="bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                                        style={{ width: `${Math.min(percentage, 100)}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                            <div className="w-20 text-sm text-gray-900 text-right">
                                                ${revenue.toFixed(2)}
                                            </div>
                                        </div>
                                    );
                                });
                            })() : (
                                <p className="text-gray-500 text-center py-4">No sales data available</p>
                            )}
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
                            {analyticsData?.topItems && analyticsData.topItems.length > 0 ? (
                                analyticsData.topItems.map((item, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div className="flex items-center">
                                            <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold mr-3">
                                                {index + 1}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">{item.name || 'Unknown Item'}</p>
                                                <p className="text-sm text-gray-600">{item.sales || 0} sales</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold text-gray-900">${(item.revenue || 0).toFixed(2)}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-500 text-center py-4">No top items data available</p>
                            )}
                        </div>
                    </motion.div>

                    {/* Employee Performance */}
                    <motion.div variants={itemVariants} className="bg-white rounded-lg shadow-md p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-6">Employee Performance</h3>
                        <div className="space-y-4">
                            {analyticsData?.employeePerformance && analyticsData.employeePerformance.length > 0 ? (
                                analyticsData.employeePerformance.map((employee, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div className="flex items-center">
                                            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold mr-3">
                                                {employee.name ? employee.name.split(' ').map(n => n[0]).join('').toUpperCase() : '??'}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">{employee.name || 'Unknown Employee'}</p>
                                                <p className="text-sm text-gray-600">{employee.orders || 0} orders</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold text-gray-900">${(employee.revenue || 0).toFixed(2)}</p>
                                            <div className="flex items-center">
                                                <span className="text-sm text-yellow-600">★</span>
                                                <span className="text-sm text-gray-600 ml-1">{employee.rating || 'N/A'}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-500 text-center py-4">No employee performance data available</p>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
};

export default AnalyticsDashboard;
