// User Roles and Permissions Configuration
export const USER_ROLES = {
    OWNER: 'owner',        // Business Owner - Full control over POS system
    EMPLOYEE: 'employee'   // Employee - Limited operational tasks
};

export const PERMISSIONS = {
    // User Management (Owner only)
    CAN_CREATE_EMPLOYEE: 'canCreateEmployee',
    CAN_EDIT_EMPLOYEE: 'canEditEmployee',
    CAN_DEACTIVATE_EMPLOYEE: 'canDeactivateEmployee',
    CAN_VIEW_EMPLOYEE_ACTIVITY: 'canViewEmployeeActivity',

    // Menu Management (Owner only)
    CAN_MANAGE_MENU_ITEMS: 'canManageMenuItems',
    CAN_MANAGE_MENU_CATEGORIES: 'canManageMenuCategories',
    CAN_TOGGLE_ITEM_AVAILABILITY: 'canToggleItemAvailability',

    // Order Management
    CAN_VIEW_ALL_ORDERS: 'canViewAllOrders',
    CAN_UPDATE_ORDERS: 'canUpdateOrders',
    CAN_CANCEL_ORDERS: 'canCancelOrders',
    CAN_TAKE_DINE_IN_ORDERS: 'canTakeDineInOrders',
    CAN_HANDLE_ONLINE_ORDERS: 'canHandleOnlineOrders',
    CAN_UPDATE_ORDER_STATUS: 'canUpdateOrderStatus',
    CAN_GENERATE_BILLS: 'canGenerateBills',

    // Payment Management
    CAN_VIEW_ALL_TRANSACTIONS: 'canViewAllTransactions',
    CAN_PROCESS_PAYMENTS: 'canProcessPayments',
    CAN_HANDLE_REFUNDS: 'canHandleRefunds',
    CAN_MANAGE_TAX_RATES: 'canManageTaxRates',
    CAN_MANAGE_DISCOUNTS: 'canManageDiscounts',
    CAN_APPLY_DISCOUNTS: 'canApplyDiscounts',

    // Analytics & Reports (Owner only)
    CAN_VIEW_SALES_ANALYTICS: 'canViewSalesAnalytics',
    CAN_VIEW_EMPLOYEE_PERFORMANCE: 'canViewEmployeePerformance',
    CAN_VIEW_REVENUE_BREAKDOWN: 'canViewRevenueBreakdown',

    // System Configuration (Owner only)
    CAN_MANAGE_RESTAURANT_DETAILS: 'canManageRestaurantDetails',
    CAN_MANAGE_PAYMENT_GATEWAY: 'canManagePaymentGateway',
    CAN_MANAGE_NOTIFICATION_SETTINGS: 'canManageNotificationSettings',

    // Menu Interaction (Employee)
    CAN_VIEW_MENU_ITEMS: 'canViewMenuItems',
    CAN_NOTIFY_ITEM_UNAVAILABLE: 'canNotifyItemUnavailable',

    // Account Management
    CAN_UPDATE_PERSONAL_DETAILS: 'canUpdatePersonalDetails'
};

