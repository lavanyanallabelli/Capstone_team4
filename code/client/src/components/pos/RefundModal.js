import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, DollarSign, AlertCircle, Search, CheckCircle } from 'lucide-react';
import apiService from '../../services/api';

const RefundModal = ({ isOpen, onClose, onRefundComplete }) => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [refundAmount, setRefundAmount] = useState(0);
    const [refundReason, setRefundReason] = useState('');
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            loadRefundableOrders();
        }
    }, [isOpen]);

    const loadRefundableOrders = async () => {
        try {
            setLoading(true);
            const response = await apiService.getOrders({ limit: 1000, status: 'completed' });
            if (response.success) {
                // Filter only completed orders with payments
                const refundableOrders = (response.data || []).filter(order =>
                    order.status === 'completed' &&
                    order.payments &&
                    order.payments.length > 0 &&
                    order.payments.some(p => p.status === 'completed')
                );
                setOrders(refundableOrders);
            }
        } catch (error) {
            console.error('Error loading refundable orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredOrders = orders.filter(order =>
        order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.id?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSelectOrder = (order) => {
        setSelectedOrder(order);
        const payment = order.payments?.find(p => p.status === 'completed');
        setRefundAmount(parseFloat(payment?.amount || order.finalTotal || order.totalAmount || 0));
        setError('');
    };

    const handleProcessRefund = async () => {
        if (!selectedOrder) return;
        if (!refundReason.trim()) {
            setError('Please provide a reason for the refund');
            return;
        }
        if (refundAmount <= 0) {
            setError('Refund amount must be greater than 0');
            return;
        }

        const payment = selectedOrder.payments?.find(p => p.status === 'completed');
        if (!payment) {
            setError('No payment found for this order');
            return;
        }

        if (refundAmount > parseFloat(payment.amount)) {
            setError('Refund amount cannot exceed payment amount');
            return;
        }

        try {
            setProcessing(true);
            setError('');

            // Process refund
            const response = await apiService.refundPayment(
                selectedOrder.id,
                payment.id,
                {
                    amount: refundAmount,
                    reason: refundReason
                }
            );
            if (response.success) {
                if (onRefundComplete) {
                    onRefundComplete({
                        orderId: selectedOrder.id,
                        paymentId: payment.id,
                        amount: refundAmount,
                        reason: refundReason
                    });
                }

                // Reset form
                setSelectedOrder(null);
                setRefundAmount(0);
                setRefundReason('');
                onClose();
            } else {
                setError('Failed to process refund');
            }
        } catch (error) {
            console.error('Error processing refund:', error);
            setError(error.response?.data?.message || 'Failed to process refund');
        } finally {
            setProcessing(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <h2 className="text-xl font-bold text-gray-900">Process Refund</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    {/* Order Selection */}
                    <div className="w-1/2 border-r overflow-y-auto">
                        <div className="p-4 border-b bg-gray-50">
                            <div className="relative mb-4">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search orders..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <p className="text-sm text-gray-600">
                                {filteredOrders.length} refundable order{filteredOrders.length !== 1 ? 's' : ''}
                            </p>
                        </div>

                        {loading ? (
                            <div className="flex items-center justify-center h-64">
                                <div className="text-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                                    <p className="mt-2 text-gray-600">Loading orders...</p>
                                </div>
                            </div>
                        ) : filteredOrders.length === 0 ? (
                            <div className="text-center py-12">
                                <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500">No refundable orders found</p>
                            </div>
                        ) : (
                            <div className="p-4 space-y-2">
                                {filteredOrders.map((order) => {
                                    const payment = order.payments?.find(p => p.status === 'completed');
                                    const isSelected = selectedOrder?.id === order.id;

                                    return (
                                        <div
                                            key={order.id}
                                            onClick={() => handleSelectOrder(order)}
                                            className={`border-2 rounded-lg p-3 cursor-pointer transition-all ${isSelected
                                                    ? 'border-blue-500 bg-blue-50'
                                                    : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="font-medium text-gray-900">
                                                        Order #{order.orderNumber || order.id?.slice(0, 8)}
                                                    </p>
                                                    <p className="text-sm text-gray-600">
                                                        {new Date(order.orderDate || order.createdAt).toLocaleDateString()}
                                                    </p>
                                                    {order.customerName && (
                                                        <p className="text-xs text-gray-500">{order.customerName}</p>
                                                    )}
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-semibold text-gray-900">
                                                        ${parseFloat(payment?.amount || order.finalTotal || 0).toFixed(2)}
                                                    </p>
                                                    <p className="text-xs text-gray-500 capitalize">
                                                        {payment?.method || 'N/A'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Refund Details */}
                    <div className="w-1/2 overflow-y-auto">
                        {selectedOrder ? (
                            <div className="p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Refund Details</h3>

                                {/* Order Info */}
                                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                                    <h4 className="font-medium text-gray-900 mb-2">Order Information</h4>
                                    <div className="space-y-1 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Order #:</span>
                                            <span className="font-medium">{selectedOrder.orderNumber || selectedOrder.id?.slice(0, 8)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Date:</span>
                                            <span>{new Date(selectedOrder.orderDate || selectedOrder.createdAt).toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Original Amount:</span>
                                            <span className="font-medium">
                                                ${parseFloat(selectedOrder.finalTotal || selectedOrder.totalAmount || 0).toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Refund Amount */}
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Refund Amount
                                    </label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            max={parseFloat(selectedOrder.finalTotal || selectedOrder.totalAmount || 0)}
                                            value={refundAmount}
                                            onChange={(e) => setRefundAmount(parseFloat(e.target.value) || 0)}
                                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Maximum: ${parseFloat(selectedOrder.finalTotal || selectedOrder.totalAmount || 0).toFixed(2)}
                                    </p>
                                </div>

                                {/* Refund Reason */}
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Reason for Refund <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        value={refundReason}
                                        onChange={(e) => setRefundReason(e.target.value)}
                                        placeholder="Enter reason for refund..."
                                        rows={4}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>

                                {error && (
                                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center">
                                        <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                                        <span className="text-sm text-red-700">{error}</span>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="flex space-x-3">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        disabled={processing}
                                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                    <motion.button
                                        type="button"
                                        onClick={handleProcessRefund}
                                        disabled={processing || !refundReason.trim()}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                                    >
                                        {processing ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle className="w-4 h-4 mr-2" />
                                                Process Refund
                                            </>
                                        )}
                                    </motion.button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-full">
                                <div className="text-center">
                                    <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                    <p className="text-gray-500">Select an order to process refund</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default RefundModal;

