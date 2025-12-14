import React from 'react';
import { motion } from 'framer-motion';
import {
    ShoppingBag,
    Home,
    Truck,
    Send,
    Plus
} from 'lucide-react';

const OrderTypes = ({
    orderType,
    setOrderType,
    tableNumber,
    setTableNumber,
    onSubmitOrder,
    selectedCategory
}) => {
    const orderTypes = [
        {
            id: 'to-go',
            name: 'To Go',
            icon: ShoppingBag,
            color: 'bg-green-500',
        },
        {
            id: 'pickup',
            name: 'Pickup',
            icon: Home,
            color: 'bg-pink-500',

        },
        {
            id: 'delivery',
            name: 'Delivery',
            icon: Truck,
            color: 'bg-purple-500',

        },
        {
            id: 'send-order',
            name: 'Send Order',
            icon: Send,
            color: 'bg-orange-500',

        }
    ];

    return (
        <div className="px-4 pt-1 pb-2 bg-white shadow-lg">
            {/* <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Type</h3> */}

            {/* Order Type Buttons with Add to Order button on the right */}
            <div className="flex items-center gap-2">
            {/* Order Type Buttons */}
                <div className="grid grid-cols-4 gap-2 flex-1">
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

                {/* Add to Order Button - Positioned on the right */}
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onSubmitOrder}
                    className="p-3 rounded-lg border-2 bg-blue-600 text-white border-transparent hover:bg-blue-700 transition-all flex items-center gap-2 whitespace-nowrap"
                >
                    <Plus className="w-6 h-6" />
                    <p className="text-xs font-medium">
                        {selectedCategory === 'modify' ? 'Add to Order' : 'Submit Order'}
                    </p>
                </motion.button>
                </div>
        </div>
    );
};

export default OrderTypes;
