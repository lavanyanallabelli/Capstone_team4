import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Split,
    Tag,
    X,
    Check,
    Trash2,
} from 'lucide-react';

const OrderManagementPanel = ({
    order,
    onModifyOrder,
    onSplitBill,
    onApplyDiscount,
    onAddTip,
    onApplyTax,
    onCancelOrder,
    onRefreshOrder
}) => {
    const [showDiscount, setShowDiscount] = useState(false);
    const [showTip, setShowTip] = useState(false);
    const [discountType, setDiscountType] = useState('percentage'); // 'percentage' or 'fixed'
    const [discountValue, setDiscountValue] = useState('');
    const [tipValue, setTipValue] = useState('');
    const [tipType, setTipType] = useState('percentage');

    const handleApplyDiscount = () => {
        if (!discountValue) return;
        onApplyDiscount({
            type: discountType,
            value: parseFloat(discountValue)
        });
        setShowDiscount(false);
        setDiscountValue('');
    };

    const handleApplyTip = () => {
        if (!tipValue) return;
        onAddTip({
            type: tipType,
            value: parseFloat(tipValue)
        });
        setShowTip(false);
        setTipValue('');
    };

    const actions = [
        {
            label: 'Split Bill',
            icon: Split,
            action: () => {
                if (order.length === 0) {
                    alert('No items in order to split');
                    return;
                }
                onSplitBill();
            },
            color: 'bg-purple-500 hover:bg-purple-600'
        },
        {
            label: 'Apply Discount',
            icon: Tag,
            action: () => setShowDiscount(true),
            color: 'bg-green-500 hover:bg-green-600'
        },
        {
            label: 'Cancel Order',
            icon: Trash2,
            action: () => {
                if (window.confirm('Are you sure you want to cancel this order?')) {
                    onCancelOrder();
                }
            },
            color: 'bg-red-500 hover:bg-red-600'
        },
    ];

    return (
        <div className="bg-white border-t p-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-700">Order Management</h3>
            </div>

            <div className="grid grid-cols-3 gap-2">
                {actions.map((action) => {
                    const Icon = action.icon;
                    return (
                        <motion.button
                            key={action.label}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={action.action}
                            className={`${action.color} text-white p-3 rounded-lg flex flex-col items-center justify-center space-y-1 text-xs font-medium`}
                        >
                            <Icon className="w-4 h-4" />
                            <span className="text-center">{action.label}</span>
                        </motion.button>
                    );
                })}
            </div>

            {/* Discount Modal */}
            {showDiscount && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold">Apply Discount</h3>
                            <button onClick={() => setShowDiscount(false)}>
                                <X className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Discount Type
                                </label>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => setDiscountType('percentage')}
                                        className={`flex-1 px-4 py-2 rounded-lg ${discountType === 'percentage'
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-gray-100 text-gray-700'
                                            }`}
                                    >
                                        Percentage (%)
                                    </button>
                                    <button
                                        onClick={() => setDiscountType('fixed')}
                                        className={`flex-1 px-4 py-2 rounded-lg ${discountType === 'fixed'
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-gray-100 text-gray-700'
                                            }`}
                                    >
                                        Fixed ($)
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {discountType === 'percentage' ? 'Discount Percentage' : 'Discount Amount'}
                                </label>
                                <input
                                    type="number"
                                    step={discountType === 'percentage' ? '1' : '0.01'}
                                    min="0"
                                    max={discountType === 'percentage' ? '100' : undefined}
                                    value={discountValue}
                                    onChange={(e) => setDiscountValue(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder={discountType === 'percentage' ? 'Enter %' : 'Enter amount'}
                                />
                            </div>

                            <div className="flex space-x-3">
                                <button
                                    onClick={() => setShowDiscount(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleApplyDiscount}
                                    className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center justify-center"
                                >
                                    <Check className="w-4 h-4 mr-2" />
                                    Apply
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Tip Modal */}
            {showTip && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold">Add Tip</h3>
                            <button onClick={() => setShowTip(false)}>
                                <X className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Tip Type
                                </label>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => setTipType('percentage')}
                                        className={`flex-1 px-4 py-2 rounded-lg ${tipType === 'percentage'
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-gray-100 text-gray-700'
                                            }`}
                                    >
                                        Percentage (%)
                                    </button>
                                    <button
                                        onClick={() => setTipType('fixed')}
                                        className={`flex-1 px-4 py-2 rounded-lg ${tipType === 'fixed'
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-gray-100 text-gray-700'
                                            }`}
                                    >
                                        Fixed ($)
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {tipType === 'percentage' ? 'Tip Percentage' : 'Tip Amount'}
                                </label>
                                <input
                                    type="number"
                                    step={tipType === 'percentage' ? '1' : '0.01'}
                                    min="0"
                                    value={tipValue}
                                    onChange={(e) => setTipValue(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder={tipType === 'percentage' ? 'Enter %' : 'Enter amount'}
                                />
                            </div>

                            <div className="flex space-x-3">
                                <button
                                    onClick={() => setShowTip(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleApplyTip}
                                    className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center justify-center"
                                >
                                    <Check className="w-4 h-4 mr-2" />
                                    Add Tip
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default OrderManagementPanel;

