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
                {items.map((item) => (
                    <motion.div
                        key={item.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onAddToOrder(item)}
                        className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                    >
                        {/* Item Details */}
                        <div className="p-3 flex items-center justify-center min-h-[60px]">
                            <h3 className="font-semibold text-gray-900 text-sm text-center">
                                {item.name}
                            </h3>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default MenuDisplay;