// Role-based permissions mapping
export const ROLE_PERMISSIONS = {
    [USER_ROLES.OWNER]: {
        // Owner - Full control over the entire POS system

        // User Management
        [PERMISSIONS.CAN_CREATE_EMPLOYEE]: true,
        [PERMISSIONS.CAN_EDIT_EMPLOYEE]: true,
        [PERMISSIONS.CAN_DEACTIVATE_EMPLOYEE]: true,
        [PERMISSIONS.CAN_VIEW_EMPLOYEE_ACTIVITY]: true,

        // Menu Management
        [PERMISSIONS.CAN_MANAGE_MENU_ITEMS]: true,
        [PERMISSIONS.CAN_MANAGE_MENU_CATEGORIES]: true,
        [PERMISSIONS.CAN_TOGGLE_ITEM_AVAILABILITY]: true,

        // Order Management
        [PERMISSIONS.CAN_VIEW_ALL_ORDERS]: true,
        [PERMISSIONS.CAN_UPDATE_ORDERS]: true,
        [PERMISSIONS.CAN_CANCEL_ORDERS]: true,
        [PERMISSIONS.CAN_TAKE_DINE_IN_ORDERS]: true,
        [PERMISSIONS.CAN_HANDLE_ONLINE_ORDERS]: true,
        [PERMISSIONS.CAN_UPDATE_ORDER_STATUS]: true,
        [PERMISSIONS.CAN_GENERATE_BILLS]: true,

        // Payment Management
        [PERMISSIONS.CAN_VIEW_ALL_TRANSACTIONS]: true,
        [PERMISSIONS.CAN_PROCESS_PAYMENTS]: true,
        [PERMISSIONS.CAN_HANDLE_REFUNDS]: true,
        [PERMISSIONS.CAN_MANAGE_TAX_RATES]: true,
        [PERMISSIONS.CAN_MANAGE_DISCOUNTS]: true,
        [PERMISSIONS.CAN_APPLY_DISCOUNTS]: true,

        // Analytics & Reports
        [PERMISSIONS.CAN_VIEW_SALES_ANALYTICS]: true,
        [PERMISSIONS.CAN_VIEW_EMPLOYEE_PERFORMANCE]: true,
        [PERMISSIONS.CAN_VIEW_REVENUE_BREAKDOWN]: true,

        // System Configuration
        [PERMISSIONS.CAN_MANAGE_RESTAURANT_DETAILS]: true,
        [PERMISSIONS.CAN_MANAGE_PAYMENT_GATEWAY]: true,
        [PERMISSIONS.CAN_MANAGE_NOTIFICATION_SETTINGS]: true,

        // Menu Interaction
        [PERMISSIONS.CAN_VIEW_MENU_ITEMS]: true,
        [PERMISSIONS.CAN_NOTIFY_ITEM_UNAVAILABLE]: true,

        // Account Management
        [PERMISSIONS.CAN_UPDATE_PERSONAL_DETAILS]: true
    },
    [USER_ROLES.EMPLOYEE]: {
        // Employee - Limited operational tasks within the POS

        // User Management
        [PERMISSIONS.CAN_CREATE_EMPLOYEE]: false,
        [PERMISSIONS.CAN_EDIT_EMPLOYEE]: false,
        [PERMISSIONS.CAN_DEACTIVATE_EMPLOYEE]: false,
        [PERMISSIONS.CAN_VIEW_EMPLOYEE_ACTIVITY]: false,

        // Menu Management
        [PERMISSIONS.CAN_MANAGE_MENU_ITEMS]: false,
        [PERMISSIONS.CAN_MANAGE_MENU_CATEGORIES]: false,
        [PERMISSIONS.CAN_TOGGLE_ITEM_AVAILABILITY]: false,

        // Order Management
        [PERMISSIONS.CAN_VIEW_ALL_ORDERS]: false, // Can only see assigned orders
        [PERMISSIONS.CAN_UPDATE_ORDERS]: true,
        [PERMISSIONS.CAN_CANCEL_ORDERS]: false,
        [PERMISSIONS.CAN_TAKE_DINE_IN_ORDERS]: true,
        [PERMISSIONS.CAN_HANDLE_ONLINE_ORDERS]: true,
        [PERMISSIONS.CAN_UPDATE_ORDER_STATUS]: true,
        [PERMISSIONS.CAN_GENERATE_BILLS]: true,

        // Payment Management
        [PERMISSIONS.CAN_VIEW_ALL_TRANSACTIONS]: false,
        [PERMISSIONS.CAN_PROCESS_PAYMENTS]: true,
        [PERMISSIONS.CAN_HANDLE_REFUNDS]: false,
        [PERMISSIONS.CAN_MANAGE_TAX_RATES]: false,
        [PERMISSIONS.CAN_MANAGE_DISCOUNTS]: false,
        [PERMISSIONS.CAN_APPLY_DISCOUNTS]: true, // Can apply owner-configured discounts

        // Analytics & Reports
        [PERMISSIONS.CAN_VIEW_SALES_ANALYTICS]: false,
        [PERMISSIONS.CAN_VIEW_EMPLOYEE_PERFORMANCE]: false,
        [PERMISSIONS.CAN_VIEW_REVENUE_BREAKDOWN]: false,

        // System Configuration
        [PERMISSIONS.CAN_MANAGE_RESTAURANT_DETAILS]: false,
        [PERMISSIONS.CAN_MANAGE_PAYMENT_GATEWAY]: false,
        [PERMISSIONS.CAN_MANAGE_NOTIFICATION_SETTINGS]: false,

        // Menu Interaction
        [PERMISSIONS.CAN_VIEW_MENU_ITEMS]: true,
        [PERMISSIONS.CAN_NOTIFY_ITEM_UNAVAILABLE]: true,

        // Account Management
        [PERMISSIONS.CAN_UPDATE_PERSONAL_DETAILS]: true
    }
};

// Helper function to check if user has permission
export const hasPermission = (userRole, permission) => {
    return ROLE_PERMISSIONS[userRole]?.[permission] || false;
};

// Helper function to get all permissions for a role
export const getRolePermissions = (userRole) => {
    return ROLE_PERMISSIONS[userRole] || {};
};

// Role display names
export const ROLE_DISPLAY_NAMES = {
    [USER_ROLES.ADMIN]: 'System Administrator',
    [USER_ROLES.OWNER]: 'Business Owner',
    [USER_ROLES.MANAGER]: 'Store Manager',
    [USER_ROLES.CASHIER]: 'Cashier',
    [USER_ROLES.READONLY]: 'Auditor/Accountant'
};

// Role descriptions
export const ROLE_DESCRIPTIONS = {
    [USER_ROLES.ADMIN]: 'Full system access including technical settings and user management',
    [USER_ROLES.OWNER]: 'Complete business operations control with financial oversight',
    [USER_ROLES.MANAGER]: 'Daily operations management including staff and inventory',
    [USER_ROLES.CASHIER]: 'Sales processing and customer service',
    [USER_ROLES.READONLY]: 'View-only access for financial reporting and auditing'
};
