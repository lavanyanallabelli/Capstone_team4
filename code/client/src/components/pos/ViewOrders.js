import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, CheckCircle, XCircle, Search, RefreshCw, X } from 'lucide-react';
import apiService from '../../services/api';

const ViewOrders = ({ onClose }) => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('date'); // date, amount, status

    useEffect(() => {
        loadOrders();
    }, []);

    const loadOrders = async () => {
        try {
            setLoading(true);
            const response = await apiService.getOrders({ limit: 1000 });
            if (response.success) {
                setOrders(response.data || []);
            }
        } catch (error) {
            console.error('Error loading orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return 'bg-green-100 text-green-800';
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'preparing': return 'bg-blue-100 text-blue-800';
            case 'ready': return 'bg-purple-100 text-purple-800';
            case 'cancelled': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'completed': return CheckCircle;
            case 'cancelled': return XCircle;
            default: return Clock;
        }
    };

    const filteredAndSortedOrders = orders
        .filter(order => {
            const matchesFilter = filter === 'all' || order.status?.toLowerCase() === filter;
            const matchesSearch = searchTerm === '' ||
                order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                order.tableNumber?.toString().includes(searchTerm);
            return matchesFilter && matchesSearch;
        })
        .sort((a, b) => {
            switch (sortBy) {
                case 'amount':
                    return parseFloat(b.finalTotal || b.totalAmount || 0) - parseFloat(a.finalTotal || a.totalAmount || 0);
                case 'status':
                    return (a.status || '').localeCompare(b.status || '');
                case 'date':
                default:
                    return new Date(b.orderDate || b.createdAt) - new Date(a.orderDate || a.createdAt);
            }
        });

    return (
        <div className="flex-1 flex overflow-hidden bg-gray-50">
            {/* Orders List */}
            <div className={`${selectedOrder ? 'w-1/2' : 'w-full'} border-r bg-white overflow-y-auto transition-all`}>
                <div className="p-4 border-b bg-gray-50 sticky top-0 z-10">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-gray-900">All Orders</h2>
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={loadOrders}
                                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
                            >
                                <RefreshCw className="w-4 h-4" />
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

                    {/* Filters */}
                    <div className="flex items-center space-x-4 mb-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by order number, customer, or table..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="preparing">Preparing</option>
                            <option value="ready">Ready</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="date">Sort by Date</option>
                            <option value="amount">Sort by Amount</option>
                            <option value="status">Sort by Status</option>
                        </select>
                    </div>

                    <p className="text-sm text-gray-600">
                        Showing {filteredAndSortedOrders.length} of {orders.length} orders
                    </p>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                            <p className="mt-2 text-gray-600">Loading orders...</p>
                        </div>
                    </div>
                ) : filteredAndSortedOrders.length === 0 ? (
                    <div className="text-center py-12">
                        <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg">No orders found</p>
                    </div>
                ) : (
                    <div className="p-4 space-y-3">
                        {filteredAndSortedOrders.map((order) => {
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
                                                    <span className="capitalize">{order.status || 'Pending'}</span>
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600">
                                                {new Date(order.orderDate || order.createdAt).toLocaleString()}
                                            </p>
                                            <p className="text-sm text-gray-600 mt-1">
                                                {order.orderType === 'dine-in' ? (
                                                    <>Dine-In • Table {order.tableNumber || 'N/A'}</>
                                                ) : order.customerName ? (
                                                    <>{order.orderType} • {order.customerName}</>
                                                ) : (
                                                    <>{order.orderType || 'Order'}</>
                                                )}
                                            </p>
                                        </div>
                                        <div className="text-right ml-4">
                                            <p className="font-bold text-lg text-gray-900">
                                                ${parseFloat(order.finalTotal || order.totalAmount || 0).toFixed(2)}
                                            </p>
                                            {order.items && (
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Order Details */}
            {selectedOrder && (
                <div className="w-1/2 bg-white overflow-y-auto">
                    <div className="p-6">
                        <div className="mb-6 flex items-center justify-between">
                            <h3 className="text-2xl font-bold text-gray-900">
                                Order #{selectedOrder.orderNumber || selectedOrder.id?.slice(0, 8)}
                            </h3>
                            <button
                                onClick={() => setSelectedOrder(null)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
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
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Status:</span>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedOrder.status)}`}>
                                        {selectedOrder.status || 'Pending'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Order Type:</span>
                                    <span className="font-medium capitalize">{selectedOrder.orderType || 'N/A'}</span>
                                </div>
                                {selectedOrder.tableNumber && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Table:</span>
                                        <span className="font-medium">#{selectedOrder.tableNumber}</span>
                                    </div>
                                )}
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

                        {/* Payment Info */}
                        {selectedOrder.payments && selectedOrder.payments.length > 0 && (
                            <div className="bg-gray-50 rounded-lg p-4">
                                <h4 className="font-semibold text-gray-900 mb-3">Payment Information</h4>
                                {selectedOrder.payments.map((payment, index) => (
                                    <div key={index} className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Payment Method:</span>
                                            <span className="font-medium capitalize">{payment.method}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Amount:</span>
                                            <span className="font-medium">${parseFloat(payment.amount || 0).toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Status:</span>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${payment.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                payment.status === 'refunded' ? 'bg-red-100 text-red-800' :
                                                    'bg-gray-100 text-gray-800'
                                                }`}>
                                                {payment.status}
                                            </span>
                                        </div>
                                        {payment.transactionId && (
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Transaction ID:</span>
                                                <span className="font-medium text-xs">{payment.transactionId}</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ViewOrders;

