import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Star, Clock } from 'lucide-react';

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
            <div className="grid grid-cols-2 gap-4">
                {items.map((item) => (
                    <motion.div
                        key={item.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                    >
                        {/* Item Image */}
                        <div className="h-32 bg-gray-100 relative">
                            {item.image ? (
                                <img
                                    src={item.image}
                                    alt={item.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                    <span className="text-4xl">🍽️</span>
                                </div>
                            )}

                            {/* Popular Badge */}
                            {item.isPopular && (
                                <div className="absolute top-2 left-2 bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-medium flex items-center">
                                    <Star className="w-3 h-3 mr-1" />
                                    Popular
                                </div>
                            )}
                        </div>

                        {/* Item Details */}
                        <div className="p-4">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-semibold text-gray-900 text-sm line-clamp-2">
                                    {item.name}
                                </h3>
                                <span className="text-lg font-bold text-green-600 ml-2">
                                    ${typeof item.price === 'number' ? item.price.toFixed(2) : parseFloat(item.price || 0).toFixed(2)}
                                </span>
                            </div>

                            {item.description && (
                                <p className="text-gray-600 text-xs mb-3 line-clamp-2">
                                    {item.description}
                                </p>
                            )}

                            {/* Category and Availability */}
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                    {item.category}
                                </span>
                                <span className={`text-xs px-2 py-1 rounded ${item.isAvailable
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-red-100 text-red-700'
                                    }`}>
                                    {item.isAvailable ? 'Available' : 'Unavailable'}
                                </span>
                            </div>

                            {/* Add to Order Button */}
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => onAddToOrder(item)}
                                disabled={!item.isAvailable}
                                className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center ${item.isAvailable
                                        ? 'bg-blue-500 text-white hover:bg-blue-600'
                                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    }`}
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                {item.isAvailable ? 'Add to Order' : 'Unavailable'}
                            </motion.button>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default MenuDisplay;
