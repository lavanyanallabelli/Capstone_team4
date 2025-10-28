import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../services/api';
import MenuDisplay from './MenuDisplay';
import OrderCart from './OrderCart';
import OrderTypes from './OrderTypes';
import OrderHistory from './OrderHistory';
import EmployeeQuickAccess from './EmployeeQuickAccess';
import {
    ShoppingCart,
    Clock,
    Users,
    DollarSign,
    Plus,
    Minus,
    Trash2,
    CheckCircle,
    X
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
    const [error, setError] = useState(null);
    const [showEmployeeAccess, setShowEmployeeAccess] = useState(false);

    // Load menu items and categories
    useEffect(() => {
        const loadMenuData = async () => {
            try {
                setLoading(true);
                const response = await apiService.getMenuItems();
                if (response.success) {
                    const items = response.data;
                    setMenuItems(items);

                    // Extract unique categories
                    const uniqueCategories = ['all', ...new Set(items.map(item => item.category))];
                    setCategories(uniqueCategories);
                }
            } catch (error) {
                console.error('Error loading menu:', error);
                setError('Failed to load menu items');
            } finally {
                setLoading(false);
            }
        };

        loadMenuData();
    }, []);

    // Filter menu items by category
    const filteredMenuItems = selectedCategory === 'all'
        ? menuItems
        : menuItems.filter(item => item.category === selectedCategory);

    // Add item to order
    const addToOrder = (item) => {
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
            setCurrentOrder(prev => [...prev, { ...item, quantity: 1 }]);
        }
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
    const orderTotal = currentOrder.reduce((total, item) => total + (item.price * item.quantity), 0);

    // Submit order
    const submitOrder = async () => {
        if (currentOrder.length === 0) {
            alert('Please add items to the order');
            return;
        }

        try {
            const orderData = {
                items: currentOrder,
                orderType,
                tableNumber: orderType === 'dine-in' ? tableNumber : null,
                customerName: orderType === 'delivery' ? customerName : null,
                total: orderTotal,
                status: 'pending',
                employeeId: currentUser?.sub,
                businessId: currentUser?.businessId,
                timestamp: new Date().toISOString()
            };

            const response = await apiService.createOrder(orderData);
            if (response.success) {
                alert('Order submitted successfully!');
                clearOrder();
            } else {
                alert('Failed to submit order');
            }
        } catch (error) {
            console.error('Error submitting order:', error);
            alert('Error submitting order');
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

    return (
        <div className="h-screen bg-gray-50 flex flex-col">
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
                            <span>{currentUser?.userRole === 'owner' ? 'Owner' : 'Employee'}</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Side - Menu */}
                <div className="w-2/3 bg-white border-r">
                    {/* Order Type Selection */}
                    <OrderTypes
                        orderType={orderType}
                        setOrderType={setOrderType}
                        tableNumber={tableNumber}
                        setTableNumber={setTableNumber}
                        customerName={customerName}
                        setCustomerName={setCustomerName}
                    />

                    {/* Category Filter */}
                    <div className="p-4 border-b">
                        <div className="flex space-x-2 overflow-x-auto">
                            {categories.map(category => (
                                <button
                                    key={category}
                                    onClick={() => setSelectedCategory(category)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${selectedCategory === category
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    {category === 'all' ? 'All Items' : category}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Menu Display */}
                    <MenuDisplay
                        items={filteredMenuItems}
                        onAddToOrder={addToOrder}
                    />
                </div>

                {/* Right Side - Order Cart */}
                <div className="w-1/3 bg-gray-50">
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

            {/* Employee Quick Access Modal */}
            {showEmployeeAccess && (
                <EmployeeQuickAccess onClose={() => setShowEmployeeAccess(false)} />
            )}
        </div>
    );
};

export default POSSystem;
