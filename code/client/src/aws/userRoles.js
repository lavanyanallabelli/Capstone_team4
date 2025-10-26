// User Roles and Permissions Configuration
export const USER_ROLES = {
    ADMIN: 'admin',        // System Administrator
    OWNER: 'owner',        // Business Owner
    MANAGER: 'manager',    // Store/Shift Manager
    CASHIER: 'cashier',    // Sales Staff
    READONLY: 'readonly'   // Auditor/Accountant
};

export const PERMISSIONS = {
    // Sales & Transactions
    CAN_PROCESS_SALES: 'canProcessSales',
    CAN_PROCESS_REFUNDS: 'canProcessRefunds',
    CAN_VOID_TRANSACTIONS: 'canVoidTransactions',

    // Inventory & Products
    CAN_MANAGE_INVENTORY: 'canManageInventory',
    CAN_MANAGE_PRODUCTS: 'canManageProducts',
    CAN_ADJUST_INVENTORY: 'canAdjustInventory',

    // Reports & Analytics
    CAN_VIEW_REPORTS: 'canViewReports',
    CAN_VIEW_ANALYTICS: 'canViewAnalytics',
    CAN_EXPORT_DATA: 'canExportData',

    // User Management
    CAN_MANAGE_USERS: 'canManageUsers',
    CAN_MANAGE_ROLES: 'canManageRoles',

    // System & Settings
    CAN_MANAGE_SETTINGS: 'canManageSettings',
    CAN_MANAGE_SYSTEM: 'canManageSystem',

    // Customer Management
    CAN_VIEW_CUSTOMERS: 'canViewCustomers',
    CAN_MANAGE_CUSTOMERS: 'canManageCustomers',

    // Financial
    CAN_VIEW_FINANCIALS: 'canViewFinancials',
    CAN_MANAGE_BILLING: 'canManageBilling'
};

