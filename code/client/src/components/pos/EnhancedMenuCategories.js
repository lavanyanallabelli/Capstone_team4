import React from 'react';
import { motion } from 'framer-motion';

// Category name configuration - simple black and white design
const categoryStyles = {
    'all': { name: 'MAIN MENU' },
    'main menu': { name: 'ALL ITEMS' },
    'main course': { name: 'MAIN MENU' },
    'mains': { name: 'MAIN MENU' },
    'signature': { name: 'SIGNATURE EATS' },
    'signature eats': { name: 'SIGNATURE EATS' },
    'other': { name: 'OTHER MENU' },
    'other menu': { name: 'OTHER MENU' },
    'breakfast': { name: 'BREAKFAST MENU' },
    'breakfast menu': { name: 'BREAKFAST MENU' },
    'catering': { name: 'CATERING MENU' },
    'catering menu': { name: 'CATERING MENU' },
    'sides': { name: 'Charged Sides' },
    'charged sides': { name: 'Charged Sides' },
    'extras': { name: 'Charged Sides' },
    'beverages': { name: 'Beverages' },
    'drinks': { name: 'Beverages' },
    'alcohol': { name: 'Alcohol' },
    'merchant': { name: 'Merchant & Community' },
    'community': { name: 'Merchant & Community' },
    'modify': { name: 'Modify' },
    'functions': { name: 'Functions Menu' },
    'functions menu': { name: 'Functions Menu' },
    'starters': { name: 'MAIN MENU' },
    'appetizers': { name: 'MAIN MENU' },
    'desserts': { name: 'DESSERTS' },
    'combos': { name: 'COMBOS' },
    'thali': { name: 'COMBOS' },
    'add-ons': { name: 'Charged Sides' },
    'toppings': { name: 'Charged Sides' }
};

const EnhancedMenuCategories = ({ categories, selectedCategory, onSelectCategory }) => {
    // Standardize category names and get their display name
    const getCategoryName = (cat) => {
        const lower = cat.toLowerCase();

        // Check for exact matches first
        if (categoryStyles[lower]) {
            return categoryStyles[lower].name;
        }

        // Check for partial matches
        for (const [key, style] of Object.entries(categoryStyles)) {
            if (lower.includes(key) || key.includes(lower)) {
                return style.name;
            }
        }

        // Default name
        return cat.toUpperCase();
    };

    const standardizedCategories = categories.map(cat => {
        const lower = cat.toLowerCase();
        if (lower.includes('starter') || lower.includes('appetizer')) return 'starters';
        if (lower.includes('main') && !lower.includes('signature')) return 'main menu';
        if (lower.includes('signature')) return 'signature eats';
        if (lower.includes('side') || lower.includes('extra') || lower.includes('charged')) return 'charged sides';
        if (lower.includes('dessert')) return 'desserts';
        if (lower.includes('beverage') || lower.includes('drink')) return 'beverages';
        if (lower.includes('alcohol')) return 'alcohol';
        if (lower.includes('combo') || lower.includes('thali')) return 'combos';
        if (lower.includes('add') || lower.includes('topping')) return 'add-ons';
        if (lower.includes('breakfast')) return 'breakfast menu';
        if (lower.includes('catering')) return 'catering menu';
        if (lower.includes('merchant') || lower.includes('community')) return 'merchant';
        return lower;
    });

    const uniqueSet = new Set(standardizedCategories);
    uniqueSet.add('all'); // Ensure 'all' is included

    // Add required categories
    uniqueSet.add('beverages');
    uniqueSet.add('charged sides');
    uniqueSet.add('breakfast menu');
    uniqueSet.add('catering menu');
    uniqueSet.add('signature eats');

    // Add special categories
    uniqueSet.add('modify');

    const uniqueCategories = Array.from(uniqueSet);

    return (
        <div className="w-40 bg-white border-l border-r border-gray-200 flex flex-col overflow-y-auto p-2 gap-2">
            {uniqueCategories.map((category, index) => {
                const categoryName = getCategoryName(category);
                const isSelected = selectedCategory === category;

                return (
                    <motion.button
                        key={category}
                        onClick={() => onSelectCategory(category)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`w-full px-4 py-4 text-left font-bold text-sm uppercase tracking-wide transition-all relative rounded-lg border-2 ${isSelected
                            ? 'bg-blue-500 text-white border-blue-600 shadow-md'
                            : 'bg-white text-black border-gray-300 hover:bg-gray-100 hover:border-gray-400'
                            }`}
                    >
                        <span className="relative z-10">{categoryName}</span>
                    </motion.button>
                );
            })}
        </div>
    );
};

export default EnhancedMenuCategories;

