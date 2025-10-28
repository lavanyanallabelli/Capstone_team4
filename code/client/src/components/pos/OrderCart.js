import React from 'react';
import { motion } from 'framer-motion';
import {
    Plus,
    Minus,
    Trash2,
    ShoppingCart,
    CheckCircle,
    X,
    Clock,
    User
} from 'lucide-react';

const OrderCart = ({
    order,
    orderType,
    tableNumber,
    customerName,
    total,
    onUpdateQuantity,
    onRemoveItem,
    onClearOrder,
    onSubmitOrder
}) => {
    const taxRate = 0.08; // 8% tax
    const tax = total * taxRate;
    const finalTotal = total + tax;

    return (
        <div className="h-full flex flex-col bg-white">
            {/* Header */}
            <div className="p-4 border-b bg-gray-50">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <ShoppingCart className="w-5 h-5 mr-2" />
                        Current Order
                    </h3>
                    <span className="text-sm text-gray-500">
                        {order.length} item{order.length !== 1 ? 's' : ''}
                    </span>
                </div>
            </div>

            {/* Order Details */}
            <div className="p-4 border-b bg-blue-50">
                <div className="space-y-2">
                    <div className="flex items-center text-sm">
                        <Clock className="w-4 h-4 mr-2 text-gray-500" />
                        <span className="font-medium">Order Type:</span>
                        <span className="ml-2 capitalize text-blue-600">{orderType.replace('-', ' ')}</span>
                    </div>

                    {orderType === 'dine-in' && tableNumber && (
                        <div className="flex items-center text-sm">
                            <span className="font-medium">Table:</span>
                            <span className="ml-2 text-blue-600">#{tableNumber}</span>
                        </div>
                    )}

                    {(orderType === 'delivery' || orderType === 'pickup') && customerName && (
                        <div className="flex items-center text-sm">
                            <User className="w-4 h-4 mr-2 text-gray-500" />
                            <span className="font-medium">Customer:</span>
                            <span className="ml-2 text-blue-600">{customerName}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Order Items */}
            <div className="flex-1 overflow-y-auto p-4">
                {order.length === 0 ? (
                    <div className="text-center py-8">
                        <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">No items in order</p>
                        <p className="text-sm text-gray-400">Add items from the menu</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {order.map((item) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="bg-gray-50 rounded-lg p-3"
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex-1">
                                        <h4 className="font-medium text-gray-900 text-sm">
                                            {item.name}
                                        </h4>
                                        <p className="text-xs text-gray-500">
                                            {item.category}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => onRemoveItem(item.id)}
                                        className="text-red-500 hover:text-red-700 p-1"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                                            className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"
                                        >
                                            <Minus className="w-3 h-3" />
                                        </button>
                                        <span className="w-8 text-center font-medium">
                                            {item.quantity}
                                        </span>
                                        <button
                                            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                                            className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"
                                        >
                                            <Plus className="w-3 h-3" />
                                        </button>
                                    </div>
                                    <span className="font-semibold text-gray-900">
                                        ${(item.price * item.quantity).toFixed(2)}
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Order Summary */}
            {order.length > 0 && (
                <div className="border-t bg-gray-50 p-4">
                    <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Subtotal:</span>
                            <span className="font-medium">${total.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Tax (8%):</span>
                            <span className="font-medium">${tax.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-lg font-bold border-t pt-2">
                            <span>Total:</span>
                            <span className="text-green-600">${finalTotal.toFixed(2)}</span>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={onSubmitOrder}
                            className="w-full bg-green-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-600 transition-colors flex items-center justify-center"
                        >
                            <CheckCircle className="w-5 h-5 mr-2" />
                            Submit Order
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={onClearOrder}
                            className="w-full bg-red-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-red-600 transition-colors flex items-center justify-center"
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Clear Order
                        </motion.button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrderCart;
