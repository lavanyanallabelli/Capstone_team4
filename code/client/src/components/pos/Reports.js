import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, DollarSign, TrendingUp, Calendar, Download, Filter } from 'lucide-react';
import apiService from '../../services/api';

const Reports = ({ onClose }) => {
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState('today'); // today, week, month, custom
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [reportData, setReportData] = useState({
        totalRevenue: 0,
        totalOrders: 0,
        completedOrders: 0,
        averageOrderValue: 0,
        ordersByType: {},
        ordersByStatus: {},
        dailyRevenue: []
    });

    const filterOrdersByDateRange = useCallback((orders) => {
        const now = new Date();
        let start, end = new Date(now);

        switch (dateRange) {
            case 'today':
                start = new Date(now);
                start.setHours(0, 0, 0, 0);
                break;
            case 'week':
                start = new Date(now);
                start.setDate(start.getDate() - 7);
                break;
            case 'month':
                start = new Date(now);
                start.setMonth(start.getMonth() - 1);
                break;
            case 'custom':
                start = new Date(startDate);
                end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                break;
            default:
                start = new Date(now);
                start.setHours(0, 0, 0, 0);
        }

        return orders.filter(order => {
            const orderDate = new Date(order.orderDate || order.createdAt);
            return orderDate >= start && orderDate <= end;
        });
    }, [dateRange, startDate, endDate]);

    const calculateReportData = (orders) => {
        const totalRevenue = orders.reduce((sum, order) =>
            sum + parseFloat(order.finalTotal || order.totalAmount || 0), 0
        );

        const completedOrders = orders.filter(order =>
            order.status?.toLowerCase() === 'completed'
        );

        const completedRevenue = completedOrders.reduce((sum, order) =>
            sum + parseFloat(order.finalTotal || order.totalAmount || 0), 0
        );

        const ordersByType = {};
        const ordersByStatus = {};
        const dailyRevenue = {};

        orders.forEach(order => {
            // Count by type
            const type = order.orderType || 'unknown';
            ordersByType[type] = (ordersByType[type] || 0) + 1;

            // Count by status
            const status = order.status || 'unknown';
            ordersByStatus[status] = (ordersByStatus[status] || 0) + 1;

            // Daily revenue
            const date = new Date(order.orderDate || order.createdAt).toISOString().split('T')[0];
            if (!dailyRevenue[date]) {
                dailyRevenue[date] = 0;
            }
            dailyRevenue[date] += parseFloat(order.finalTotal || order.totalAmount || 0);
        });

        const dailyRevenueArray = Object.entries(dailyRevenue)
            .map(([date, revenue]) => ({ date, revenue }))
            .sort((a, b) => new Date(a.date) - new Date(b.date));

        setReportData({
            totalRevenue,
            totalOrders: orders.length,
            completedOrders: completedOrders.length,
            completedRevenue,
            averageOrderValue: orders.length > 0 ? totalRevenue / orders.length : 0,
            ordersByType,
            ordersByStatus,
            dailyRevenue: dailyRevenueArray
        });
    };

    const loadReportData = useCallback(async () => {
        try {
            setLoading(true);
            const response = await apiService.getOrders({ limit: 1000 });
            if (response.success) {
                const orders = response.data || [];
                const filteredOrders = filterOrdersByDateRange(orders);
                calculateReportData(filteredOrders);
            }
        } catch (error) {
            console.error('Error loading report data:', error);
        } finally {
            setLoading(false);
        }
    }, [filterOrdersByDateRange]);

    useEffect(() => {
        loadReportData();
    }, [loadReportData]);

    const handleExport = () => {
        const csv = [
            ['Report Period', dateRange === 'custom' ? `${startDate} to ${endDate}` : dateRange],
            ['Total Revenue', `$${reportData.totalRevenue.toFixed(2)}`],
            ['Total Orders', reportData.totalOrders],
            ['Completed Orders', reportData.completedOrders],
            ['Average Order Value', `$${reportData.averageOrderValue.toFixed(2)}`],
            [],
            ['Orders by Type'],
            ...Object.entries(reportData.ordersByType).map(([type, count]) => [type, count]),
            [],
            ['Orders by Status'],
            ...Object.entries(reportData.ordersByStatus).map(([status, count]) => [status, count])
        ].map(row => row.join(',')).join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sales-report-${dateRange}-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Sales Reports</h1>
                    <p className="text-gray-600">View detailed sales analytics and insights</p>
                </div>
                <div className="flex items-center space-x-3">
                    <button
                        onClick={handleExport}
                        className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                    >
                        <Download className="w-4 h-4" />
                        <span>Export CSV</span>
                    </button>
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                        >
                            Close
                        </button>
                    )}
                </div>
            </div>

            {/* Date Range Filter */}
            <div className="bg-white rounded-lg shadow p-4 mb-6">
                <div className="flex items-center space-x-4">
                    <Filter className="w-5 h-5 text-gray-600" />
                    <span className="font-medium text-gray-700">Date Range:</span>
                    <div className="flex items-center space-x-2">
                        {['today', 'week', 'month', 'custom'].map(range => (
                            <button
                                key={range}
                                onClick={() => setDateRange(range)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${dateRange === range
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                {range.charAt(0).toUpperCase() + range.slice(1)}
                            </button>
                        ))}
                    </div>
                    {dateRange === 'custom' && (
                        <div className="flex items-center space-x-2">
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-lg"
                            />
                            <span>to</span>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-lg"
                            />
                        </div>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                        <p className="mt-2 text-gray-600">Loading report data...</p>
                    </div>
                </div>
            ) : (
                <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        ${reportData.totalRevenue.toFixed(2)}
                                    </p>
                                </div>
                                <DollarSign className="w-8 h-8 text-blue-500" />
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Total Orders</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {reportData.totalOrders}
                                    </p>
                                </div>
                                <BarChart3 className="w-8 h-8 text-green-500" />
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Completed Orders</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {reportData.completedOrders}
                                    </p>
                                </div>
                                <TrendingUp className="w-8 h-8 text-purple-500" />
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Avg Order Value</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        ${reportData.averageOrderValue.toFixed(2)}
                                    </p>
                                </div>
                                <Calendar className="w-8 h-8 text-orange-500" />
                            </div>
                        </motion.div>
                    </div>

                    {/* Charts Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Orders by Type */}
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Orders by Type</h3>
                            <div className="space-y-3">
                                {Object.entries(reportData.ordersByType).map(([type, count]) => {
                                    const percentage = reportData.totalOrders > 0
                                        ? (count / reportData.totalOrders) * 100
                                        : 0;
                                    return (
                                        <div key={type}>
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-sm font-medium text-gray-700 capitalize">
                                                    {type.replace('-', ' ')}
                                                </span>
                                                <span className="text-sm text-gray-600">
                                                    {count} ({percentage.toFixed(1)}%)
                                                </span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div
                                                    className="bg-blue-500 h-2 rounded-full"
                                                    style={{ width: `${percentage}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Orders by Status */}
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Orders by Status</h3>
                            <div className="space-y-3">
                                {Object.entries(reportData.ordersByStatus).map(([status, count]) => {
                                    const percentage = reportData.totalOrders > 0
                                        ? (count / reportData.totalOrders) * 100
                                        : 0;
                                    const statusColors = {
                                        completed: 'bg-green-500',
                                        pending: 'bg-yellow-500',
                                        preparing: 'bg-blue-500',
                                        ready: 'bg-purple-500',
                                        cancelled: 'bg-red-500'
                                    };
                                    return (
                                        <div key={status}>
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-sm font-medium text-gray-700 capitalize">
                                                    {status}
                                                </span>
                                                <span className="text-sm text-gray-600">
                                                    {count} ({percentage.toFixed(1)}%)
                                                </span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div
                                                    className={`${statusColors[status] || 'bg-gray-500'} h-2 rounded-full`}
                                                    style={{ width: `${percentage}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default Reports;

