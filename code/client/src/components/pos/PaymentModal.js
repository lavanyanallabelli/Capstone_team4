import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, CreditCard, DollarSign, CheckCircle, AlertCircle } from 'lucide-react';

const PaymentModal = ({ isOpen, onClose, order, onPaymentComplete }) => {
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [amount, setAmount] = useState(order?.finalTotal || 0);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState('');

    // Update amount when payment method changes
    useEffect(() => {
        if (order?.finalTotal !== undefined) {
            if (paymentMethod === 'card') {
                // For card, use the exact order total
                setAmount(order.finalTotal || 0);
            } else {
                // For cash, start with order total but allow modification
                setAmount(order.finalTotal || 0);
            }
        }
    }, [paymentMethod, order?.finalTotal]);

    if (!isOpen || !order) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setProcessing(true);
        setError('');

        try {
            // For card payments, use the exact order total
            // For cash, use the amount received
            const paymentAmount = paymentMethod === 'card'
                ? parseFloat(order.finalTotal || 0)
                : parseFloat(amount);

            // Process payment
            await onPaymentComplete(order.id, {
                method: paymentMethod,
                amount: paymentAmount
            });
        } catch (err) {
            setError(err.message || 'Payment processing failed');
        } finally {
            setProcessing(false);
        }
    };

    const paymentMethods = [
        { value: 'cash', label: 'Cash', icon: DollarSign },
        { value: 'card', label: 'Card', icon: CreditCard }
    ];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-lg shadow-xl w-full max-w-md"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <h2 className="text-xl font-bold text-gray-900">Process Payment</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Order Summary */}
                <div className="p-6 border-b bg-gray-50">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Order Summary</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Order Number:</span>
                            <span className="font-medium">{order.orderNumber}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Subtotal:</span>
                            <span>${parseFloat(order.totalAmount || 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Tax:</span>
                            <span>${parseFloat(order.tax || 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-lg font-bold border-t pt-2 mt-2">
                            <span>Total:</span>
                            <span className="text-green-600">${parseFloat(order.finalTotal || 0).toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* Payment Form */}
                <form onSubmit={handleSubmit} className="p-6">
                    {/* Payment Method */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            Payment Method
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            {paymentMethods.map((method) => {
                                const Icon = method.icon;
                                return (
                                    <button
                                        key={method.value}
                                        type="button"
                                        onClick={() => setPaymentMethod(method.value)}
                                        className={`p-3 border-2 rounded-lg flex flex-col items-center justify-center transition-colors ${paymentMethod === method.value
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <Icon className={`w-5 h-5 mb-1 ${paymentMethod === method.value ? 'text-blue-500' : 'text-gray-400'
                                            }`} />
                                        <span className={`text-xs font-medium text-center ${paymentMethod === method.value ? 'text-blue-700' : 'text-gray-700'
                                            }`}>
                                            {method.label}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Amount (for cash - change calculation) */}
                    {paymentMethod === 'cash' && (
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Amount Received
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                min={parseFloat(order.finalTotal || 0)}
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                            />
                            {parseFloat(amount) >= parseFloat(order.finalTotal || 0) && (
                                <p className="mt-2 text-sm text-green-600">
                                    Change: ${(parseFloat(amount) - parseFloat(order.finalTotal || 0)).toFixed(2)}
                                </p>
                            )}
                        </div>
                    )}

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
                            type="submit"
                            disabled={processing || (paymentMethod === 'cash' && parseFloat(amount) < parseFloat(order.finalTotal || 0))}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                            {processing ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Process Payment
                                </>
                            )}
                        </motion.button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default PaymentModal;
