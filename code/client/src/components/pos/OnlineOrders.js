import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Globe, Clock, CheckCircle, RefreshCw, ShoppingCart, User } from 'lucide-react';
import apiService from '../../services/api';

const OnlineOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);

    useEffect(() => {
        loadOnlineOrders();
        // Refresh every 10 seconds
        const interval = setInterval(loadOnlineOrders, 10000);
        return () => clearInterval(interval);
    }, []);

    const loadOnlineOrders = async () => {
        try {
            setLoading(true);
            const response = await apiService.getOrders();
            if (response.success) {
                // Filter only online orders that are not completed
                const onlineOrders = (response.data || []).filter(order =>
                    order.orderType === 'online-order' &&
                    order.status !== 'completed' &&
                    order.status !== 'cancelled'
                );
                // Sort by date (newest first)
                onlineOrders.sort((a, b) =>
                    new Date(b.orderDate || b.createdAt) - new Date(a.orderDate || a.createdAt)
                );
                setOrders(onlineOrders);
            }
        } catch (error) {
            console.error('Error loading online orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsDone = async (orderId, e) => {
        e.stopPropagation(); // Prevent selecting the order when clicking done
        try {
            const response = await apiService.updateOrderStatus(orderId, 'completed');
            if (response.success) {
                // Remove order from list
                setOrders(prev => prev.filter(order => order.id !== orderId));
                if (selectedOrder?.id === orderId) {
                    setSelectedOrder(null);
                }
            }
        } catch (error) {
            console.error('Error marking order as done:', error);
            alert('Failed to mark order as done');
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'preparing': return 'bg-blue-100 text-blue-800';
            case 'ready': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'pending': return Clock;
            case 'preparing': return RefreshCw;
            case 'ready': return CheckCircle;
            default: return Clock;
        }
    };

    return (
        <div className="flex-1 flex overflow-hidden bg-gray-50">
            {/* Orders List */}
            <div className="w-1/2 border-r bg-white overflow-y-auto">
                <div className="p-4 border-b bg-gray-50 sticky top-0 z-10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <Globe className="w-5 h-5 text-purple-600" />
                            <h2 className="text-xl font-bold text-gray-900">Online Orders</h2>
                        </div>
                        <button
                            onClick={loadOnlineOrders}
                            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </button>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                        {orders.length} active order{orders.length !== 1 ? 's' : ''}
                    </p>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                            <p className="mt-2 text-gray-600">Loading orders...</p>
                        </div>
                    </div>
                ) : orders.length === 0 ? (
                    <div className="text-center py-12">
                        <Globe className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg">No online orders</p>
                        <p className="text-sm text-gray-400 mt-1">New orders will appear here</p>
                    </div>
                ) : (
                    <div className="p-4 space-y-3">
                        {orders.map((order) => {
                            const StatusIcon = getStatusIcon(order.status);
                            const isSelected = selectedOrder?.id === order.id;

                            return (
                                <motion.div
                                    key={order.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    onClick={() => setSelectedOrder(order)}
                                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${isSelected
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                                        }`}
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-2 mb-1">
                                                <span className="font-semibold text-gray-900">
                                                    Order #{order.orderNumber || order.id?.slice(0, 8)}
                                                </span>
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusColor(order.status)}`}>
                                                    <StatusIcon className="w-3 h-3" />
                                                    <span className="capitalize">{order.status}</span>
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600">
                                                {new Date(order.orderDate || order.createdAt).toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-lg text-gray-900">
                                                ${parseFloat(order.finalTotal || order.totalAmount || 0).toFixed(2)}
                                            </p>
                                        </div>
                                    </div>

                                    {order.customerName && (
                                        <div className="flex items-center text-sm text-gray-600 mt-2">
                                            <User className="w-4 h-4 mr-1" />
                                            <span>{order.customerName}</span>
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between mt-3">
                                        <span className="text-xs text-gray-500">
                                            {order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}
                                        </span>
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={(e) => handleMarkAsDone(order.id, e)}
                                            className="px-3 py-1 bg-green-500 text-white text-sm font-medium rounded-lg hover:bg-green-600 transition-colors"
                                        >
                                            Done
                                        </motion.button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Order Details */}
            <div className="w-1/2 bg-white overflow-y-auto">
                {selectedOrder ? (
                    <div className="p-6">
                        <div className="mb-6">
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">
                                Order #{selectedOrder.orderNumber || selectedOrder.id?.slice(0, 8)}
                            </h3>
                            <div className="flex items-center space-x-2">
                                <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1 ${getStatusColor(selectedOrder.status)}`}>
                                    {(() => {
                                        const Icon = getStatusIcon(selectedOrder.status);
                                        return <Icon className="w-4 h-4" />;
                                    })()}
                                    <span className="capitalize">{selectedOrder.status}</span>
                                </span>
                            </div>
                        </div>

                        {/* Order Info */}
                        <div className="bg-gray-50 rounded-lg p-4 mb-6">
                            <h4 className="font-semibold text-gray-900 mb-3">Order Information</h4>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Order Date:</span>
                                    <span className="font-medium">
                                        {new Date(selectedOrder.orderDate || selectedOrder.createdAt).toLocaleString()}
                                    </span>
                                </div>
                                {selectedOrder.customerName && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Customer:</span>
                                        <span className="font-medium">{selectedOrder.customerName}</span>
                                    </div>
                                )}
                                {selectedOrder.customerPhone && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Phone:</span>
                                        <span className="font-medium">{selectedOrder.customerPhone}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Order Items */}
                        <div className="mb-6">
                            <h4 className="font-semibold text-gray-900 mb-3">Items</h4>
                            <div className="space-y-2">
                                {(selectedOrder.items || []).map((item, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-900">{item.name}</p>
                                            <p className="text-sm text-gray-600">
                                                ${parseFloat(item.price || 0).toFixed(2)} × {item.quantity}
                                            </p>
                                        </div>
                                        <p className="font-semibold text-gray-900">
                                            ${(parseFloat(item.price || 0) * item.quantity).toFixed(2)}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Order Summary */}
                        <div className="bg-gray-50 rounded-lg p-4 mb-6">
                            <h4 className="font-semibold text-gray-900 mb-3">Order Summary</h4>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Subtotal:</span>
                                    <span>${parseFloat(selectedOrder.totalAmount || 0).toFixed(2)}</span>
                                </div>
                                {selectedOrder.discountAmount > 0 && (
                                    <div className="flex justify-between text-green-600">
                                        <span>Discount:</span>
                                        <span>-${parseFloat(selectedOrder.discountAmount || 0).toFixed(2)}</span>
                                    </div>
                                )}
                                {selectedOrder.serviceCharge > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Service Charge:</span>
                                        <span>${parseFloat(selectedOrder.serviceCharge || 0).toFixed(2)}</span>
                                    </div>
                                )}
                                {selectedOrder.tax > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Tax:</span>
                                        <span>${parseFloat(selectedOrder.tax || 0).toFixed(2)}</span>
                                    </div>
                                )}
                                {selectedOrder.tip > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Tip:</span>
                                        <span>${parseFloat(selectedOrder.tip || 0).toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-lg font-bold border-t pt-2 mt-2">
                                    <span>Total:</span>
                                    <span className="text-green-600">
                                        ${parseFloat(selectedOrder.finalTotal || selectedOrder.totalAmount || 0).toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={(e) => handleMarkAsDone(selectedOrder.id, e)}
                            className="w-full bg-green-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-600 transition-colors flex items-center justify-center space-x-2"
                        >
                            <CheckCircle className="w-5 h-5" />
                            <span>Mark as Done</span>
                        </motion.button>

                        {selectedOrder.status === 'pending' && (
                            <div className="space-y-2">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={async () => {
                                        try {
                                            await apiService.updateOrderStatus(selectedOrder.id, 'preparing');
                                            await loadOnlineOrders();
                                            setSelectedOrder({ ...selectedOrder, status: 'preparing' });
                                        } catch (error) {
                                            alert('Failed to update status');
                                        }
                                    }}
                                    className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-600 transition-colors"
                                >
                                    Start Preparing
                                </motion.button>
                            </div>
                        )}

                        {selectedOrder.status === 'preparing' && (
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={async () => {
                                    try {
                                        await apiService.updateOrderStatus(selectedOrder.id, 'ready');
                                        await loadOnlineOrders();
                                        setSelectedOrder({ ...selectedOrder, status: 'ready' });
                                    } catch (error) {
                                        alert('Failed to update status');
                                    }
                                }}
                                className="w-full bg-green-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-600 transition-colors"
                            >
                                Mark as Ready
                            </motion.button>
                        )}
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                            <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">Select an order to view details</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OnlineOrders;

