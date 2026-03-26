import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Clock,
    CheckCircle,
    XCircle,
    RefreshCw,
    Search
} from 'lucide-react';
import apiService from '../../services/api';

const OrderHistory = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    // Load orders
    useEffect(() => {
        loadOrders();
    }, []);

    const loadOrders = async () => {
        try {
            setLoading(true);
            const response = await apiService.getOrders();
            if (response.success) {
                setOrders(response.data);
            }
        } catch (error) {
            console.error('Error loading orders:', error);
            setError('Failed to load orders');
        } finally {
            setLoading(false);
        }
    };

    // Filter orders
    const filteredOrders = orders.filter(order => {
        const matchesFilter = filter === 'all' || order.status === filter;
        const matchesSearch = searchTerm === '' ||
            order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.tableNumber?.toLowerCase().includes(searchTerm.toLowerCase());

        return matchesFilter && matchesSearch;
    });

    // Get status color
    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'preparing': return 'bg-blue-100 text-blue-800';
            case 'ready': return 'bg-green-100 text-green-800';
            case 'completed': return 'bg-gray-100 text-gray-800';
            case 'cancelled': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    // Get status icon
    const getStatusIcon = (status) => {
        switch (status) {
            case 'pending': return Clock;
            case 'preparing': return RefreshCw;
            case 'ready': return CheckCircle;
            case 'completed': return CheckCircle;
            case 'cancelled': return XCircle;
            default: return Clock;
        }
    };

    // Update order status
    const updateOrderStatus = async (orderId, newStatus) => {
        try {
            const response = await apiService.updateOrderStatus(orderId, newStatus);
            if (response.success) {
                setOrders(prev =>
                    prev.map(order =>
                        order.id === orderId
                            ? { ...order, status: newStatus }
                            : order
                    )
                );
            }
        } catch (error) {
            console.error('Error updating order status:', error);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading orders...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full bg-white">
            {/* Header */}
            <div className="p-4 border-b">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Order History</h3>
                    <button
                        onClick={loadOrders}
                        className="p-2 text-gray-500 hover:text-gray-700"
                    >
                        <RefreshCw className="w-5 h-5" />
                    </button>
                </div>

                {/* Search and Filter */}
                <div className="space-y-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search orders..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div className="flex space-x-2">
                        {['all', 'pending', 'preparing', 'ready', 'completed', 'cancelled'].map(status => (
                            <button
                                key={status}
                                onClick={() => setFilter(status)}
                                className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${filter === status
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Orders List */}
            <div className="flex-1 overflow-y-auto p-4">
                {filteredOrders.length === 0 ? (
                    <div className="text-center py-8">
                        <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">No orders found</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredOrders.map((order) => {
                            const StatusIcon = getStatusIcon(order.status);
                            return (
                                <motion.div
                                    key={order.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors cursor-pointer"
                                    onClick={() => setSelectedOrder(order)}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center space-x-2">
                                            <span className="font-semibold text-gray-900">
                                                #{order.orderNumber || order.id.slice(-6)}
                                            </span>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                                                <StatusIcon className="w-3 h-3 inline mr-1" />
                                                {order.status}
                                            </span>
                                        </div>
                                        <span className="text-sm text-gray-500">
                                            {new Date(order.timestamp).toLocaleTimeString()}
                                        </span>
                                    </div>

                                    <div className="text-sm text-gray-600 mb-2">
                                        <div className="flex items-center space-x-4">
                                            <span className="capitalize">{order.orderType?.replace('-', ' ')}</span>
                                            {order.tableNumber && <span>Table #{order.tableNumber}</span>}
                                            {order.customerName && <span>{order.customerName}</span>}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-500">
                                            {order.items?.length || 0} items
                                        </span>
                                        <span className="font-semibold text-gray-900">
                                            ${order.total?.toFixed(2) || '0.00'}
                                        </span>
                                    </div>

                                    {/* Quick Actions */}
                                    <div className="flex space-x-2 mt-3">
                                        {order.status === 'pending' && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    updateOrderStatus(order.id, 'preparing');
                                                }}
                                                className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                                            >
                                                Start Preparing
                                            </button>
                                        )}
                                        {order.status === 'preparing' && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    updateOrderStatus(order.id, 'ready');
                                                }}
                                                className="px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                                            >
                                                Mark Ready
                                            </button>
                                        )}
                                        {order.status === 'ready' && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    updateOrderStatus(order.id, 'completed');
                                                }}
                                                className="px-3 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600"
                                            >
                                                Complete
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Order Detail Modal */}
            {selectedOrder && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-96 overflow-y-auto"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">
                                Order #{selectedOrder.orderNumber || selectedOrder.id.slice(-6)}
                            </h3>
                            <button
                                onClick={() => setSelectedOrder(null)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <XCircle className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-3">
                            <div className="text-sm">
                                <p><strong>Type:</strong> {selectedOrder.orderType?.replace('-', ' ')}</p>
                                <p><strong>Status:</strong> {selectedOrder.status}</p>
                                {selectedOrder.tableNumber && <p><strong>Table:</strong> #{selectedOrder.tableNumber}</p>}
                                {selectedOrder.customerName && <p><strong>Customer:</strong> {selectedOrder.customerName}</p>}
                                <p><strong>Time:</strong> {new Date(selectedOrder.timestamp).toLocaleString()}</p>
                            </div>

                            <div>
                                <h4 className="font-medium mb-2">Items:</h4>
                                <div className="space-y-1">
                                    {selectedOrder.items?.map((item, index) => (
                                        <div key={index} className="flex justify-between text-sm">
                                            <span>{item.quantity}x {item.name}</span>
                                            <span>${(parseFloat(item.price || 0) * item.quantity).toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="border-t pt-3">
                                <div className="flex justify-between font-semibold">
                                    <span>Total:</span>
                                    <span>${selectedOrder.total?.toFixed(2) || '0.00'}</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default OrderHistory;
