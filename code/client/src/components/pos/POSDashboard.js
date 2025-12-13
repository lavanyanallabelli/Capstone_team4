import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, ShoppingCart, Clock, TrendingUp, BarChart3, RefreshCw } from 'lucide-react';
import apiService from '../../services/api';

const POSDashboard = ({ onNewOrder, onViewReports, onViewOrders, onRefund }) => {
    const [salesOverview, setSalesOverview] = useState({
        today: { revenue: 0, orders: 0, completed: 0, averageOrder: 0 },
        week: { revenue: 0, orders: 0, completed: 0, averageOrder: 0 }
    });
    const [openOrders, setOpenOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadDashboardData();
        // Refresh every 10 seconds for real-time updates
        const interval = setInterval(loadDashboardData, 10000);
        return () => clearInterval(interval);
    }, []);

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            // Fetch today's orders
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // Fetch all orders (increase limit to get more data)
            console.log('📊 Loading POS Dashboard data...');
            const ordersResponse = await apiService.getOrders({ limit: 1000 });
            console.log('📊 Orders API Response:', {
                success: ordersResponse.success,
                dataLength: ordersResponse.data?.length || 0,
                error: ordersResponse.error,
                message: ordersResponse.message
            });

            if (ordersResponse.success) {
                const orders = ordersResponse.data || [];

                // Calculate today's sales
                const todayOrders = orders.filter(order => {
                    const orderDate = new Date(order.orderDate || order.createdAt);
                    const orderDateOnly = new Date(orderDate.getFullYear(), orderDate.getMonth(), orderDate.getDate());
                    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                    return orderDateOnly.getTime() === todayOnly.getTime();
                });

                const todayCompleted = todayOrders.filter(order =>
                    order.status?.toLowerCase() === 'completed'
                ).length;

                const todayRevenue = todayOrders.reduce((sum, order) =>
                    sum + parseFloat(order.finalTotal || order.totalAmount || 0), 0
                );

                const todayAverageOrder = todayOrders.length > 0
                    ? todayRevenue / todayOrders.length
                    : 0;

                // Calculate week's sales (last 7 days)
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                const weekOrders = orders.filter(order => {
                    const orderDate = new Date(order.orderDate || order.createdAt);
                    return orderDate >= weekAgo;
                });

                const weekCompleted = weekOrders.filter(order =>
                    order.status?.toLowerCase() === 'completed'
                ).length;

                const weekRevenue = weekOrders.reduce((sum, order) =>
                    sum + parseFloat(order.finalTotal || order.totalAmount || 0), 0
                );

                const weekAverageOrder = weekOrders.length > 0
                    ? weekRevenue / weekOrders.length
                    : 0;

                setSalesOverview({
                    today: {
                        revenue: todayRevenue,
                        orders: todayOrders.length,
                        completed: todayCompleted,
                        averageOrder: todayAverageOrder
                    },
                    week: {
                        revenue: weekRevenue,
                        orders: weekOrders.length,
                        completed: weekCompleted,
                        averageOrder: weekAverageOrder
                    }
                });

                // Get open orders (pending, preparing, ready) - exclude online orders
                const open = orders.filter(order =>
                    ['pending', 'preparing', 'ready'].includes(order.status?.toLowerCase()) &&
                    order.orderType !== 'online-order'
                );
                // Sort by date (newest first) and show latest 5
                open.sort((a, b) =>
                    new Date(b.orderDate || b.createdAt) - new Date(a.orderDate || a.createdAt)
                );
                setOpenOrders(open.slice(0, 5));

                console.log('📊 Dashboard data loaded:', {
                    todayOrders: todayOrders.length,
                    todayRevenue: todayRevenue,
                    weekOrders: weekOrders.length,
                    weekRevenue: weekRevenue,
                    openOrders: open.length
                });
            } else {
                const errorMsg = ordersResponse.error || ordersResponse.message || 'Failed to load orders';
                console.error('❌ Failed to load orders:', errorMsg);
                setError(errorMsg);
                // Set default values on error
                setSalesOverview({
                    today: { revenue: 0, orders: 0, completed: 0, averageOrder: 0 },
                    week: { revenue: 0, orders: 0, completed: 0, averageOrder: 0 }
                });
                setOpenOrders([]);
            }
        } catch (error) {
            console.error('❌ Error loading dashboard data:', error);
            console.error('Error details:', {
                message: error.message,
                stack: error.stack
            });
            setError(error.message || 'Failed to load dashboard data');
            // Set default values on error
            setSalesOverview({
                today: { revenue: 0, orders: 0, completed: 0, averageOrder: 0 },
                week: { revenue: 0, orders: 0, completed: 0, averageOrder: 0 }
            });
            setOpenOrders([]);
        } finally {
            setLoading(false);
        }
    };

    const quickActions = [
        { label: 'New Order', icon: ShoppingCart, action: onNewOrder, color: 'bg-blue-500' },
        { label: 'Reports', icon: BarChart3, action: onViewReports, color: 'bg-green-500' },
        { label: 'View Orders', icon: Clock, action: onViewOrders, color: 'bg-purple-500' },
        { label: 'Refund', icon: DollarSign, action: onRefund ? onRefund : () => alert('Refund feature coming soon'), color: 'bg-red-500' }
    ];

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">POS Dashboard</h1>
                    <p className="text-gray-600">Welcome back! Here's your sales overview.</p>
                    {error && (
                        <p className="text-sm text-red-600 mt-2">
                            ⚠️ {error} - Check browser console for details
                        </p>
                    )}
                </div>
                <button
                    onClick={loadDashboardData}
                    disabled={loading}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                </button>
            </div>

            {/* Sales Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Today's Revenue</p>
                            <p className="text-2xl font-bold text-gray-900">
                                ${loading ? '0.00' : salesOverview.today.revenue.toFixed(2)}
                            </p>
                        </div>
                        <DollarSign className="w-8 h-8 text-blue-500" />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                        {salesOverview.today.orders} orders • {salesOverview.today.completed} completed
                    </p>
                    {salesOverview.today.averageOrder > 0 && (
                        <p className="text-xs text-gray-400 mt-1">
                            Avg: ${salesOverview.today.averageOrder.toFixed(2)}
                        </p>
                    )}
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">This Week</p>
                            <p className="text-2xl font-bold text-gray-900">
                                ${loading ? '0.00' : salesOverview.week.revenue.toFixed(2)}
                            </p>
                        </div>
                        <TrendingUp className="w-8 h-8 text-green-500" />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                        {salesOverview.week.orders} orders • {salesOverview.week.completed} completed
                    </p>
                    {salesOverview.week.averageOrder > 0 && (
                        <p className="text-xs text-gray-400 mt-1">
                            Avg: ${salesOverview.week.averageOrder.toFixed(2)}
                        </p>
                    )}
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Open Orders</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {loading ? 0 : openOrders.length}
                            </p>
                        </div>
                        <ShoppingCart className="w-8 h-8 text-purple-500" />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                        Active orders
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Current Time</p>
                            <p className="text-xl font-bold text-gray-900">
                                {new Date().toLocaleTimeString()}
                            </p>
                        </div>
                        <Clock className="w-8 h-8 text-orange-500" />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                        {new Date().toLocaleDateString()}
                    </p>
                </motion.div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Access</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {quickActions.map((action, index) => {
                        const Icon = action.icon;
                        return (
                            <motion.button
                                key={action.label}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.1 }}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={action.action}
                                className={`${action.color} text-white p-4 rounded-lg flex flex-col items-center justify-center space-y-2 hover:shadow-lg transition-shadow`}
                            >
                                <Icon className="w-6 h-6" />
                                <span className="text-sm font-medium">{action.label}</span>
                            </motion.button>
                        );
                    })}
                </div>
            </div>

            {/* Open Orders */}
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">Open Orders</h2>
                    <button
                        onClick={onViewOrders}
                        className="text-sm text-blue-600 hover:text-blue-700"
                    >
                        View All
                    </button>
                </div>
                {loading ? (
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                    </div>
                ) : openOrders.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <ShoppingCart className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                        <p>No open orders</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {openOrders.map((order) => (
                            <motion.div
                                key={order.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-2 mb-1">
                                            <p className="font-medium text-gray-900">
                                                Order #{order.orderNumber || order.id?.slice(0, 8)}
                                            </p>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                order.status === 'preparing' ? 'bg-blue-100 text-blue-800' :
                                                    order.status === 'ready' ? 'bg-green-100 text-green-800' :
                                                        'bg-gray-100 text-gray-800'
                                                }`}>
                                                {order.status || 'Pending'}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600">
                                            {order.orderType === 'dine-in' ? (
                                                <>Dine-In • Table {order.tableNumber || 'N/A'}</>
                                            ) : order.orderType === 'pickup' ? (
                                                <>Pickup • {order.customerName || 'Customer'}</>
                                            ) : order.orderType === 'to-go' ? (
                                                <>To Go • {order.customerName || 'Customer'}</>
                                            ) : order.orderType === 'drive-thru' ? (
                                                <>Drive Thru • {order.customerName || 'Customer'}</>
                                            ) : (
                                                <>{order.orderType || 'Order'} • {order.customerName || 'N/A'}</>
                                            )}
                                        </p>
                                        <div className="flex items-center space-x-3 mt-1">
                                            <p className="text-xs text-gray-500">
                                                {new Date(order.orderDate || order.createdAt).toLocaleTimeString()}
                                            </p>
                                            {order.items && (
                                                <p className="text-xs text-gray-500">
                                                    {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right ml-4">
                                        <p className="font-bold text-lg text-gray-900">
                                            ${parseFloat(order.finalTotal || order.totalAmount || 0).toFixed(2)}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default POSDashboard;

