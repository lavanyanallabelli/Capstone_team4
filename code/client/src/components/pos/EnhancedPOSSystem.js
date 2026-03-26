import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import apiService from '../../services/api';
import { getCustomBlocks, saveCustomBlocks } from '../../services/posBlocksService';
import POSDashboard from './POSDashboard';
import MenuDisplay from './MenuDisplay';
import OrderCart from './OrderCart';
//import EnhancedMenuCategories from './EnhancedMenuCategories';
import OrderManagementPanel from './OrderManagementPanel';
import OrderTypes from './OrderTypes';
import PaymentModal from './PaymentModal';
import OrderConfirmation from './OrderConfirmation';
import OnlineOrders from './OnlineOrders';
import Reports from './Reports';
import ViewOrders from './ViewOrders';
import RefundModal from './RefundModal';
import {
    Users,
    ShoppingCart,
    Home,
    LogOut,
    Printer,
    Globe,
    Plus,
    X,
    Edit2
} from 'lucide-react';

const VIEWS = {
    DASHBOARD: 'dashboard',
    POS: 'pos',
    ONLINE_ORDERS: 'online-orders',
    REPORTS: 'reports',
    VIEW_ORDERS: 'view-orders'
};

const EnhancedPOSSystem = () => {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();

    // Check if user is manager or owner (employees can't access dashboard)
    const canAccessDashboard = currentUser?.userRole === 'manager' || currentUser?.userRole === 'owner';
    const defaultView = canAccessDashboard ? VIEWS.DASHBOARD : VIEWS.POS;
    const [currentView, setCurrentView] = useState(defaultView);

    // Menu & Order State
    const [menuItems, setMenuItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [currentOrder, setCurrentOrder] = useState([]);

    // Order Configuration
    const [orderType, setOrderType] = useState('to-go');
    const [tableNumber, setTableNumber] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');

    // Order Modifications
    const [discount, setDiscount] = useState({ type: null, value: 0 });
    const [tip, setTip] = useState({ type: null, value: 0 });
    const [serviceCharge, setServiceCharge] = useState(0);
    const [taxRate] = useState(0.08); // 8% default

    // UI State
    const [loading, setLoading] = useState(true);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [currentOrderData, setCurrentOrderData] = useState(null);
    const [orderConfirmation, setOrderConfirmation] = useState(null);
    // eslint-disable-next-line no-unused-vars
    const [splitBillOrders, setSplitBillOrders] = useState([]); // Set but not currently used in UI
    const [showRefundModal, setShowRefundModal] = useState(false);
    const [, setAvailabilityUpdateTime] = useState(Date.now());
    const [selectedPizzaItem, setSelectedPizzaItem] = useState(null);
    const [selectedOrderItemIds, setSelectedOrderItemIds] = useState(new Set());

    // Custom Blocks State - Load from database
    const [customBlocks, setCustomBlocks] = useState(null);
    const [blocksLoading, setBlocksLoading] = useState(true);
    
    // Selected modify items state (for modify category only)
    const [selectedModifyItems, setSelectedModifyItems] = useState(new Set());

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
                    categories: Array(9).fill(null),
                    modifyTop: Array(12).fill(null),
                    modifySizes: [
                        { id: 'size-small', name: 'Small', price: 0, isSize: true },
                        { id: 'size-medium', name: 'Medium', price: 0, isSize: true },
                        { id: 'size-large', name: 'Large', price: 0, isSize: true }
                    ],
                    modifyMiddle: Array(12).fill(null),
                    modifyBottom: Array(18).fill(null)
                });
            } finally {
                setBlocksLoading(false);
            }
        };

        loadBlocks();
    }, []);

    // Sync custom blocks to database whenever they change (only for owners)
    useEffect(() => {
        if (currentUser?.userRole === 'owner' && customBlocks && !blocksLoading) {
            saveCustomBlocks(customBlocks).catch(error => {
                console.error('Error saving custom blocks:', error);
            });
        }
    }, [customBlocks, currentUser?.userRole, blocksLoading]);

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

    // Clear selected modify items when switching away from modify category
    useEffect(() => {
        if (selectedCategory !== 'modify') {
            setSelectedModifyItems(new Set());
        }
    }, [selectedCategory]);

    // Modal state for selecting items
    const [showItemSelector, setShowItemSelector] = useState(false);
    const [selectedBlockType, setSelectedBlockType] = useState(null);
    const [selectedBlockIndex, setSelectedBlockIndex] = useState(null);

    // Redirect employees away from dashboard if they try to access it
    useEffect(() => {
        if (!canAccessDashboard && currentView === VIEWS.DASHBOARD) {
            setCurrentView(VIEWS.POS);
        }
    }, [canAccessDashboard, currentView]);

    // Load menu items and categories
    useEffect(() => {
        loadMenuData();
    }, []);

    // Update availability status every minute to reflect schedule changes
    useEffect(() => {
        if (currentView === VIEWS.POS) {
            const interval = setInterval(() => {
                // Update timestamp to trigger availability recalculation
                setAvailabilityUpdateTime(Date.now());
            }, 60000); // Update every minute

            return () => clearInterval(interval);
        }
    }, [currentView]);

    const loadMenuData = async () => {
        try {
            setLoading(true);
            const response = await apiService.getMenuItems();
            if (response.success) {
                const items = response.data;
                setMenuItems(items);

                // Extract and standardize categories
                const itemCategories = items.map(item => {
                    const cat = (item.category || item.tags?.[0] || 'all').toLowerCase();
                    if (cat.includes('starter') || cat.includes('appetizer')) return 'starters';
                    if (cat.includes('main')) return 'main course';
                    if (cat.includes('side') || cat.includes('extra')) return 'sides';
                    if (cat.includes('dessert')) return 'desserts';
                    if (cat.includes('beverage') || cat.includes('drink')) return 'beverages';
                    if (cat.includes('combo') || cat.includes('thali')) return 'combos';
                    if (cat.includes('add') || cat.includes('topping')) return 'add-ons';
                    return cat;
                });

                const uniqueCategories = ['all', ...new Set(itemCategories)];
                setCategories(uniqueCategories);
            }
        } catch (error) {
            console.error('Error loading menu:', error);
        } finally {
            setLoading(false);
        }
    };

    // Helper function to check if item is available based on schedule
    const checkItemAvailability = (item) => {
        // First check basic availability flag
        if (item.availability === false) {
            return false;
        }

        // If no schedule is set, item is available
        if (!item.availabilitySchedule || Object.keys(item.availabilitySchedule).length === 0) {
            return true;
        }

        const now = new Date();
        const currentDay = now.getDay(); // 0 = Sunday, 6 = Saturday
        const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
        const isWeekend = currentDay === 0 || currentDay === 6;
        const dayType = isWeekend ? 'weekends' : 'weekdays';

        const schedule = item.availabilitySchedule[dayType];
        if (!schedule || Object.keys(schedule).length === 0) {
            // If schedule exists but no schedule for this day type, check if any schedule exists
            // If there's a schedule for the other day type, assume not available (schedule is restrictive)
            const otherDayType = isWeekend ? 'weekdays' : 'weekends';
            if (item.availabilitySchedule[otherDayType]) {
                return false; // Schedule exists but not for this day type, so not available
            }
            return true; // No schedule at all for this day type, assume available
        }

        // Check if ANY meal period is enabled for this day type
        const mealPeriods = Object.keys(schedule);
        let hasAnyEnabledMeal = false;
        let isInEnabledMealPeriod = false;

        for (const meal of mealPeriods) {
            const mealSchedule = schedule[meal];
            if (mealSchedule && mealSchedule.enabled) {
                hasAnyEnabledMeal = true;
                const startTime = mealSchedule.start || '00:00';
                const endTime = mealSchedule.end || '23:59';

                // Check if current time is within this meal period
                if (currentTime >= startTime && currentTime <= endTime) {
                    isInEnabledMealPeriod = true;
                    break; // Found a match, no need to continue
                }
            }
        }

        // If schedule exists and has enabled meals, only available if current time matches
        if (hasAnyEnabledMeal) {
            return isInEnabledMealPeriod;
        }

        // If schedule exists but no meals are enabled, item is not available
        return false;
    };

    // Filter menu items by category and map availability
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
        // Debug: Log schedule info for items with schedules
        if (item.availabilitySchedule) {
            console.log(`[POS] Item "${item.name}":`, {
                schedule: item.availabilitySchedule,
                isAvailable,
                currentTime: new Date().toTimeString().slice(0, 5),
                dayType: (new Date().getDay() === 0 || new Date().getDay() === 6) ? 'weekends' : 'weekdays'
            });
        }
        return {
            ...item,
            isAvailable: isAvailable
        };
    });

    // Add item to order
    const addToOrder = (item) => {
        // Check if item is available before adding to cart
        if (item.isAvailable === false) {
            alert('This item is unavailable');
            return; // Prevent adding unavailable items
        }

        // If item has sizes enabled, show size selection instead of adding directly
        if (item.hasSizes && item.sizes && Object.keys(item.sizes).length > 0) {
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

    // Add all selected modify items to order
    const addSelectedModifyItemsToOrder = () => {
        if (!customBlocks || selectedModifyItems.size === 0) {
            alert('Please select items from modify sections');
            return;
        }

        const modifySections = ['modifyTop', 'modifySizes', 'modifyMiddle', 'modifyBottom'];
        let addedCount = 0;

        selectedModifyItems.forEach(itemKey => {
            const [blockType, blockIndexStr] = itemKey.split('-');
            const blockIndex = parseInt(blockIndexStr, 10);
            
            if (modifySections.includes(blockType) && customBlocks[blockType] && customBlocks[blockType][blockIndex]) {
                const item = customBlocks[blockType][blockIndex];
                addToOrder(item);
                addedCount++;
            }
        });

        if (addedCount > 0) {
            // Clear selections after adding
            setSelectedModifyItems(new Set());
        }
    };

    // Handle block click - open selector if empty, add to order if filled
    const handleBlockClick = (blockType, blockIndex, isEdit = false) => {
        if (!customBlocks) return;
        const block = customBlocks[blockType][blockIndex];
        if (!block || isEdit) {
            // Block is empty or edit mode - open selector
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
            } else if (selectedCategory === 'modify' && (blockType === 'modifyTop' || blockType === 'modifyMiddle' || blockType === 'modifyBottom' || blockType === 'modifySizes')) {
                // In modify category - toggle selection instead of immediately adding
                const itemKey = `${blockType}-${blockIndex}`;
                setSelectedModifyItems(prev => {
                    const newSet = new Set(prev);
                    if (newSet.has(itemKey)) {
                        newSet.delete(itemKey);
                    } else {
                        newSet.add(itemKey);
                    }
                    return newSet;
                });
            } else {
                // Regular item - add to order
                addToOrder(block);
            }
        }
    };

    // Clear block item
    const handleClearBlock = (blockType, blockIndex, e) => {
        e.stopPropagation(); // Prevent triggering block click
        setCustomBlocks(prev => {
            const newBlocks = { ...prev };
            newBlocks[blockType] = [...newBlocks[blockType]];
            newBlocks[blockType][blockIndex] = null;
            return newBlocks;
        });
    };
    console.log('handleClearBlock', handleClearBlock);

    // Handle item selection from modal
    const handleItemSelect = (item) => {
        if (selectedBlockType && selectedBlockIndex !== null) {
            setCustomBlocks(prev => {
                const newBlocks = { ...prev };
                newBlocks[selectedBlockType] = [...newBlocks[selectedBlockType]];
                newBlocks[selectedBlockType][selectedBlockIndex] = item;
                return newBlocks;
            });
        }
        setShowItemSelector(false);
        setSelectedBlockType(null);
        setSelectedBlockIndex(null);
    };

    // Handle category or modify selection
    const handleCategoryOrModifySelect = (type, value) => {
        if (selectedBlockType && selectedBlockIndex !== null) {
            // Store category/modify as a special item
            const categoryItem = {
                id: `category-${value}`,
                name: type === 'category' ? value : 'Modify',
                price: 0,
                isAvailable: true,
                isCategory: type === 'category',
                isModify: type === 'modify',
                categoryValue: value
            };

            setCustomBlocks(prev => {
                const newBlocks = { ...prev };
                newBlocks[selectedBlockType] = [...newBlocks[selectedBlockType]];
                newBlocks[selectedBlockType][selectedBlockIndex] = categoryItem;
                return newBlocks;
            });
        }
        setShowItemSelector(false);
        setSelectedBlockType(null);
        setSelectedBlockIndex(null);
    };

    // Add item with selected size
    const addPizzaWithSize = (size) => {
        if (!selectedPizzaItem) return;

        // Get size configuration from item or use default pricing
        let sizePrice = selectedPizzaItem.price;
        let sizeName = size.charAt(0).toUpperCase() + size.slice(1);

        if (selectedPizzaItem.sizes && selectedPizzaItem.sizes[size]) {
            sizePrice = selectedPizzaItem.sizes[size].price;
            sizeName = selectedPizzaItem.sizes[size].name || sizeName;
        } else {
            // Fallback to percentage-based pricing if sizes not configured
            const sizePrices = {
                'small': selectedPizzaItem.price * 0.8, // 80% of base price
                'medium': selectedPizzaItem.price, // 100% of base price
                'large': selectedPizzaItem.price * 1.2 // 120% of base price
            };
            sizePrice = sizePrices[size] || selectedPizzaItem.price;
        }

        const itemWithSize = {
            ...selectedPizzaItem,
            id: `${selectedPizzaItem.id}-${size}`,
            name: `${selectedPizzaItem.name} (${sizeName})`,
            size: size,
            price: sizePrice,
            quantity: 1
        };

        const existingItem = currentOrder.find(orderItem => orderItem.id === itemWithSize.id);
        if (existingItem) {
            setCurrentOrder(prev =>
                prev.map(orderItem =>
                    orderItem.id === itemWithSize.id
                        ? { ...orderItem, quantity: orderItem.quantity + 1 }
                        : orderItem
                )
            );
        } else {
            setCurrentOrder(prev => [...prev, itemWithSize]);
        }

        setSelectedPizzaItem(null); // Clear selection after adding
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

    // Remove multiple items from order
    const removeSelectedItems = () => {
        if (selectedOrderItemIds.size === 0) {
            alert('Please select items to remove');
            return;
        }
        setCurrentOrder(prev => prev.filter(item => !selectedOrderItemIds.has(item.id)));
        setSelectedOrderItemIds(new Set());
    };

    // Clear entire order
    const clearOrder = () => {
        setCurrentOrder([]);
        setTableNumber('');
        setCustomerName('');
        setCustomerPhone('');
        setDiscount({ type: null, value: 0 });
        setTip({ type: null, value: 0 });
        setServiceCharge(0);
    };

    // Calculate order totals
    const calculateTotals = () => {
        const subtotal = currentOrder.reduce((total, item) =>
            total + (parseFloat(item.price || 0) * item.quantity), 0
        );

        // Apply discount
        let discountAmount = 0;
        if (discount.type === 'percentage') {
            discountAmount = subtotal * (discount.value / 100);
        } else if (discount.type === 'fixed') {
            discountAmount = discount.value;
        }

        const afterDiscount = Math.max(0, subtotal - discountAmount);

        // Apply service charge
        const serviceChargeAmount = afterDiscount * (serviceCharge / 100);

        // Apply tax
        const taxAmount = (afterDiscount + serviceChargeAmount) * taxRate;

        // Apply tip
        let tipAmount = 0;
        if (tip.type === 'percentage') {
            tipAmount = (afterDiscount + serviceChargeAmount + taxAmount) * (tip.value / 100);
        } else if (tip.type === 'fixed') {
            tipAmount = tip.value;
        }

        const finalTotal = afterDiscount + serviceChargeAmount + taxAmount + tipAmount;

        return {
            subtotal,
            discountAmount,
            afterDiscount,
            serviceChargeAmount,
            taxAmount,
            tipAmount,
            finalTotal
        };
    };

    const totals = calculateTotals();

    // Order Management Functions
    const handleApplyDiscount = (discountData) => {
        setDiscount(discountData);
    };

    const handleAddTip = (tipData) => {
        setTip(tipData);
    };

    const handleSplitBill = () => {
        if (currentOrder.length === 0) {
            alert('No items to split');
            return;
        }
        // Simple split: divide items equally into two orders
        const midPoint = Math.ceil(currentOrder.length / 2);
        const order1 = currentOrder.slice(0, midPoint);
        const order2 = currentOrder.slice(midPoint);
        setSplitBillOrders([order1, order2]);
        alert(`Bill split into ${order1.length} and ${order2.length} items. You can process them separately.`);
    };

    const handleCancelOrder = () => {
        clearOrder();
    };

    const handleModifyOrder = () => {
        // Enable editing mode (already available through quantity controls)
        alert('You can modify items using the quantity controls in the cart');
    };

    // Handle "Add to Order" button click
    const handleAddToOrder = () => {
        if (selectedCategory === 'modify') {
            // In modify category - add selected modify items to cart
            addSelectedModifyItemsToOrder();
        } else {
            // Normal flow - submit the order
            submitOrder();
        }
    };

    // Submit order
    const submitOrder = async () => {
        if (currentOrder.length === 0) {
            alert('Please add items to the order');
            return;
        }

        if (orderType === 'pickup' && !customerName) {
            alert('Please enter customer name');
            return;
        }

        try {
            const orderData = {
                items: currentOrder,
                orderType,
                tableNumber: null,
                customerName: orderType === 'pickup' ? customerName : null,
                customerPhone: customerPhone || null,
                total: totals.subtotal,
                discountAmount: totals.discountAmount,
                serviceCharge: totals.serviceChargeAmount,
                tax: totals.taxAmount,
                tip: totals.tipAmount,
                finalTotal: totals.finalTotal,
                status: 'pending',
                employeeId: currentUser?.sub,
                businessId: currentUser?.businessId,
                timestamp: new Date().toISOString()
            };

            const response = await apiService.createOrder(orderData);
            if (response.success) {
                const createdOrder = {
                    ...response.data,
                    ...totals
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

                // Dispatch event to notify Dashboard to refresh analytics
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

    // Print bill
    const handlePrintBill = () => {
        if (!currentOrderData && !orderConfirmation) {
            alert('No order to print');
            return;
        }

        const orderToPrint = orderConfirmation?.order || currentOrderData;
        const printWindow = window.open('', '_blank');
        const printContent = `
            <html>
                <head>
                    <title>Bill - Order ${orderToPrint.orderNumber || orderToPrint.id}</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 20px; }
                        .header { text-align: center; margin-bottom: 20px; }
                        .order-info { margin-bottom: 20px; }
                        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                        th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
                        .total { font-weight: bold; font-size: 18px; }
                        .footer { text-align: center; margin-top: 20px; color: #666; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>${currentUser?.businessName || 'Restaurant'}</h1>
                        <p>Order #${orderToPrint.orderNumber || orderToPrint.id}</p>
                        <p>${new Date(orderToPrint.orderDate || orderToPrint.createdAt).toLocaleString()}</p>
                    </div>
                    <div class="order-info">
                        <p><strong>Order Type:</strong> ${orderToPrint.orderType || 'Dine-In'}</p>
                        ${orderToPrint.tableNumber ? `<p><strong>Table:</strong> ${orderToPrint.tableNumber}</p>` : ''}
                        ${orderToPrint.customerName ? `<p><strong>Customer:</strong> ${orderToPrint.customerName}</p>` : ''}
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>Item</th>
                                <th>Qty</th>
                                <th>Price</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${(orderToPrint.items || []).map(item => `
                                <tr>
                                    <td>${item.name}</td>
                                    <td>${item.quantity}</td>
                                    <td>$${parseFloat(item.price || 0).toFixed(2)}</td>
                                    <td>$${(parseFloat(item.price || 0) * item.quantity).toFixed(2)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    <div>
                        <p>Subtotal: $${parseFloat(orderToPrint.totalAmount || orderToPrint.total || 0).toFixed(2)}</p>
                        ${orderToPrint.discountAmount ? `<p>Discount: -$${parseFloat(orderToPrint.discountAmount).toFixed(2)}</p>` : ''}
                        ${orderToPrint.serviceCharge ? `<p>Service Charge: $${parseFloat(orderToPrint.serviceCharge).toFixed(2)}</p>` : ''}
                        ${orderToPrint.tax ? `<p>Tax: $${parseFloat(orderToPrint.tax).toFixed(2)}</p>` : ''}
                        ${orderToPrint.tip ? `<p>Tip: $${parseFloat(orderToPrint.tip).toFixed(2)}</p>` : ''}
                        <p class="total">Total: $${parseFloat(orderToPrint.finalTotal || orderToPrint.totalAmount || 0).toFixed(2)}</p>
                    </div>
                    <div class="footer">
                        <p>Thank you for your visit!</p>
                    </div>
                </body>
            </html>
        `;
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.print();
    };

    if (loading && currentView === VIEWS.POS) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading POS System...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <div className="bg-white shadow-sm border-b px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        {canAccessDashboard && (
                            <button
                                onClick={() => setCurrentView(VIEWS.DASHBOARD)}
                                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${currentView === VIEWS.DASHBOARD
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                <Home className="w-4 h-4" />
                                <span>Dashboard</span>
                            </button>
                        )}
                        <button
                            onClick={() => setCurrentView(VIEWS.POS)}
                            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${currentView === VIEWS.POS
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            <ShoppingCart className="w-4 h-4" />
                            <span>New Order</span>
                        </button>
                        <button
                            onClick={() => setCurrentView(VIEWS.ONLINE_ORDERS)}
                            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${currentView === VIEWS.ONLINE_ORDERS
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            <Globe className="w-4 h-4" />
                            <span>Online Orders</span>
                        </button>
                        {orderConfirmation && (
                            <button
                                onClick={handlePrintBill}
                                className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                            >
                                <Printer className="w-4 h-4" />
                                <span>Print Bill</span>
                            </button>
                        )}
                    </div>

                    <div className="flex items-center space-x-4">
                        <div className="text-right">
                            <p className="text-sm text-gray-500">Current Time</p>
                            <p className="text-lg font-semibold">{new Date().toLocaleTimeString()}</p>
                        </div>
                        <div className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-lg">
                            <Users className="w-4 h-4" />
                            <span>{currentUser?.userRole === 'owner' ? 'Owner' : currentUser?.userRole === 'manager' ? 'Manager' : 'Employee'}</span>
                        </div>
                        <button
                            onClick={() => {
                                if (window.confirm('Are you sure you want to logout?')) {
                                    logout();
                                    navigate('/');
                                }
                            }}
                            className="flex items-center space-x-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
                        >
                            <LogOut className="w-4 h-4" />
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            {currentView === VIEWS.DASHBOARD ? (
                <POSDashboard
                    onNewOrder={() => setCurrentView(VIEWS.POS)}
                    onViewReports={() => setCurrentView(VIEWS.REPORTS)}
                    onViewOrders={() => setCurrentView(VIEWS.VIEW_ORDERS)}
                    onRefund={() => setShowRefundModal(true)}
                />
            ) : currentView === VIEWS.ONLINE_ORDERS ? (
                <OnlineOrders />
            ) : currentView === VIEWS.REPORTS ? (
                <Reports onClose={() => setCurrentView(canAccessDashboard ? VIEWS.DASHBOARD : VIEWS.POS)} />
            ) : currentView === VIEWS.VIEW_ORDERS ? (
                <ViewOrders onClose={() => setCurrentView(canAccessDashboard ? VIEWS.DASHBOARD : VIEWS.POS)} />
            ) : (
                <div className="flex-1 flex overflow-hidden">
                    {/* Left Side - Menu Items */}
                    <div className="flex-1 flex flex-col bg-white border-r">
                        {/* Modify View or Menu Display */}
                        {selectedCategory === 'modify' ? (
                            <div className="flex-1 overflow-y-auto p-4">
                                {/* Top Section - 12 blocks in 2 rows */}
                                {customBlocks && customBlocks.modifyTop && (
                                    <div className="mb-8">
                                        <div className="grid grid-cols-6 gap-2">
                                            {customBlocks.modifyTop.map((block, index) => {
                                                const itemKey = `modifyTop-${index}`;
                                                const isSelected = selectedModifyItems.has(itemKey);
                                                return (
                                                    <motion.button
                                                        key={`modify-top-${index}`}
                                                        whileHover={{ scale: 1.02 }}
                                                        whileTap={{ scale: 0.98 }}
                                                        onClick={() => handleBlockClick('modifyTop', index)}
                                                        className={`p-2 h-16 rounded-lg shadow-sm border-2 cursor-pointer transition-all relative ${
                                                            isSelected 
                                                                ? 'border-blue-500 bg-blue-50' 
                                                                : 'border-gray-200 bg-white hover:shadow-md'
                                                        }`}
                                                    >
                                                        {block ? (
                                                            <>
                                                                <h3 className={`font-semibold text-sm text-center pr-5 ${
                                                                    isSelected ? 'text-blue-900' : 'text-gray-900'
                                                                }`}>
                                                                    {block.name}
                                                                </h3>
                                                                {currentUser?.userRole === 'owner' && (
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleClearBlock('modifyTop', index, e);
                                                                        }}
                                                                        className="absolute top-1 right-1 p-1 rounded hover:bg-gray-200 transition-colors"
                                                                        title="Clear"
                                                                    >
                                                                        <X className="w-3 h-3 text-gray-500" />
                                                                    </button>
                                                                )}
                                                            </>
                                                        ) : (
                                                            <Plus className="w-4 h-4 mx-auto text-gray-400" />
                                                        )}
                                                    </motion.button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Size Section - 3 blocks (Small, Medium, Large) */}
                                {customBlocks && customBlocks.modifySizes && (
                                    <div className="mb-8">
                                        <div className="flex justify-center">
                                            <div className="grid grid-cols-3 gap-2 max-w-md">
                                                {customBlocks.modifySizes.map((block, index) => {
                                                    const itemKey = `modifySizes-${index}`;
                                                    const isSelected = selectedModifyItems.has(itemKey);
                                                    return (
                                                        <motion.button
                                                            key={`modify-size-${index}`}
                                                            whileHover={{ scale: 1.02 }}
                                                            whileTap={{ scale: 0.98 }}
                                                            onClick={() => handleBlockClick('modifySizes', index)}
                                                            className={`p-2 h-10 rounded-lg shadow-sm border-2 cursor-pointer transition-all relative ${
                                                                isSelected 
                                                                    ? 'border-blue-500 bg-blue-50' 
                                                                    : 'border-gray-200 bg-white hover:shadow-md'
                                                            }`}
                                                        >
                                                            {block ? (
                                                                <>
                                                                    <h3 className={`font-semibold text-sm text-center ${
                                                                        isSelected ? 'text-blue-900' : 'text-gray-900'
                                                                    }`}>
                                                                        {block.name}
                                                                    </h3>
                                                                </>
                                                            ) : (
                                                                <Plus className="w-4 h-4 mx-auto text-gray-400" />
                                                            )}
                                                        </motion.button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Middle Section - 12 blocks in 2 rows */}
                                {customBlocks && customBlocks.modifyMiddle && (
                                    <div className="mb-8">
                                        <div className="grid grid-cols-6 gap-2">
                                            {customBlocks.modifyMiddle.map((block, index) => {
                                                const itemKey = `modifyMiddle-${index}`;
                                                const isSelected = selectedModifyItems.has(itemKey);
                                                return (
                                                    <motion.button
                                                        key={`modify-middle-${index}`}
                                                        whileHover={{ scale: 1.02 }}
                                                        whileTap={{ scale: 0.98 }}
                                                        onClick={() => handleBlockClick('modifyMiddle', index)}
                                                        className={`p-2 h-12 rounded-lg shadow-sm border-2 cursor-pointer transition-all relative ${
                                                            isSelected 
                                                                ? 'border-blue-500 bg-blue-50' 
                                                                : 'border-gray-200 bg-white hover:shadow-md'
                                                        }`}
                                                    >
                                                        {block ? (
                                                            <>
                                                                <h3 className={`font-semibold text-sm text-center pr-5 ${
                                                                    isSelected ? 'text-blue-900' : 'text-gray-900'
                                                                }`}>
                                                                    {block.name}
                                                                </h3>
                                                                {currentUser?.userRole === 'owner' && (
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleClearBlock('modifyMiddle', index, e);
                                                                        }}
                                                                        className="absolute top-1 right-1 p-1 rounded hover:bg-gray-200 transition-colors"
                                                                        title="Clear"
                                                                    >
                                                                        <X className="w-3 h-3 text-gray-500" />
                                                                    </button>
                                                                )}
                                                            </>
                                                        ) : (
                                                            <Plus className="w-4 h-4 mx-auto text-gray-400" />
                                                        )}
                                                    </motion.button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Bottom Section - 18 blocks in 3 rows (12 + 6 with gap) */}
                                {customBlocks && customBlocks.modifyBottom && (
                                    <div>
                                        {/* First 2 rows - 12 blocks */}
                                        <div className="grid grid-cols-6 gap-2 mb-8">
                                            {customBlocks.modifyBottom.slice(0, 12).map((block, index) => {
                                                const itemKey = `modifyBottom-${index}`;
                                                const isSelected = selectedModifyItems.has(itemKey);
                                                return (
                                                    <motion.button
                                                        key={`modify-bottom-${index}`}
                                                        whileHover={{ scale: 1.02 }}
                                                        whileTap={{ scale: 0.98 }}
                                                        onClick={() => handleBlockClick('modifyBottom', index)}
                                                        className={`p-2 h-12 rounded-lg shadow-sm border-2 cursor-pointer transition-all relative ${
                                                            isSelected 
                                                                ? 'border-blue-500 bg-blue-50' 
                                                                : 'border-gray-200 bg-white hover:shadow-md'
                                                        }`}
                                                    >
                                                        {block ? (
                                                            <>
                                                                <h3 className={`font-semibold text-sm text-center pr-5 ${
                                                                    isSelected ? 'text-blue-900' : 'text-gray-900'
                                                                }`}>
                                                                    {block.name}
                                                                </h3>
                                                                {currentUser?.userRole === 'owner' && (
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleClearBlock('modifyBottom', index, e);
                                                                        }}
                                                                        className="absolute top-1 right-1 p-1 rounded hover:bg-gray-200 transition-colors"
                                                                        title="Clear"
                                                                    >
                                                                        <X className="w-3 h-3 text-gray-500" />
                                                                    </button>
                                                                )}
                                                            </>
                                                        ) : (
                                                            <Plus className="w-4 h-4 mx-auto text-gray-400" />
                                                        )}
                                                    </motion.button>
                                                );
                                            })}
                                        </div>
                                        {/* Last row - 6 blocks */}
                                        <div className="grid grid-cols-6 gap-2">
                                            {customBlocks.modifyBottom.slice(12, 18).map((block, index) => {
                                                const itemKey = `modifyBottom-${index + 12}`;
                                                const isSelected = selectedModifyItems.has(itemKey);
                                                return (
                                                    <motion.button
                                                        key={`modify-bottom-${index + 12}`}
                                                        whileHover={{ scale: 1.02 }}
                                                        whileTap={{ scale: 0.98 }}
                                                        onClick={() => handleBlockClick('modifyBottom', index + 12)}
                                                        className={`p-2 h-12 rounded-lg shadow-sm border-2 cursor-pointer transition-all relative ${
                                                            isSelected 
                                                                ? 'border-blue-500 bg-blue-50' 
                                                                : 'border-gray-200 bg-white hover:shadow-md'
                                                        }`}
                                                    >
                                                        {block ? (
                                                            <>
                                                                <h3 className={`font-semibold text-sm text-center pr-5 ${
                                                                    isSelected ? 'text-blue-900' : 'text-gray-900'
                                                                }`}>
                                                                    {block.name}
                                                                </h3>
                                                                {currentUser?.userRole === 'owner' && (
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleClearBlock('modifyBottom', index + 12, e);
                                                                        }}
                                                                        className="absolute top-1 right-1 p-1 rounded hover:bg-gray-200 transition-colors"
                                                                        title="Clear"
                                                                    >
                                                                        <X className="w-3 h-3 text-gray-500" />
                                                                    </button>
                                                                )}
                                                            </>
                                                        ) : (
                                                            <Plus className="w-4 h-4 mx-auto text-gray-400" />
                                                        )}
                                                    </motion.button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
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

                        {/* Size Selection - Show when item with sizes is selected */}
                        {selectedPizzaItem && selectedPizzaItem.sizes && (
                            <div className="px-4 pb-2 border-t border-gray-200 bg-blue-50">
                                <div className="pt-2">
                                    <div className={`grid gap-2 ${Object.keys(selectedPizzaItem.sizes).length === 1 ? 'grid-cols-2' : Object.keys(selectedPizzaItem.sizes).length === 2 ? 'grid-cols-3' : 'grid-cols-4'}`}>
                                        {Object.keys(selectedPizzaItem.sizes).map((sizeKey) => {
                                            const sizeConfig = selectedPizzaItem.sizes[sizeKey];
                                            return (
                                                <motion.button
                                                    key={sizeKey}
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    onClick={() => addPizzaWithSize(sizeKey)}
                                                    className="p-3 rounded-lg shadow-sm border-2 border-blue-300 bg-white hover:bg-blue-100 hover:border-blue-500 cursor-pointer transition-all"
                                                >
                                                    <h3 className="font-semibold text-sm text-center text-gray-900">
                                                        {sizeConfig.name || sizeKey.charAt(0).toUpperCase() + sizeKey.slice(1)}
                                                    </h3>
                                                </motion.button>
                                            );
                                        })}
                                        {/* Cancel Button */}
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => setSelectedPizzaItem(null)}
                                            className="p-3 rounded-lg shadow-sm border-2 border-red-300 bg-white hover:bg-red-100 hover:border-red-500 cursor-pointer transition-all"
                                        >
                                            <h3 className="font-semibold text-sm text-center text-red-600">
                                                Cancel
                                            </h3>
                                        </motion.button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Constant Blocks - Hide when "all items" or "modify" is selected */}
                        {selectedCategory !== 'all' && selectedCategory !== 'modify' && customBlocks && (
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
                                                        {currentUser?.userRole === 'owner' && (
                                                            <button
                                                                onClick={(e) => handleBlockClick('proteinTop', index, true)}
                                                                className="absolute top-1 right-1 p-1 rounded hover:bg-gray-200 transition-colors"
                                                                title="Edit"
                                                            >
                                                                <Edit2 className="w-3 h-3 text-gray-600" />
                                                            </button>
                                                        )}
                                                    </>
                                                ) : (
                                                    <Plus className="w-5 h-5 mx-auto text-gray-400" />
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
                                                        {currentUser?.userRole === 'owner' && (
                                                            <button
                                                                onClick={(e) => handleBlockClick('protein', index, true)}
                                                                className="absolute top-1 right-1 p-1 rounded hover:bg-gray-200 transition-colors"
                                                                title="Edit"
                                                            >
                                                                <Edit2 className="w-3 h-3 text-gray-600" />
                                                            </button>
                                                        )}
                                                    </>
                                                ) : (
                                                    <Plus className="w-5 h-5 mx-auto text-gray-400" />
                                                )}
                                            </motion.button>
                                        ))}
                                        <div></div>
                                    </div>
                                </div>

                                {/* Toppings Blocks - Above Extra Protein blocks */}
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
                                                        {currentUser?.userRole === 'owner' && (
                                                            <button
                                                                onClick={(e) => handleBlockClick('toppings', index, true)}
                                                                className="absolute top-1 right-1 p-1 rounded hover:bg-gray-200 transition-colors"
                                                                title="Edit"
                                                            >
                                                                <Edit2 className="w-3 h-3 text-gray-600" />
                                                            </button>
                                                        )}
                                                    </>
                                                ) : (
                                                    <Plus className="w-5 h-5 mx-auto text-gray-400" />
                                                )}
                                            </motion.button>
                                        ))}
                                    </div>
                                </div>

                                {/* Extra Protein Blocks - Below menu items, above snacks */}
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
                                                        {currentUser?.userRole === 'owner' && (
                                                            <button
                                                                onClick={(e) => handleBlockClick('extraProtein', index, true)}
                                                                className="absolute top-1 right-1 p-1 rounded hover:bg-gray-200 transition-colors"
                                                                title="Edit"
                                                            >
                                                                <Edit2 className="w-3 h-3 text-gray-600" />
                                                            </button>
                                                        )}
                                                    </>
                                                ) : (
                                                    <Plus className="w-5 h-5 mx-auto text-gray-400" />
                                                )}
                                            </motion.button>
                                        ))}
                                    </div>
                                </div>

                                {/* Snack Blocks - Below menu items, above drinks */}
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
                                                        {currentUser?.userRole === 'owner' && (
                                                            <button
                                                                onClick={(e) => handleBlockClick('snacks', index, true)}
                                                                className="absolute top-1 right-1 p-1 rounded hover:bg-gray-200 transition-colors"
                                                                title="Edit"
                                                            >
                                                                <Edit2 className="w-3 h-3 text-gray-600" />
                                                            </button>
                                                        )}
                                                    </>
                                                ) : (
                                                    <Plus className="w-5 h-5 mx-auto text-gray-400" />
                                                )}
                                            </motion.button>
                                        ))}
                                    </div>
                                </div>

                                {/* Drink Blocks - Below menu items */}
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
                                                        {currentUser?.userRole === 'owner' && (
                                                            <button
                                                                onClick={(e) => handleBlockClick('drinks', index, true)}
                                                                className="absolute top-1 right-1 p-1 rounded hover:bg-gray-200 transition-colors"
                                                                title="Edit"
                                                            >
                                                                <Edit2 className="w-3 h-3 text-gray-600" />
                                                            </button>
                                                        )}
                                                    </>
                                                ) : (
                                                    <Plus className="w-5 h-5 mx-auto text-gray-400" />
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
                            customerPhone={customerPhone}
                            setCustomerPhone={setCustomerPhone}
                            onSubmitOrder={handleAddToOrder}
                            selectedCategory={selectedCategory}
                        />
                    </div>

                    {/* Middle - Category Sidebar - Vertical blocks between menu and order */}
                    <div className="w-40 bg-white border-l border-r border-gray-200 flex flex-col overflow-y-auto p-2 gap-2">
                        {customBlocks && customBlocks.categories ? customBlocks.categories.map((block, index) => {
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
                                            {currentUser?.userRole === 'owner' && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleBlockClick('categories', index, true);
                                                    }}
                                                    className="absolute top-1 right-1 p-1 rounded hover:bg-gray-200 transition-colors z-20"
                                                    title="Edit"
                                                >
                                                    <Edit2 className="w-3 h-3 text-gray-600" />
                                                </button>
                                            )}
                                        </>
                                    ) : (
                                        <Plus className="w-5 h-5 mx-auto text-gray-400" />
                                    )}
                                </motion.button>
                            );
                        }) : Array(9).fill(null).map((_, index) => (
                            <motion.button
                                key={`category-placeholder-${index}`}
                                className="w-full px-4 py-4 text-left font-bold text-sm uppercase tracking-wide transition-all relative rounded-lg border-2 bg-white text-black border-gray-300"
                                disabled
                            >
                                <Plus className="w-5 h-5 mx-auto text-gray-400" />
                            </motion.button>
                        ))}
                    </div>

                    {/* Right Side - Order Cart */}
                    <div className="w-1/4 bg-gray-50 flex flex-col">
                        <div className="flex-1 overflow-y-auto">
                            <OrderCart
                                order={currentOrder}
                                orderType={orderType}
                                tableNumber={tableNumber}
                                customerName={customerName}
                                total={totals.subtotal}
                                discount={totals.discountAmount}
                                serviceCharge={totals.serviceChargeAmount}
                                tax={totals.taxAmount}
                                tip={totals.tipAmount}
                                finalTotal={totals.finalTotal}
                                onUpdateQuantity={updateQuantity}
                                onRemoveItem={removeFromOrder}
                                onRemoveSelectedItems={removeSelectedItems}
                                onClearOrder={clearOrder}
                                onSubmitOrder={submitOrder}
                                selectedItemIds={selectedOrderItemIds}
                                onSelectItem={setSelectedOrderItemIds}
                            />
                        </div>

                        {/* Order Management Panel */}
                        {currentOrder.length > 0 && (
                            <OrderManagementPanel
                                order={currentOrder}
                                onModifyOrder={handleModifyOrder}
                                onSplitBill={handleSplitBill}
                                onApplyDiscount={handleApplyDiscount}
                                onAddTip={handleAddTip}
                                onApplyTax={() => alert('Tax is automatically calculated')}
                                onCancelOrder={handleCancelOrder}
                                onRefreshOrder={loadMenuData}
                                onNewOrder={clearOrder}
                                selectedItemIds={selectedOrderItemIds}
                                onRemoveItem={(itemId) => {
                                    removeFromOrder(itemId);
                                    setSelectedOrderItemIds(prev => {
                                        const newSet = new Set(prev);
                                        newSet.delete(itemId);
                                        return newSet;
                                    });
                                }}
                            />
                        )}
                    </div>
                </div>
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
                    onPrint={handlePrintBill}
                />
            )}

            {/* Item Selector Modal */}
            {showItemSelector && (
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

            {/* Refund Modal */}
            <RefundModal
                isOpen={showRefundModal}
                onClose={() => setShowRefundModal(false)}
                onRefundComplete={(refundData) => {
                    console.log('Refund completed:', refundData);
                    setShowRefundModal(false);
                    // Refresh dashboard if on dashboard view
                    if (currentView === VIEWS.DASHBOARD) {
                        window.location.reload(); // Simple refresh
                    }
                }}
            />
        </div>
    );
};

export default EnhancedPOSSystem;