// Role-based permissions mapping
export const ROLE_PERMISSIONS = {
    [USER_ROLES.ADMIN]: {
        // System Administrator - Full system access
        [PERMISSIONS.CAN_PROCESS_SALES]: true,
        [PERMISSIONS.CAN_PROCESS_REFUNDS]: true,
        [PERMISSIONS.CAN_VOID_TRANSACTIONS]: true,
        [PERMISSIONS.CAN_MANAGE_INVENTORY]: true,
        [PERMISSIONS.CAN_MANAGE_PRODUCTS]: true,
        [PERMISSIONS.CAN_ADJUST_INVENTORY]: true,
        [PERMISSIONS.CAN_VIEW_REPORTS]: true,
        [PERMISSIONS.CAN_VIEW_ANALYTICS]: true,
        [PERMISSIONS.CAN_EXPORT_DATA]: true,
        [PERMISSIONS.CAN_MANAGE_USERS]: true,
        [PERMISSIONS.CAN_MANAGE_ROLES]: true,
        [PERMISSIONS.CAN_MANAGE_SETTINGS]: true,
        [PERMISSIONS.CAN_MANAGE_SYSTEM]: true,
        [PERMISSIONS.CAN_VIEW_CUSTOMERS]: true,
        [PERMISSIONS.CAN_MANAGE_CUSTOMERS]: true,
        [PERMISSIONS.CAN_VIEW_FINANCIALS]: true,
        [PERMISSIONS.CAN_MANAGE_BILLING]: true
    },
    [USER_ROLES.OWNER]: {
        // Business Owner - All business operations
        [PERMISSIONS.CAN_PROCESS_SALES]: true,
        [PERMISSIONS.CAN_PROCESS_REFUNDS]: true,
        [PERMISSIONS.CAN_VOID_TRANSACTIONS]: true,
        [PERMISSIONS.CAN_MANAGE_INVENTORY]: true,
        [PERMISSIONS.CAN_MANAGE_PRODUCTS]: true,
        [PERMISSIONS.CAN_ADJUST_INVENTORY]: true,
        [PERMISSIONS.CAN_VIEW_REPORTS]: true,
        [PERMISSIONS.CAN_VIEW_ANALYTICS]: true,
        [PERMISSIONS.CAN_EXPORT_DATA]: true,
        [PERMISSIONS.CAN_MANAGE_USERS]: true,
        [PERMISSIONS.CAN_MANAGE_ROLES]: false, // Cannot change admin roles
        [PERMISSIONS.CAN_MANAGE_SETTINGS]: true,
        [PERMISSIONS.CAN_MANAGE_SYSTEM]: false, // No system-level changes
        [PERMISSIONS.CAN_VIEW_CUSTOMERS]: true,
        [PERMISSIONS.CAN_MANAGE_CUSTOMERS]: true,
        [PERMISSIONS.CAN_VIEW_FINANCIALS]: true,
        [PERMISSIONS.CAN_MANAGE_BILLING]: true
    },
    [USER_ROLES.MANAGER]: {
        // Store/Shift Manager - Daily operations
        [PERMISSIONS.CAN_PROCESS_SALES]: true,
        [PERMISSIONS.CAN_PROCESS_REFUNDS]: true,
        [PERMISSIONS.CAN_VOID_TRANSACTIONS]: true,
        [PERMISSIONS.CAN_MANAGE_INVENTORY]: true,
        [PERMISSIONS.CAN_MANAGE_PRODUCTS]: true,
        [PERMISSIONS.CAN_ADJUST_INVENTORY]: true,
        [PERMISSIONS.CAN_VIEW_REPORTS]: true,
        [PERMISSIONS.CAN_VIEW_ANALYTICS]: true,
        [PERMISSIONS.CAN_EXPORT_DATA]: true,
        [PERMISSIONS.CAN_MANAGE_USERS]: false, // Cannot manage owners/admins
        [PERMISSIONS.CAN_MANAGE_ROLES]: false,
        [PERMISSIONS.CAN_MANAGE_SETTINGS]: false,
        [PERMISSIONS.CAN_MANAGE_SYSTEM]: false,
        [PERMISSIONS.CAN_VIEW_CUSTOMERS]: true,
        [PERMISSIONS.CAN_MANAGE_CUSTOMERS]: true,
        [PERMISSIONS.CAN_VIEW_FINANCIALS]: true,
        [PERMISSIONS.CAN_MANAGE_BILLING]: false
    },
    [USER_ROLES.CASHIER]: {
        // Sales Staff - Customer service and sales
        [PERMISSIONS.CAN_PROCESS_SALES]: true,
        [PERMISSIONS.CAN_PROCESS_REFUNDS]: false, // Requires manager approval
        [PERMISSIONS.CAN_VOID_TRANSACTIONS]: false,
        [PERMISSIONS.CAN_MANAGE_INVENTORY]: false,
        [PERMISSIONS.CAN_MANAGE_PRODUCTS]: false,
        [PERMISSIONS.CAN_ADJUST_INVENTORY]: false,
        [PERMISSIONS.CAN_VIEW_REPORTS]: false,
        [PERMISSIONS.CAN_VIEW_ANALYTICS]: false,
        [PERMISSIONS.CAN_EXPORT_DATA]: false,
        [PERMISSIONS.CAN_MANAGE_USERS]: false,
        [PERMISSIONS.CAN_MANAGE_ROLES]: false,
        [PERMISSIONS.CAN_MANAGE_SETTINGS]: false,
        [PERMISSIONS.CAN_MANAGE_SYSTEM]: false,
        [PERMISSIONS.CAN_VIEW_CUSTOMERS]: true,
        [PERMISSIONS.CAN_MANAGE_CUSTOMERS]: false,
        [PERMISSIONS.CAN_VIEW_FINANCIALS]: false,
        [PERMISSIONS.CAN_MANAGE_BILLING]: false
    },
    [USER_ROLES.READONLY]: {
        // Auditor/Accountant - View-only access
        [PERMISSIONS.CAN_PROCESS_SALES]: false,
        [PERMISSIONS.CAN_PROCESS_REFUNDS]: false,
        [PERMISSIONS.CAN_VOID_TRANSACTIONS]: false,
        [PERMISSIONS.CAN_MANAGE_INVENTORY]: false,
        [PERMISSIONS.CAN_MANAGE_PRODUCTS]: false,
        [PERMISSIONS.CAN_ADJUST_INVENTORY]: false,
        [PERMISSIONS.CAN_VIEW_REPORTS]: true,
        [PERMISSIONS.CAN_VIEW_ANALYTICS]: true,
        [PERMISSIONS.CAN_EXPORT_DATA]: true,
        [PERMISSIONS.CAN_MANAGE_USERS]: false,
        [PERMISSIONS.CAN_MANAGE_ROLES]: false,
        [PERMISSIONS.CAN_MANAGE_SETTINGS]: false,
        [PERMISSIONS.CAN_MANAGE_SYSTEM]: false,
        [PERMISSIONS.CAN_VIEW_CUSTOMERS]: true,
        [PERMISSIONS.CAN_MANAGE_CUSTOMERS]: false,
        [PERMISSIONS.CAN_VIEW_FINANCIALS]: true,
        [PERMISSIONS.CAN_MANAGE_BILLING]: false
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
