import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, CheckCircle, XCircle, CreditCard, RefreshCw } from 'lucide-react';
import apiService from '../../services/api';

const RecentOrders = ({ refreshTrigger }) => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadOrders = async () => {
        try {
            setLoading(true);
            const response = await apiService.getOrders({ limit: 10, status: 'all' });
            if (response.success) {
                setOrders(response.data || []);
            }
        } catch (error) {
            console.error('Error loading orders:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadOrders();
    }, [refreshTrigger]);

    const getStatusColor = (status) => {
        const colors = {
            completed: 'bg-green-100 text-green-700',
            pending: 'bg-yellow-100 text-yellow-700',
            preparing: 'bg-blue-100 text-blue-700',
            ready: 'bg-purple-100 text-purple-700',
            cancelled: 'bg-red-100 text-red-700'
        };
        return colors[status] || 'bg-gray-100 text-gray-700';
    };

    const getStatusIcon = (status) => {
        if (status === 'completed') return <CheckCircle className="w-4 h-4" />;
        if (status === 'cancelled') return <XCircle className="w-4 h-4" />;
        return <Clock className="w-4 h-4" />;
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
                <button
                    onClick={loadOrders}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Refresh"
                >
                    <RefreshCw className="w-4 h-4" />
                </button>
            </div>

            {loading ? (
                <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-500">Loading orders...</p>
                </div>
            ) : orders.length === 0 ? (
                <div className="text-center py-8">
                    <p className="text-gray-500">No orders yet</p>
                </div>
            ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                    {orders.map((order) => (
                        <motion.div
                            key={order.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center space-x-2">
                                    <span className="font-semibold text-sm">{order.orderNumber}</span>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusColor(order.status)}`}>
                                        {getStatusIcon(order.status)}
                                        <span className="capitalize">{order.status}</span>
                                    </span>
                                </div>
                                <span className="text-xs text-gray-500">
                                    {formatDate(order.orderDate || order.createdAt)}
                                </span>
                            </div>

                            <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center space-x-4 text-gray-600">
                                    <span className="capitalize">{order.orderType?.replace('-', ' ')}</span>
                                    {order.tableNumber && (
                                        <span>Table #{order.tableNumber}</span>
                                    )}
                                    {order.customerName && (
                                        <span>{order.customerName}</span>
                                    )}
                                </div>
                                <div className="flex items-center space-x-1">
                                    <CreditCard className="w-4 h-4 text-gray-400" />
                                    <span className="font-semibold text-green-600">
                                        ${parseFloat(order.finalTotal || 0).toFixed(2)}
                                    </span>
                                </div>
                            </div>

                            {/* Payment Status */}
                            {order.payments && order.payments.length > 0 && (
                                <div className="mt-2 pt-2 border-t border-gray-100">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-gray-500">Payment:</span>
                                        <span className={`font-medium ${
                                            order.payments[0].status === 'completed' 
                                                ? 'text-green-600' 
                                                : 'text-yellow-600'
                                        }`}>
                                            {order.payments[0].status === 'completed' ? 'Paid' : 'Pending'}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default RecentOrders;
