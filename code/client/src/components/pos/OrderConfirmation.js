import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, X, Receipt, CreditCard } from 'lucide-react';

const OrderConfirmation = ({ order, payment, onClose }) => {
    const paymentMethods = {
        cash: 'Cash',
        card: 'Card',
        online: 'Online',
        digital_wallet: 'Digital Wallet'
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-lg shadow-xl w-full max-w-md"
            >
                {/* Header */}
                <div className="bg-green-500 text-white p-6 rounded-t-lg">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <CheckCircle className="w-8 h-8 mr-3" />
                            <div>
                                <h2 className="text-2xl font-bold">Payment Complete!</h2>
                                <p className="text-green-100">Order processed successfully</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white hover:text-gray-200"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Order Details */}
                <div className="p-6">
                    <div className="space-y-4">
                        {/* Order Number */}
                        <div className="flex items-center justify-between pb-3 border-b">
                            <div className="flex items-center">
                                <Receipt className="w-5 h-5 text-gray-400 mr-2" />
                                <span className="text-gray-600">Order Number:</span>
                            </div>
                            <span className="font-bold text-lg">{order.orderNumber}</span>
                        </div>

                        {/* Payment Method */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <CreditCard className="w-5 h-5 text-gray-400 mr-2" />
                                <span className="text-gray-600">Payment Method:</span>
                            </div>
                            <span className="font-medium capitalize">
                                {paymentMethods[payment.method] || payment.method}
                            </span>
                        </div>

                        {/* Amount */}
                        <div className="flex items-center justify-between pb-3 border-b">
                            <span className="text-gray-600">Amount Paid:</span>
                            <span className="font-bold text-xl text-green-600">
                                ${parseFloat(payment.amount || 0).toFixed(2)}
                            </span>
                        </div>

                        {/* Transaction ID */}
                        {payment.transactionId && (
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-500">Transaction ID:</span>
                                <span className="font-mono text-gray-700">
                                    {payment.transactionId}
                                </span>
                            </div>
                        )}

                        {/* Status */}
                        <div className="flex items-center justify-between pt-3 border-t">
                            <span className="text-gray-600">Status:</span>
                            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium capitalize">
                                {payment.status || 'Completed'}
                            </span>
                        </div>
                    </div>

                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="w-full mt-6 bg-blue-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-600 transition-colors"
                    >
                        Continue
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default OrderConfirmation;
