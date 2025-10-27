# Role-Based Access Control (RBAC) System

## Overview

The POS system implements a two-tier role-based access control system with **Owner** and **Employee** roles, designed to provide appropriate permissions for different user types in a restaurant environment.

## User Roles

### 👑 Owner
The Owner has **full control** over the entire POS system and is responsible for all administrative and management functions.

**Responsibilities and Permissions:**

#### User Management
- ✅ Create new Employee accounts
- ✅ Assign unique Employee IDs (used during signup/login)
- ✅ Edit or deactivate employee accounts
- ✅ View employee activity (orders handled, performance stats)

#### Menu Management
- ✅ Create, update, and delete menu items
- ✅ Add details for each item: name, category, description, price, availability, and image
- ✅ Manage menu categories (e.g., Starters, Main Course, Desserts)
- ✅ Enable/disable items for dine-in or online orders

#### Order Management
- ✅ View all orders (dine-in and online)
- ✅ Update or cancel orders if needed
- ✅ Monitor real-time order status (from creation to completion)

#### Payment Management
- ✅ View all completed transactions and payment reports
- ✅ Handle refunds or payment discrepancies
- ✅ Manage tax rates, discounts, and service charges

#### Analytics & Reports
- ✅ Access dashboards for:
  - Daily/weekly/monthly sales
  - Most sold items
  - Employee performance
  - Revenue breakdown (dine-in vs. online)

#### System Configuration
- ✅ Manage restaurant details (name, address, logo, operating hours)
- ✅ Configure payment gateway credentials (e.g., Stripe)
- ✅ Manage notification settings (email/SMS for order updates)

### 👨‍🍳 Employee
The Employee role is limited to **operational tasks** within the POS system.

**Responsibilities and Permissions:**

#### Order Handling
- ✅ Take new dine-in orders and assign to a table
- ✅ Handle online orders (view, accept, and update order status)
- ✅ Update order progress (e.g., Preparing → Ready → Served)
- ✅ Generate and print bills/receipts

#### Payments
- ✅ Process payments (cash, card, or online)
- ✅ Apply discounts or service charges (based on owner's configuration)

#### Menu Interaction
- ✅ View available menu items (cannot edit or delete)
- ✅ Notify owner if an item is unavailable/out of stock

#### Account
- ✅ Can log in using the Employee ID created by the owner
- ✅ Can update personal details (like name or contact info), but not permissions

## Authentication Flow

1. **Owner Registration**: The Owner is the first user who registers in the system
2. **Employee Creation**: The Owner can then create Employee accounts through the dashboard
3. **Employee Access**: Employees receive their unique Employee ID and can use it to sign up/login
4. **Role-based Access**: The system ensures that owners and employees see different dashboards and permissions

## Technical Implementation

### Frontend (Client-side)
- **File**: `code/client/src/aws/userRoles.js`
- **Constants**: `USER_ROLES` and `PERMISSIONS`
- **Mapping**: `ROLE_PERMISSIONS` object defines what each role can do
- **Helper Functions**: `hasPermission()` and `getRolePermissions()`

### Backend (Server-side)
- **File**: `code/server/middleware/auth.js`
- **Middleware**: `authenticateToken()` and `authorizePermission()`
- **Permissions**: Server-side permission mapping matches frontend structure

### Key Features
- **Permission-based Authorization**: Each action is checked against user permissions
- **Role-based Dashboards**: Different UI components based on user role
- **Secure API Endpoints**: Server validates permissions before processing requests
- **Employee ID System**: Unique identifiers for employee management

## Security Considerations

- **Default Role**: New users default to `employee` role for security
- **Permission Validation**: Both frontend and backend validate permissions
- **Token-based Auth**: JWT tokens contain role information
- **API Protection**: All sensitive endpoints require appropriate permissions

## Usage Examples

### Checking Permissions (Frontend)
```javascript
import { hasPermission, USER_ROLES, PERMISSIONS } from './aws/userRoles';

// Check if user can manage menu items
const canManageMenu = hasPermission(userRole, PERMISSIONS.CAN_MANAGE_MENU_ITEMS);

// Check if user can view analytics
const canViewAnalytics = hasPermission(userRole, PERMISSIONS.CAN_VIEW_SALES_ANALYTICS);
```

### Protecting Routes (Backend)
```javascript
// Protect route that requires owner permissions
app.get('/api/analytics', 
    authenticateToken, 
    authorizePermission('canViewSalesAnalytics'), 
    getAnalytics
);

// Protect route that requires employee permissions
app.post('/api/orders', 
    authenticateToken, 
    authorizePermission('canTakeDineInOrders'), 
    createOrder
);
```

## Future Enhancements

- **Manager Role**: Could be added for shift supervisors
- **Custom Permissions**: Allow owners to create custom permission sets
- **Role Hierarchy**: Implement role inheritance
- **Audit Logging**: Track permission usage and changes
