import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users, BarChart3, PieChart, Calendar } from 'lucide-react';
import apiService from '../services/api';

const AnalyticsDashboard = () => {
    const [analyticsData, setAnalyticsData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedPeriod, setSelectedPeriod] = useState('7d');

    useEffect(() => {
        loadAnalyticsData();
    }, [selectedPeriod]);

    const loadAnalyticsData = async () => {
        try {
            setLoading(true);
            const response = await apiService.getAnalyticsOverview(selectedPeriod);
            if (response.success) {
                setAnalyticsData(response.data);
            } else {
                setError('Failed to load analytics data');
            }
        } catch (error) {
            console.error('Error loading analytics data:', error);
            setError('Failed to load analytics data');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    const formatPercentage = (value) => {
        return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <p className="text-red-600 mb-4">{error}</p>
                    <button
                        onClick={loadAnalyticsData}
                        className="bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    if (!analyticsData) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-gray-500">No analytics data available</p>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
                        <p className="text-gray-600">Track your business performance and insights</p>
                    </div>
                    <div className="mt-4 sm:mt-0">
                        <select
                            value={selectedPeriod}
                            onChange={(e) => setSelectedPeriod(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                            <option value="7d">Last 7 Days</option>
                            <option value="30d">Last 30 Days</option>
                            <option value="90d">Last 90 Days</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-green-100 text-green-600">
                            <DollarSign className="h-6 w-6" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                            <p className="text-2xl font-semibold text-gray-900">
                                {formatCurrency(analyticsData.sales?.totalRevenue || 0)}
                            </p>
                            <div className="flex items-center mt-1">
                                {analyticsData.sales?.revenueGrowth >= 0 ? (
                                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                                ) : (
                                    <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                                )}
                                <span className={`text-sm ${
                                    analyticsData.sales?.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                    {formatPercentage(analyticsData.sales?.revenueGrowth || 0)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                            <ShoppingCart className="h-6 w-6" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Total Orders</p>
                            <p className="text-2xl font-semibold text-gray-900">
                                {analyticsData.sales?.totalOrders || 0}
                            </p>
                            <div className="flex items-center mt-1">
                                {analyticsData.sales?.orderGrowth >= 0 ? (
                                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                                ) : (
                                    <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                                )}
                                <span className={`text-sm ${
                                    analyticsData.sales?.orderGrowth >= 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                    {formatPercentage(analyticsData.sales?.orderGrowth || 0)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                            <BarChart3 className="h-6 w-6" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Avg Order Value</p>
                            <p className="text-2xl font-semibold text-gray-900">
                                {formatCurrency(analyticsData.sales?.averageOrderValue || 0)}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-orange-100 text-orange-600">
                            <Users className="h-6 w-6" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Total Customers</p>
                            <p className="text-2xl font-semibold text-gray-900">
                                {analyticsData.customers?.totalCustomers || 0}
                            </p>
                            <div className="flex items-center mt-1">
                                {analyticsData.customers?.customerGrowth >= 0 ? (
                                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                                ) : (
                                    <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                                )}
                                <span className={`text-sm ${
                                    analyticsData.customers?.customerGrowth >= 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                    {formatPercentage(analyticsData.customers?.customerGrowth || 0)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Sales Chart */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales Trend</h3>
                    <div className="h-64 flex items-center justify-center">
                        {analyticsData.salesData && analyticsData.salesData.length > 0 ? (
                            <div className="w-full">
                                <div className="space-y-2">
                                    {analyticsData.salesData.slice(-7).map((data, index) => (
                                        <div key={index} className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600">{data.date}</span>
                                            <div className="flex items-center space-x-4">
                                                <span className="text-sm font-medium">
                                                    {formatCurrency(data.revenue)}
                                                </span>
                                                <span className="text-sm text-gray-500">
                                                    {data.orders} orders
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <p className="text-gray-500">No sales data available</p>
                        )}
                    </div>
                </div>

                {/* Revenue Breakdown */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Breakdown</h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <div className="w-4 h-4 bg-blue-500 rounded mr-3"></div>
                                <span className="text-sm font-medium">Dine-in</span>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-semibold">
                                    {formatCurrency(analyticsData.revenueBreakdown?.dineIn?.revenue || 0)}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {analyticsData.revenueBreakdown?.dineIn?.percentage || 0}%
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <div className="w-4 h-4 bg-green-500 rounded mr-3"></div>
                                <span className="text-sm font-medium">Online</span>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-semibold">
                                    {formatCurrency(analyticsData.revenueBreakdown?.online?.revenue || 0)}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {analyticsData.revenueBreakdown?.online?.percentage || 0}%
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Items */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Selling Items</h3>
                    <div className="space-y-3">
                        {analyticsData.topItems && analyticsData.topItems.length > 0 ? (
                            analyticsData.topItems.map((item, index) => (
                                <div key={index} className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <span className="w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-sm font-medium mr-3">
                                            {index + 1}
                                        </span>
                                        <span className="text-sm font-medium">{item.name}</span>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-semibold">{item.quantity} sold</p>
                                        <p className="text-xs text-gray-500">
                                            {formatCurrency(item.revenue)}
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500">No top items data available</p>
                        )}
                    </div>
                </div>

                {/* Employee Performance */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Employee Performance</h3>
                    <div className="space-y-3">
                        {analyticsData.employeePerformance && analyticsData.employeePerformance.length > 0 ? (
                            analyticsData.employeePerformance.map((employee, index) => (
                                <div key={index} className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                                            <span className="text-sm font-medium text-gray-600">
                                                {employee.name?.charAt(0)}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">{employee.name}</p>
                                            <p className="text-xs text-gray-500">{employee.orders} orders</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-semibold">
                                            {formatCurrency(employee.revenue)}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {employee.rating}/5 ⭐
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500">No employee performance data available</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsDashboard;
