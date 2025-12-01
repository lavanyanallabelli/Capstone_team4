import React from 'react';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';

const MenuDisplay = ({ items, onAddToOrder }) => {
    if (items.length === 0) {
        return (
            <div className="p-8 text-center">
                <div className="text-gray-400 mb-4">
                    <Clock className="w-16 h-16 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No items found</h3>
                <p className="text-gray-500">Try selecting a different category</p>
            </div>
        );
    }

    return (
        <div className="p-4 h-full overflow-y-auto">
            <div className="grid grid-cols-5 gap-3">
                {items.map((item) => {
                    const isUnavailable = item.isAvailable === false;
                    return (
                        <motion.div
                            key={item.id}
                            whileHover={isUnavailable ? {} : { scale: 1.02 }}
                            whileTap={isUnavailable ? {} : { scale: 0.98 }}
                            onClick={() => !isUnavailable && onAddToOrder(item)}
                            className={`rounded-lg shadow-sm border overflow-hidden transition-all ${
                                isUnavailable
                                    ? 'bg-gray-100 border-gray-300 opacity-60 cursor-not-allowed'
                                    : 'bg-white border-gray-200 hover:shadow-md cursor-pointer'
                            }`}
                        >
                            {/* Item Details */}
                            <div className="p-3 flex items-center justify-center min-h-[60px]">
                                <h3 className={`font-semibold text-sm text-center ${
                                    isUnavailable ? 'text-gray-400' : 'text-gray-900'
                                }`}>
                                    {item.name}
                                </h3>
                            </div>
                            {isUnavailable && (
                                <div className="px-2 pb-2">
                                    <span className="text-xs text-red-500 font-medium">Unavailable</span>
                                </div>
                            )}
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};

export default MenuDisplay;
