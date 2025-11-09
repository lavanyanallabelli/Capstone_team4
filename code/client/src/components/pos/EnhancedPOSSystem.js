import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import apiService from '../../services/api';
import POSDashboard from './POSDashboard';
import MenuDisplay from './MenuDisplay';
import OrderCart from './OrderCart';
import EnhancedMenuCategories from './EnhancedMenuCategories';
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
    Globe
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
    const [orderType, setOrderType] = useState('dine-in');
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
            const itemCat = (item.category || item.tags?.[0] || '').toLowerCase();
            if (selectedCategory === 'starters') return itemCat.includes('starter') || itemCat.includes('appetizer');
            if (selectedCategory === 'main course') return itemCat.includes('main');
            if (selectedCategory === 'sides') return itemCat.includes('side') || itemCat.includes('extra');
            if (selectedCategory === 'desserts') return itemCat.includes('dessert');
            if (selectedCategory === 'beverages') return itemCat.includes('beverage') || itemCat.includes('drink');
            if (selectedCategory === 'combos') return itemCat.includes('combo') || itemCat.includes('thali');
            if (selectedCategory === 'add-ons') return itemCat.includes('add') || itemCat.includes('topping');
            return itemCat === selectedCategory;
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
        // Check if item is available (allow adding even if marked unavailable in POS)
        // But we'll still respect the availability flag for display
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

        if (orderType === 'pickup' && !customerName) {
            alert('Please enter customer name');
            return;
        }

        try {
            const orderData = {
                items: currentOrder,
                orderType,
                tableNumber: orderType === 'dine-in' ? tableNumber : null,
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
                    {/* Left Side - Menu */}
                    <div className="w-2/3 bg-white border-r flex flex-col">
                        {/* Order Type Selection */}
                        <OrderTypes
                            orderType={orderType}
                            setOrderType={setOrderType}
                            tableNumber={tableNumber}
                            setTableNumber={setTableNumber}
                            customerName={customerName}
                            setCustomerName={setCustomerName}
                            customerPhone={customerPhone}
                            setCustomerPhone={setCustomerPhone}
                        />

                        {/* Enhanced Category Filter */}
                        <EnhancedMenuCategories
                            categories={categories}
                            selectedCategory={selectedCategory}
                            onSelectCategory={setSelectedCategory}
                        />

                        {/* Menu Display */}
                        <div className="flex-1 overflow-y-auto">
                            <MenuDisplay
                                items={filteredMenuItems}
                                onAddToOrder={addToOrder}
                            />
                        </div>
                    </div>

                    {/* Right Side - Order Cart */}
                    <div className="w-1/3 bg-gray-50 flex flex-col">
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
                                onClearOrder={clearOrder}
                                onSubmitOrder={submitOrder}
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


