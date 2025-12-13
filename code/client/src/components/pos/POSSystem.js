import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../services/api';
import { getCustomBlocks, saveCustomBlocks } from '../../services/posBlocksService';
import MenuDisplay from './MenuDisplay';
import OrderCart from './OrderCart';
import OrderTypes from './OrderTypes';
import EmployeeQuickAccess from './EmployeeQuickAccess';
import PaymentModal from './PaymentModal';
import OrderConfirmation from './OrderConfirmation';
import RecentOrders from './RecentOrders';
import {
    Users,
    Plus,
    X,
    Edit2
} from 'lucide-react';

const POSSystem = () => {
    const { currentUser } = useAuth();
    const [menuItems, setMenuItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [currentOrder, setCurrentOrder] = useState([]);
    const [orderType, setOrderType] = useState('dine-in');
    const [tableNumber, setTableNumber] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [loading, setLoading] = useState(true);
    const [showEmployeeAccess, setShowEmployeeAccess] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [currentOrderData, setCurrentOrderData] = useState(null);
    const [orderConfirmation, setOrderConfirmation] = useState(null);
    const [selectedPizzaItem, setSelectedPizzaItem] = useState(null);

    // Custom Blocks State - Load from database
    const [customBlocks, setCustomBlocks] = useState(null);
    const [blocksLoading, setBlocksLoading] = useState(true);

    // Load custom blocks from database on mount
    useEffect(() => {
        const loadBlocks = async () => {
            try {
                setBlocksLoading(true);
                const blocks = await getCustomBlocks();
                setCustomBlocks(blocks);
            } catch (error) {
                console.error('Error loading custom blocks:', error);
                // Set default blocks on error
                setCustomBlocks({
                    proteinTop: Array(3).fill(null),
                    protein: Array(3).fill(null),
                    toppings: Array(5).fill(null),
                    extraProtein: Array(5).fill(null),
                    snacks: Array(5).fill(null),
                    drinks: Array(5).fill(null),
                    categories: Array(9).fill(null)
                });
            } finally {
                setBlocksLoading(false);
            }
        };

        loadBlocks();
    }, []);

    // Poll for updates from database (every 3 seconds)
    useEffect(() => {
        if (blocksLoading) return;

        const interval = setInterval(async () => {
            try {
                const current = await getCustomBlocks();
                const currentStr = JSON.stringify(current);
                const stateStr = JSON.stringify(customBlocks);
                if (currentStr !== stateStr) {
                    setCustomBlocks(current);
                }
            } catch (error) {
                console.error('Error polling for blocks updates:', error);
            }
        }, 3000);

        return () => clearInterval(interval);
    }, [customBlocks, blocksLoading]);

    // Modal state for selecting items
    const [showItemSelector, setShowItemSelector] = useState(false);
    const [selectedBlockType, setSelectedBlockType] = useState(null);
    const [selectedBlockIndex, setSelectedBlockIndex] = useState(null);

    // Force close modal if non-owner tries to open it
    useEffect(() => {
        const isOwner = currentUser?.userRole === 'owner';
        if (showItemSelector && !isOwner) {
            console.log('🚫 Force closing modal - user is not owner');
            setShowItemSelector(false);
            setSelectedBlockType(null);
            setSelectedBlockIndex(null);
        }
    }, [showItemSelector, currentUser?.userRole]);

    // Check if user is owner (only owners can edit)
    // Explicitly check - managers and employees should NOT see edit options
    const userRole = currentUser?.userRole;
    const isOwner = userRole === 'owner';
    const isManager = userRole === 'manager';
    const isEmployee = userRole === 'employee';
    // Only owners can edit - explicitly exclude managers and employees
    const canEdit = isOwner === true && isManager !== true && isEmployee !== true;

    // Debug logging
    console.log('🔍 POSSystem Debug:', {
        currentUser,
        userRole,
        isOwner,
        isManager,
        isEmployee,
        canEdit,
        shouldShowEdit: userRole === 'owner'
    });

    // Load menu items and categories
    useEffect(() => {
        const loadMenuData = async () => {
            try {
                setLoading(true);
                console.log('POSSystem - Loading menu items');
                const response = await apiService.getMenuItems();
                if (response.success) {
                    const items = response.data;
                    setMenuItems(items);

                    // Extract unique categories
                    const uniqueCategories = [...new Set(items.map(item => item.category).filter(Boolean))];
                    setCategories(uniqueCategories);
                }
            } catch (error) {
                console.error('Error loading menu:', error);
            } finally {
                setLoading(false);
            }
        };

        loadMenuData();
    }, []);

    // Check item availability based on schedule
    const checkItemAvailability = (item) => {
        if (!item.availabilitySchedule) {
            return item.availability !== false;
        }

        const now = new Date();
        const currentDay = now.getDay(); // 0 = Sunday, 6 = Saturday
        const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
        const isWeekend = currentDay === 0 || currentDay === 6;
        const dayType = isWeekend ? 'weekends' : 'weekdays';

        const schedule = item.availabilitySchedule[dayType];
        if (!schedule || !schedule.enabled) {
            return item.availability !== false;
        }

        const { start, end } = schedule;
        return currentTime >= start && currentTime <= end && item.availability !== false;
    };

    // Filter menu items by category and availability
    // Support multiple categories - check both primary category and tags (additional categories)
    const filteredMenuItems = (selectedCategory === 'all'
        ? menuItems
        : menuItems.filter(item => {
            const itemCat = (item.category || '').toLowerCase();
            const itemTags = (item.tags || []).map(tag => tag.toLowerCase());
            const selectedCat = selectedCategory.toLowerCase();

            // Check both primary category and tags (additional categories)
            const allItemCategories = [itemCat, ...itemTags];

            // Handle hardcoded categories - check both category and tags
            if (selectedCat === 'starters') {
                return allItemCategories.some(cat => cat.includes('starter') || cat.includes('appetizer'));
            }
            if (selectedCat === 'main course' || selectedCat === 'main menu') {
                return allItemCategories.some(cat => cat.includes('main'));
            }
            if (selectedCat === 'sides') {
                return allItemCategories.some(cat => cat.includes('side') || cat.includes('extra'));
            }
            if (selectedCat === 'desserts') {
                return allItemCategories.some(cat => cat.includes('dessert'));
            }
            if (selectedCat === 'beverages') {
                return allItemCategories.some(cat => cat.includes('beverage') || cat.includes('drink'));
            }
            if (selectedCat === 'combos') {
                return allItemCategories.some(cat => cat.includes('combo') || cat.includes('thali'));
            }
            if (selectedCat === 'add-ons') {
                return allItemCategories.some(cat => cat.includes('add') || cat.includes('topping'));
            }

            // Handle custom category values (from custom blocks)
            // Check if the selected category matches any of the item's categories (primary or tags)
            return allItemCategories.some(cat =>
                cat === selectedCat || cat.includes(selectedCat) || selectedCat.includes(cat)
            );
        })
    ).map(item => {
        const isAvailable = checkItemAvailability(item);
        return {
            ...item,
            isAvailable: isAvailable
        };
    });

    // Check if item is a pizza
    const isPizzaItem = (item) => {
        const name = (item.name || '').toLowerCase();
        return name.includes('pizza');
    };

    // Add item to order
    const addToOrder = (item) => {
        // Check if item is available before adding to cart
        if (item.isAvailable === false) {
            alert('This item is unavailable');
            return;
        }

        // If it's a pizza item, show size selection instead of adding directly
        if (isPizzaItem(item)) {
            setSelectedPizzaItem(item);
            return;
        }

        const existingItem = currentOrder.find(orderItem => orderItem.id === item.id);
        if (existingItem) {
            setCurrentOrder(prev =>
                prev.map(orderItem =>
                    orderItem.id === item.id
                        ? { ...orderItem, quantity: orderItem.quantity + 1 }
                        : orderItem
                )
            );
        } else {
            setCurrentOrder(prev => [...prev, {
                ...item,
                quantity: 1,
                price: parseFloat(item.price || 0)
            }]);
        }
    };

    // Add pizza with selected size
    const addPizzaWithSize = (size) => {
        if (!selectedPizzaItem) return;

        const sizePrices = {
            'small': selectedPizzaItem.price * 0.8,
            'medium': selectedPizzaItem.price,
            'large': selectedPizzaItem.price * 1.2
        };

        const pizzaWithSize = {
            ...selectedPizzaItem,
            id: `${selectedPizzaItem.id}-${size}`,
            name: `${selectedPizzaItem.name} (${size.charAt(0).toUpperCase() + size.slice(1)})`,
            size: size,
            price: sizePrices[size] || selectedPizzaItem.price,
            quantity: 1
        };

        const existingItem = currentOrder.find(orderItem => orderItem.id === pizzaWithSize.id);
        if (existingItem) {
            setCurrentOrder(prev =>
                prev.map(orderItem =>
                    orderItem.id === pizzaWithSize.id
                        ? { ...orderItem, quantity: orderItem.quantity + 1 }
                        : orderItem
                )
            );
        } else {
            setCurrentOrder(prev => [...prev, pizzaWithSize]);
        }

        setSelectedPizzaItem(null);
    };

    // Handle block click - open selector if empty, add to order if filled
    const handleBlockClick = (blockType, blockIndex, isEdit = false) => {
        if (!customBlocks) return;

        const isOwner = currentUser?.userRole === 'owner';

        // STRICT: Only owners can edit or open selector modal
        // Non-owners cannot edit, click empty blocks, or open the selector modal
        if (!isOwner) {
            // Non-owners cannot:
            // 1. Edit blocks (isEdit = true)
            // 2. Click empty blocks (block is null/undefined)
            // 3. Open the selector modal for any reason
            if (isEdit) {
                console.log('🚫 Non-owner attempted to edit - blocked');
                return;
            }

            const block = customBlocks[blockType][blockIndex];
            if (!block) {
                console.log('🚫 Non-owner attempted to click empty block - blocked');
                return; // Non-owners cannot click empty blocks (which would open selector)
            }

            // For non-owners, only allow clicking filled blocks to add to order or select category
            // Do NOT open selector modal
        }

        const block = customBlocks[blockType][blockIndex];
        if (!block || isEdit) {
            // Block is empty or edit mode - open selector (ONLY for owners)
            if (!isOwner) {
                console.log('🚫 Non-owner attempted to open selector - blocked');
                return;
            }
            setSelectedBlockType(blockType);
            setSelectedBlockIndex(blockIndex);
            setShowItemSelector(true);
        } else {
            // Block has item - check if it's a category block
            if (blockType === 'categories') {
                // Category block - set selected category
                if (block.isCategory) {
                    setSelectedCategory(block.categoryValue);
                } else if (block.isModify) {
                    setSelectedCategory('modify');
                }
            } else {
                // Regular item - add to order
                addToOrder(block);
            }
        }
    };

    // Handle item selection from modal - Only owners can update
    const handleItemSelect = async (item) => {
        if (currentUser?.userRole !== 'owner' || !customBlocks) return;

        if (selectedBlockType && selectedBlockIndex !== null) {
            const newBlocks = { ...customBlocks };
            newBlocks[selectedBlockType] = [...newBlocks[selectedBlockType]];
            newBlocks[selectedBlockType][selectedBlockIndex] = item;
            setCustomBlocks(newBlocks);
            await saveCustomBlocks(newBlocks);
        }
        setShowItemSelector(false);
        setSelectedBlockType(null);
        setSelectedBlockIndex(null);
    };

    // Handle category or modify selection - Only owners can update
    const handleCategoryOrModifySelect = async (type, value) => {
        if (currentUser?.userRole !== 'owner' || !customBlocks) return;

        if (selectedBlockType && selectedBlockIndex !== null) {
            const categoryItem = {
                id: `category-${value}`,
                name: type === 'category' ? value : 'Modify',
                price: 0,
                isAvailable: true,
                isCategory: type === 'category',
                isModify: type === 'modify',
                categoryValue: value
            };

            const newBlocks = { ...customBlocks };
            newBlocks[selectedBlockType] = [...newBlocks[selectedBlockType]];
            newBlocks[selectedBlockType][selectedBlockIndex] = categoryItem;
            setCustomBlocks(newBlocks);
            await saveCustomBlocks(newBlocks);
        }
        setShowItemSelector(false);
        setSelectedBlockType(null);
        setSelectedBlockIndex(null);
    };

    // Update item quantity
    const updateQuantity = (itemId, newQuantity) => {
        if (newQuantity <= 0) {
            removeFromOrder(itemId);
        } else {
            setCurrentOrder(prev =>
                prev.map(item =>
                    item.id === itemId
                        ? { ...item, quantity: newQuantity }
                        : item
                )
            );
        }
    };

    // Remove item from order
    const removeFromOrder = (itemId) => {
        setCurrentOrder(prev => prev.filter(item => item.id !== itemId));
    };

    // Clear entire order
    const clearOrder = () => {
        setCurrentOrder([]);
        setTableNumber('');
        setCustomerName('');
    };

    // Calculate order total
    const orderTotal = currentOrder.reduce((total, item) => total + (parseFloat(item.price || 0) * item.quantity), 0);

    // Submit order
    const submitOrder = async () => {
        if (currentOrder.length === 0) {
            alert('Please add items to the order');
            return;
        }

        if (orderType === 'dine-in' && !tableNumber) {
            alert('Please enter a table number');
            return;
        }

        if ((orderType === 'delivery' || orderType === 'pickup') && !customerName) {
            alert('Please enter customer name');
            return;
        }

        try {
            const taxRate = 0.08;
            const tax = orderTotal * taxRate;
            const finalTotal = orderTotal + tax;

            const orderData = {
                items: currentOrder,
                orderType,
                tableNumber: orderType === 'dine-in' ? tableNumber : null,
                customerName: (orderType === 'delivery' || orderType === 'pickup') ? customerName : null,
                total: orderTotal,
                status: 'pending',
                employeeId: currentUser?.sub,
                businessId: currentUser?.businessId,
                timestamp: new Date().toISOString()
            };

            const response = await apiService.createOrder(orderData);
            if (response.success) {
                const createdOrder = {
                    ...response.data,
                    finalTotal: finalTotal,
                    tax: tax
                };
                setCurrentOrderData(createdOrder);
                setShowPaymentModal(true);
            } else {
                alert('Failed to submit order');
            }
        } catch (error) {
            console.error('Error submitting order:', error);
            alert('Error submitting order: ' + (error.response?.data?.message || error.message));
        }
    };

    // Process payment
    const handlePaymentComplete = async (orderId, paymentData) => {
        try {
            const response = await apiService.processPayment(orderId, paymentData);
            if (response.success) {
                setOrderConfirmation({
                    order: response.data.order,
                    payment: response.data.payment
                });
                setShowPaymentModal(false);

                window.dispatchEvent(new Event('orderUpdated'));

                setTimeout(() => {
                    clearOrder();
                    setOrderConfirmation(null);
                }, 5000);
            } else {
                alert('Payment processing failed');
            }
        } catch (error) {
            console.error('Error processing payment:', error);
            throw new Error(error.response?.data?.message || 'Payment processing failed');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading POS System...</p>
                </div>
            </div>
        );
    }

    // Determine if user is owner - if not, hide ALL edit functionality
    const isOwnerUser = currentUser?.userRole === 'owner';

    // Debug: Log owner status
    console.log('🔍 POSSystem - isOwnerUser:', isOwnerUser, 'userRole:', currentUser?.userRole);

    // If not owner, add a class to hide all edit buttons via CSS
    const posContainerClass = isOwnerUser ? 'h-screen bg-gray-50 flex flex-col' : 'h-screen bg-gray-50 flex flex-col no-edit-mode';

    return (
        <div className={posContainerClass}>
            <style>{`
                .no-edit-mode button[title="Edit"],
                .no-edit-mode .edit-button,
                .no-edit-mode [class*="edit"],
                .no-edit-mode svg[class*="Edit"] {
                    display: none !important;
                    visibility: hidden !important;
                    opacity: 0 !important;
                    pointer-events: none !important;
                }
                /* Hide Select Item modal for non-owners */
                .no-edit-mode [class*="Select Item"],
                .no-edit-mode [class*="select-item"] {
                    display: none !important;
                }
            `}</style>
            {/* Header */}
            <div className="bg-white shadow-sm border-b px-6 py-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">POS System</h1>
                        <p className="text-gray-600">Welcome, {currentUser?.email}</p>
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="text-right">
                            <p className="text-sm text-gray-500">Current Time</p>
                            <p className="text-lg font-semibold">{new Date().toLocaleTimeString()}</p>
                        </div>
                        <button
                            onClick={() => setShowEmployeeAccess(true)}
                            className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                        >
                            <Users className="w-4 h-4" />
                            <span>{currentUser?.userRole === 'owner' ? 'Owner' : currentUser?.userRole === 'manager' ? 'Manager' : 'Employee'}</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Side - Menu Items */}
                <div className="flex-1 flex flex-col bg-white border-r">
                    {/* Modify View or Menu Display */}
                    {selectedCategory === 'modify' ? (
                        <div className="flex-1 overflow-y-auto p-4">
                            {/* Items Section */}
                            <div className="mb-4">
                                <h3 className="text-lg font-bold text-gray-900 mb-2">Items</h3>
                                <div className="grid grid-cols-5 gap-2">
                                    {[1, 2, 3, 4, 5].map((num) => (
                                        <motion.button
                                            key={`item-${num}`}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => addToOrder({
                                                id: `modify-item-${num}`,
                                                name: `Item ${num}`,
                                                price: 0,
                                                isAvailable: true
                                            })}
                                            className="p-2 rounded-lg shadow-sm border border-gray-200 bg-white hover:shadow-md cursor-pointer transition-all"
                                        >
                                            <h3 className="font-semibold text-sm text-center text-gray-900">
                                                Item {num}
                                            </h3>
                                        </motion.button>
                                    ))}
                                </div>
                            </div>

                            {/* Sauces Section */}
                            <div className="mb-4">
                                <h3 className="text-lg font-bold text-gray-900 mb-2">Sauces</h3>
                                <div className="grid grid-cols-5 gap-2">
                                    {[1, 2, 3, 4, 5].map((num) => (
                                        <motion.button
                                            key={`sauce-${num}`}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => addToOrder({
                                                id: `modify-sauce-${num}`,
                                                name: `Sauce ${num}`,
                                                price: 0,
                                                isAvailable: true
                                            })}
                                            className="p-2 rounded-lg shadow-sm border border-gray-200 bg-white hover:shadow-md cursor-pointer transition-all"
                                        >
                                            <h3 className="font-semibold text-sm text-center text-gray-900">
                                                Sauce {num}
                                            </h3>
                                        </motion.button>
                                    ))}
                                </div>
                            </div>

                            {/* Toppings Section */}
                            <div className="mb-4">
                                <h3 className="text-lg font-bold text-gray-900 mb-2">Toppings</h3>
                                <div className="grid grid-cols-7 gap-2">
                                    {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                                        <motion.button
                                            key={`topping-${num}`}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => addToOrder({
                                                id: `modify-topping-${num}`,
                                                name: `Topping ${num}`,
                                                price: 0,
                                                isAvailable: true
                                            })}
                                            className="p-2 rounded-lg shadow-sm border border-gray-200 bg-white hover:shadow-md cursor-pointer transition-all"
                                        >
                                            <h3 className="font-semibold text-sm text-center text-gray-900">
                                                Topping {num}
                                            </h3>
                                        </motion.button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 overflow-y-auto p-4">
                            <MenuDisplay
                                items={filteredMenuItems}
                                onAddToOrder={addToOrder}
                                showSections={selectedCategory === 'all'}
                            />
                        </div>
                    )}

                    {/* Pizza Size Selection */}
                    {selectedPizzaItem && (
                        <div className="px-4 pb-2 border-t border-gray-200 bg-blue-50">
                            <div className="pt-2">
                                <div className="grid grid-cols-3 gap-2">
                                    {['small', 'medium', 'large'].map((size) => (
                                        <motion.button
                                            key={size}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => addPizzaWithSize(size)}
                                            className="p-3 rounded-lg shadow-sm border-2 border-blue-300 bg-white hover:bg-blue-100 hover:border-blue-500 cursor-pointer transition-all"
                                        >
                                            <h3 className="font-semibold text-sm text-center text-gray-900 capitalize">
                                                {size}
                                            </h3>
                                        </motion.button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Constant Blocks - Hide when "all items" is selected */}
                    {selectedCategory !== 'all' && customBlocks && (
                        <>
                            {/* Protein Blocks - Top row (3 blocks) */}
                            <div className="px-4 pb-1">
                                <div className="grid grid-cols-5 gap-2 pt-1">
                                    <div></div>
                                    {customBlocks.proteinTop.map((block, index) => (
                                        <motion.button
                                            key={`protein-top-${index}`}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => handleBlockClick('proteinTop', index)}
                                            className="p-2 rounded-lg shadow-sm border border-gray-200 bg-white hover:shadow-md cursor-pointer transition-all relative"
                                        >
                                            {block ? (
                                                <>
                                                    <h3 className="font-semibold text-sm text-center text-gray-900 pr-5">
                                                        {block.name}
                                                    </h3>
                                                    {isOwnerUser && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleBlockClick('proteinTop', index, true);
                                                            }}
                                                            className="absolute top-1 right-1 p-1 rounded hover:bg-gray-200 transition-colors edit-button"
                                                            title="Edit"
                                                        >
                                                            <Edit2 className="w-3 h-3 text-gray-600" />
                                                        </button>
                                                    )}
                                                </>
                                            ) : (
                                                currentUser?.userRole === 'owner' ? (
                                                    <Plus className="w-5 h-5 mx-auto text-gray-400" />
                                                ) : (
                                                    <div className="w-5 h-5 mx-auto" />
                                                )
                                            )}
                                        </motion.button>
                                    ))}
                                    <div></div>
                                </div>
                            </div>

                            {/* Protein Blocks - Above Toppings blocks, centered (3 blocks) */}
                            <div className="px-4 pb-1">
                                <div className="grid grid-cols-5 gap-2 pt-1">
                                    <div></div>
                                    {customBlocks.protein.map((block, index) => (
                                        <motion.button
                                            key={`protein-${index}`}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => handleBlockClick('protein', index)}
                                            className="p-2 rounded-lg shadow-sm border border-gray-200 bg-white hover:shadow-md cursor-pointer transition-all relative"
                                        >
                                            {block ? (
                                                <>
                                                    <h3 className="font-semibold text-sm text-center text-gray-900 pr-5">
                                                        {block.name}
                                                    </h3>
                                                    {isOwnerUser && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleBlockClick('protein', index, true);
                                                            }}
                                                            className="absolute top-1 right-1 p-1 rounded hover:bg-gray-200 transition-colors edit-button"
                                                            title="Edit"
                                                        >
                                                            <Edit2 className="w-3 h-3 text-gray-600" />
                                                        </button>
                                                    )}
                                                </>
                                            ) : (
                                                currentUser?.userRole === 'owner' ? (
                                                    <Plus className="w-5 h-5 mx-auto text-gray-400" />
                                                ) : (
                                                    <div className="w-5 h-5 mx-auto" />
                                                )
                                            )}
                                        </motion.button>
                                    ))}
                                    <div></div>
                                </div>
                            </div>

                            {/* Toppings Blocks */}
                            <div className="px-4 pb-1">
                                <div className="grid grid-cols-5 gap-2 pt-1">
                                    {customBlocks.toppings.map((block, index) => (
                                        <motion.button
                                            key={`toppings-${index}`}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => handleBlockClick('toppings', index)}
                                            className="p-2 rounded-lg shadow-sm border border-gray-200 bg-white hover:shadow-md cursor-pointer transition-all relative"
                                        >
                                            {block ? (
                                                <>
                                                    <h3 className="font-semibold text-sm text-center text-gray-900 pr-5">
                                                        {block.name}
                                                    </h3>
                                                    {isOwnerUser && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleBlockClick('toppings', index, true);
                                                            }}
                                                            className="absolute top-1 right-1 p-1 rounded hover:bg-gray-200 transition-colors edit-button"
                                                            title="Edit"
                                                        >
                                                            <Edit2 className="w-3 h-3 text-gray-600" />
                                                        </button>
                                                    )}
                                                </>
                                            ) : (
                                                currentUser?.userRole === 'owner' ? (
                                                    <Plus className="w-5 h-5 mx-auto text-gray-400" />
                                                ) : (
                                                    <div className="w-5 h-5 mx-auto" />
                                                )
                                            )}
                                        </motion.button>
                                    ))}
                                </div>
                            </div>

                            {/* Extra Protein Blocks */}
                            <div className="px-4 pb-1">
                                <div className="grid grid-cols-5 gap-2 pt-1">
                                    {customBlocks.extraProtein.map((block, index) => (
                                        <motion.button
                                            key={`extra-protein-${index}`}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => handleBlockClick('extraProtein', index)}
                                            className="p-2 rounded-lg shadow-sm border border-gray-200 bg-white hover:shadow-md cursor-pointer transition-all relative"
                                        >
                                            {block ? (
                                                <>
                                                    <h3 className="font-semibold text-sm text-center text-gray-900 pr-5">
                                                        {block.name}
                                                    </h3>
                                                    {isOwnerUser && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleBlockClick('extraProtein', index, true);
                                                            }}
                                                            className="absolute top-1 right-1 p-1 rounded hover:bg-gray-200 transition-colors edit-button"
                                                            title="Edit"
                                                        >
                                                            <Edit2 className="w-3 h-3 text-gray-600" />
                                                        </button>
                                                    )}
                                                </>
                                            ) : (
                                                currentUser?.userRole === 'owner' ? (
                                                    <Plus className="w-5 h-5 mx-auto text-gray-400" />
                                                ) : (
                                                    <div className="w-5 h-5 mx-auto" />
                                                )
                                            )}
                                        </motion.button>
                                    ))}
                                </div>
                            </div>

                            {/* Snack Blocks */}
                            <div className="px-4 pb-1">
                                <div className="grid grid-cols-5 gap-2 pt-1">
                                    {customBlocks.snacks.map((block, index) => (
                                        <motion.button
                                            key={`snacks-${index}`}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => handleBlockClick('snacks', index)}
                                            className="p-2 rounded-lg shadow-sm border border-gray-200 bg-white hover:shadow-md cursor-pointer transition-all relative"
                                        >
                                            {block ? (
                                                <>
                                                    <h3 className="font-semibold text-sm text-center text-gray-900 pr-5">
                                                        {block.name}
                                                    </h3>
                                                    {isOwnerUser && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleBlockClick('snacks', index, true);
                                                            }}
                                                            className="absolute top-1 right-1 p-1 rounded hover:bg-gray-200 transition-colors edit-button"
                                                            title="Edit"
                                                        >
                                                            <Edit2 className="w-3 h-3 text-gray-600" />
                                                        </button>
                                                    )}
                                                </>
                                            ) : (
                                                currentUser?.userRole === 'owner' ? (
                                                    <Plus className="w-5 h-5 mx-auto text-gray-400" />
                                                ) : (
                                                    <div className="w-5 h-5 mx-auto" />
                                                )
                                            )}
                                        </motion.button>
                                    ))}
                                </div>
                            </div>

                            {/* Drink Blocks */}
                            <div className="px-4 pb-1">
                                <div className="grid grid-cols-5 gap-2 pt-1">
                                    {customBlocks.drinks.map((block, index) => (
                                        <motion.button
                                            key={`drinks-${index}`}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => handleBlockClick('drinks', index)}
                                            className="p-2 rounded-lg shadow-sm border border-gray-200 bg-white hover:shadow-md cursor-pointer transition-all relative"
                                        >
                                            {block ? (
                                                <>
                                                    <h3 className="font-semibold text-sm text-center text-gray-900 pr-5">
                                                        {block.name}
                                                    </h3>
                                                    {isOwnerUser && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleBlockClick('drinks', index, true);
                                                            }}
                                                            className="absolute top-1 right-1 p-1 rounded hover:bg-gray-200 transition-colors edit-button"
                                                            title="Edit"
                                                        >
                                                            <Edit2 className="w-3 h-3 text-gray-600" />
                                                        </button>
                                                    )}
                                                </>
                                            ) : (
                                                currentUser?.userRole === 'owner' ? (
                                                    <Plus className="w-5 h-5 mx-auto text-gray-400" />
                                                ) : (
                                                    <div className="w-5 h-5 mx-auto" />
                                                )
                                            )}
                                        </motion.button>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    {/* Order Type Selection - At the bottom */}
                    <OrderTypes
                        orderType={orderType}
                        setOrderType={setOrderType}
                        tableNumber={tableNumber}
                        setTableNumber={setTableNumber}
                        customerName={customerName}
                        setCustomerName={setCustomerName}
                    />
                </div>

                {/* Middle - Category Sidebar */}
                <div className="w-40 bg-white border-l border-r border-gray-200 flex flex-col overflow-y-auto p-2 gap-2">
                    {customBlocks && customBlocks.categories.map((block, index) => {
                        const isSelected = block && (
                            (block.isCategory && selectedCategory === block.categoryValue) ||
                            (block.isModify && selectedCategory === 'modify')
                        );

                        return (
                            <motion.button
                                key={`category-${index}`}
                                onClick={() => handleBlockClick('categories', index)}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className={`w-full px-4 py-4 text-left font-bold text-sm uppercase tracking-wide transition-all relative rounded-lg border-2 ${isSelected
                                    ? 'bg-blue-500 text-white border-blue-600 shadow-md'
                                    : 'bg-white text-black border-gray-300 hover:bg-gray-100 hover:border-gray-400'
                                    }`}
                            >
                                {block ? (
                                    <>
                                        <span className="relative z-10 pr-5">{block.name}</span>
                                        {isOwnerUser && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleBlockClick('categories', index, true);
                                                }}
                                                className="absolute top-1 right-1 p-1 rounded hover:bg-gray-200 transition-colors z-20 edit-button"
                                                title="Edit"
                                            >
                                                <Edit2 className="w-3 h-3 text-gray-600" />
                                            </button>
                                        )}
                                    </>
                                ) : (
                                    currentUser?.userRole === 'owner' ? (
                                        <Plus className="w-5 h-5 mx-auto text-gray-400" />
                                    ) : (
                                        <div className="w-5 h-5 mx-auto" />
                                    )
                                )}
                            </motion.button>
                        );
                    })}
                </div>

                {/* Right Side - Order Cart */}
                <div className="w-1/4 bg-gray-50">
                    <OrderCart
                        order={currentOrder}
                        orderType={orderType}
                        tableNumber={tableNumber}
                        customerName={customerName}
                        total={orderTotal}
                        onUpdateQuantity={updateQuantity}
                        onRemoveItem={removeFromOrder}
                        onClearOrder={clearOrder}
                        onSubmitOrder={submitOrder}
                    />
                </div>
            </div>

            {/* Item Selector Modal - Only for owners */}
            {showItemSelector && currentUser?.userRole === 'owner' && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col"
                    >
                        <div className="p-4 border-b flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-900">Select Item</h2>
                            <button
                                onClick={() => {
                                    setShowItemSelector(false);
                                    setSelectedBlockType(null);
                                    setSelectedBlockIndex(null);
                                }}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4">
                            <div className="space-y-4">
                                {/* Modify Option - Only show for category blocks */}
                                {selectedBlockType === 'categories' && (
                                    <div>
                                        <h3 className="font-semibold text-gray-700 mb-2">Options</h3>
                                        <div className="grid grid-cols-2 gap-2">
                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => handleCategoryOrModifySelect('modify', 'modify')}
                                                className="p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-blue-500 transition-all flex items-center justify-between"
                                            >
                                                <div>
                                                    <div className="font-medium text-sm text-gray-900">Modify</div>
                                                    <div className="text-xs text-gray-500">Modify order options</div>
                                                </div>
                                                <Plus className="w-5 h-5 text-gray-400" />
                                            </motion.button>
                                        </div>
                                    </div>
                                )}

                                {/* Categories Section - Only show for category blocks */}
                                {selectedBlockType === 'categories' && (
                                    <div>
                                        <h3 className="font-semibold text-gray-700 mb-2">Categories</h3>
                                        <div className="grid grid-cols-2 gap-2">
                                            {categories.map((category) => (
                                                <motion.button
                                                    key={category}
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    onClick={() => handleCategoryOrModifySelect('category', category)}
                                                    className="p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-blue-500 transition-all flex items-center justify-between"
                                                >
                                                    <div className="font-medium text-sm text-gray-900">{category}</div>
                                                    <Plus className="w-5 h-5 text-gray-400" />
                                                </motion.button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Menu Items Grouped by Category - Show for non-category blocks */}
                                {selectedBlockType !== 'categories' && (
                                    <div>
                                        <h3 className="font-semibold text-gray-700 mb-2">Menu Items</h3>
                                        {Object.entries(
                                            menuItems.reduce((acc, item) => {
                                                const category = item.category || 'Uncategorized';
                                                if (!acc[category]) {
                                                    acc[category] = [];
                                                }
                                                acc[category].push(item);
                                                return acc;
                                            }, {})
                                        ).map(([category, items]) => (
                                            <div key={category} className="mb-4">
                                                <h4 className="text-sm font-medium text-gray-600 mb-2">{category}</h4>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {items.map((item) => (
                                                        <motion.button
                                                            key={item.id || item.itemId}
                                                            whileHover={{ scale: 1.02 }}
                                                            whileTap={{ scale: 0.98 }}
                                                            onClick={() => handleItemSelect({
                                                                id: item.id || item.itemId,
                                                                name: item.name,
                                                                price: parseFloat(item.price || 0),
                                                                isAvailable: item.isAvailable !== false
                                                            })}
                                                            className="p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-blue-500 transition-all flex items-center justify-between"
                                                        >
                                                            <div>
                                                                <div className="font-medium text-sm text-gray-900">{item.name}</div>
                                                                <div className="text-xs text-gray-500">${parseFloat(item.price || 0).toFixed(2)}</div>
                                                            </div>
                                                            <Plus className="w-5 h-5 text-gray-400" />
                                                        </motion.button>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Employee Quick Access Modal */}
            {showEmployeeAccess && (
                <EmployeeQuickAccess onClose={() => setShowEmployeeAccess(false)} />
            )}

            {/* Payment Modal */}
            {showPaymentModal && currentOrderData && (
                <PaymentModal
                    isOpen={showPaymentModal}
                    onClose={() => {
                        setShowPaymentModal(false);
                        if (window.confirm('Do you want to clear the current order?')) {
                            clearOrder();
                        }
                    }}
                    order={currentOrderData}
                    onPaymentComplete={handlePaymentComplete}
                />
            )}

            {/* Order Confirmation */}
            {orderConfirmation && (
                <OrderConfirmation
                    order={orderConfirmation.order}
                    payment={orderConfirmation.payment}
                    onClose={() => setOrderConfirmation(null)}
                />
            )}
        </div>
    );
};

export default POSSystem;
