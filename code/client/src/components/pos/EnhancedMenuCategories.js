import React from 'react';
import { motion } from 'framer-motion';
import {
    Utensils,
    Soup,
    Coffee,
    IceCream,
    GlassWater,
    ChefHat,
    Pizza,
    Apple
} from 'lucide-react';

const categoryIcons = {
    'all': Utensils,
    'starters': Soup,
    'appetizers': Soup,
    'main course': ChefHat,
    'mains': ChefHat,
    'sides': Apple,
    'extras': Apple,
    'desserts': IceCream,
    'beverages': GlassWater,
    'cold': GlassWater,
    'hot': Coffee,
    'combos': Pizza,
    'thali': Pizza,
    'add-ons': Apple,
    'toppings': Apple
};

const categoryNames = {
    'all': 'All Items',
    'starters': 'Starters / Appetizers',
    'appetizers': 'Starters / Appetizers',
    'main course': 'Main Course',
    'mains': 'Main Course',
    'sides': 'Sides / Extras',
    'extras': 'Sides / Extras',
    'desserts': 'Desserts',
    'beverages': 'Beverages',
    'cold': 'Cold Beverages',
    'hot': 'Hot Beverages',
    'combos': 'Special Combos / Thali',
    'thali': 'Special Combos / Thali',
    'add-ons': 'Add-ons / Toppings',
    'toppings': 'Add-ons / Toppings'
};

const EnhancedMenuCategories = ({ categories, selectedCategory, onSelectCategory }) => {
    // Standardize category names
    const standardizedCategories = categories.map(cat => {
        const lower = cat.toLowerCase();
        if (lower.includes('starter') || lower.includes('appetizer')) return 'starters';
        if (lower.includes('main')) return 'main course';
        if (lower.includes('side') || lower.includes('extra')) return 'sides';
        if (lower.includes('dessert')) return 'desserts';
        if (lower.includes('beverage') || lower.includes('drink')) return 'beverages';
        if (lower.includes('combo') || lower.includes('thali')) return 'combos';
        if (lower.includes('add') || lower.includes('topping')) return 'add-ons';
        return lower;
    });

    const uniqueSet = new Set(standardizedCategories);
    uniqueSet.add('all'); // Ensure 'all' is included
    const uniqueCategories = Array.from(uniqueSet);

    return (
        <div className="p-4 border-b bg-white">
            <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
                {uniqueCategories.map(category => {
                    const Icon = categoryIcons[category] || Utensils;
                    const displayName = categoryNames[category] || category;

                    return (
                        <motion.button
                            key={category}
                            onClick={() => onSelectCategory(category)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={`flex items-center space-x-2 px-4 py-3 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${selectedCategory === category
                                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            <Icon className="w-4 h-4" />
                            <span>{displayName}</span>
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
};

export default EnhancedMenuCategories;

