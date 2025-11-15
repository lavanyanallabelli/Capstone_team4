import React from 'react';
import { motion } from 'framer-motion';
import {
    Utensils,
    ShoppingBag,
    Coffee,
    Home
} from 'lucide-react';

const OrderTypes = ({
    orderType,
    setOrderType,
    tableNumber,
    setTableNumber,
    customerName,
    setCustomerName,
    customerPhone,
    setCustomerPhone
}) => {
    const orderTypes = [
        {
            id: 'dine-in',
            name: 'Dine In',
            icon: Utensils,
            color: 'bg-blue-500',

        },
        {
            id: 'to-go',
            name: 'To Go',
            icon: ShoppingBag,
            color: 'bg-green-500',

        },
        {
            id: 'drive-thru',
            name: 'Drive Thru',
            icon: Coffee,
            color: 'bg-orange-500',

        },
        {
            id: 'pickup',
            name: 'Pickup',
            icon: Home,
            color: 'bg-pink-500',

        }
    ];

    return (
        <div className="p-4 bg-white border-b">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Type</h3>

            {/* Order Type Buttons */}
            <div className="grid grid-cols-4 gap-2 mb-4">
                {orderTypes.map((type) => {
                    const Icon = type.icon;
                    return (
                        <motion.button
                            key={type.id}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setOrderType(type.id)}
                            className={`p-3 rounded-lg border-2 transition-all ${orderType === type.id
                                ? `${type.color} text-white border-transparent`
                                : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                                }`}
                        >
                            <Icon className="w-6 h-6 mx-auto mb-1" />
                            <p className="text-xs font-medium">{type.name}</p>
                        </motion.button>
                    );
                })}
            </div>

            {/* Additional Inputs based on Order Type */}
            <div className="space-y-3">
                {orderType === 'dine-in' && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Table Number
                        </label>
                        <input
                            type="text"
                            value={tableNumber}
                            onChange={(e) => setTableNumber(e.target.value)}
                            placeholder="Enter table number"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                )}

                {orderType === 'pickup' && (
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Customer Name
                            </label>
                            <input
                                type="text"
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                                placeholder="Enter customer name"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        {customerPhone !== undefined && setCustomerPhone && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Customer Phone (Optional)
                                </label>
                                <input
                                    type="tel"
                                    value={customerPhone || ''}
                                    onChange={(e) => setCustomerPhone(e.target.value)}
                                    placeholder="Enter phone number"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        )}
                    </div>
                )}

                {orderType === 'to-go' && (
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Customer Name
                            </label>
                            <input
                                type="text"
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                                placeholder="Enter customer name"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        {customerPhone !== undefined && setCustomerPhone && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Customer Phone (Optional)
                                </label>
                                <input
                                    type="tel"
                                    value={customerPhone || ''}
                                    onChange={(e) => setCustomerPhone(e.target.value)}
                                    placeholder="Enter phone number"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        )}
                    </div>
                )}

            </div>
        </div>
    );
};

export default OrderTypes;
