# How Cognito Users Connect to RDS PostgreSQL

## Overview
This document explains how users registered in **AWS Cognito** are connected to the **RDS PostgreSQL** database.

## The Connection Flow

```
┌─────────────┐
│   Cognito   │  User registers/logs in
│   (AWS)     │  Gets JWT token
└──────┬──────┘
       │
       │ JWT Token (Bearer token)
       │
       ▼
┌─────────────────────────────────────┐
│  Frontend (React)                   │
│  - Stores token in localStorage     │
│  - Sends token with API requests    │
└──────┬──────────────────────────────┘
       │
       │ HTTP Request with Authorization header
       │ Authorization: Bearer <jwt-token>
       │
       ▼
┌─────────────────────────────────────┐
│  Backend API (Express)              │
│  /api/employees, /api/menu, etc.   │
└──────┬──────────────────────────────┘
       │
       │ Middleware Chain
       │
       ▼
┌─────────────────────────────────────┐
│  1. authenticateToken Middleware    │
│     (middleware/auth.js)            │
│                                     │
│  - Receives JWT token               │
│  - Verifies token with JWKS         │
│  - Decodes token to get user info   │
│  - Sets req.user with:              │
│    • email                          │
│    • sub (Cognito user ID)          │
│    • businessName                   │
│    • businessType                   │
│    • phone                          │
│    • (NO ownerId yet!)              │
└──────┬──────────────────────────────┘
       │
       │ req.user populated (but no ownerId)
       │
       ▼
┌─────────────────────────────────────┐
│  2. syncCognitoUserToOwner          │
│     (middleware/cognitoSync.js)    │
│                                     │
│  This is the BRIDGE between         │
│  Cognito and PostgreSQL!            │
│                                     │
│  Steps:                             │
│  1. Extract email from req.user     │
│  2. Look up Owner in PostgreSQL     │
│     by email                        │
│  3. If not found:                   │
│     - Create new Owner record       │
│     - Generate UUID (PostgreSQL)    │
│  4. If found:                       │
│     - Use existing Owner record     │
│  5. Set req.user.ownerId = UUID     │
│     (This is the PostgreSQL UUID!)  │
└──────┬──────────────────────────────┘
       │
       │ req.user.ownerId = PostgreSQL UUID
       │
       ▼
┌─────────────────────────────────────┐
│  3. Route Handler                   │
│     (routes/employees.js, etc.)      │
│                                     │
│  - Uses req.user.ownerId            │
│  - Queries PostgreSQL:              │
│    WHERE ownerId = req.user.ownerId │
│  - Returns owner-specific data      │
└─────────────────────────────────────┘
```

## Key Components

### 1. **Cognito (AWS)**
- **Purpose**: User authentication and authorization
- **Stores**: User credentials, email, password
- **Returns**: JWT token with user information

### 2. **PostgreSQL (RDS)**
- **Purpose**: Application data storage
- **Stores**: Owner records, employees, menu items, orders, etc.
- **Uses**: UUIDs as primary keys (not Cognito IDs)

### 3. **The Bridge: `syncCognitoUserToOwner` Middleware**

This middleware **connects** Cognito users to PostgreSQL records:

```javascript
// Location: code/server/middleware/cognitoSync.js

// Step 1: Get email from Cognito token
const email = req.user.email; // From verified JWT

// Step 2: Find or create Owner in PostgreSQL
let owner = await Owner.findOne({ where: { email } });

if (!owner) {
    // Create new Owner record from Cognito data
    owner = await Owner.create({
        email: email,
        name: userName || businessName,
        businessName: businessName,
        businessType: businessType,
        phone: phone,
        password: 'cognito-auth', // Placeholder
        isActive: true
    });
}

// Step 3: Attach PostgreSQL UUID to request
req.user.ownerId = owner.id; // This is the PostgreSQL UUID!
```

## Why This Design?

### **Separation of Concerns**
- **Cognito**: Handles authentication (who you are)
- **PostgreSQL**: Handles application data (what you own)

### **Why Not Use Cognito ID Directly?**
1. **Different ID Formats**:
   - Cognito: `sub` (UUID-like string)
   - PostgreSQL: `id` (UUID)
   - They're different values!

2. **Data Isolation**:
   - Each owner has their own employees, menu items, orders
   - All queries use `ownerId` (PostgreSQL UUID) to filter data

3. **Flexibility**:
   - Can change authentication provider without affecting data
   - Can have multiple authentication methods

## Example Flow

### User Registration:
```
1. User fills form: firstName, lastName, email, password, businessName, businessType, phone
2. Frontend calls Cognito signUp()
3. Cognito creates user account
4. User gets JWT token
5. Frontend stores token
```

### First API Request:
```
1. User makes API call (e.g., GET /api/employees)
2. Frontend sends: Authorization: Bearer <jwt-token>
3. Backend authenticateToken verifies token
4. Backend syncCognitoUserToOwner:
   - Extracts email from token
   - Checks PostgreSQL: SELECT * FROM owners WHERE email = 'user@example.com'
   - Not found? CREATE new Owner record
   - Sets req.user.ownerId = owner.id (PostgreSQL UUID)
5. Route handler uses req.user.ownerId
6. Query: SELECT * FROM employees WHERE ownerId = req.user.ownerId
7. Returns only that owner's employees
```

### Subsequent Requests:
```
1. User makes API call
2. authenticateToken verifies token
3. syncCognitoUserToOwner:
   - Finds existing Owner by email
   - Sets req.user.ownerId = existing owner.id
4. Route uses ownerId
5. Data is filtered by ownerId
```

## Security Features

### **Email Verification**
The middleware ensures the email in the Cognito token matches the email in PostgreSQL:

```javascript
// Security check: email must match
if (owner.email !== email) {
    // Don't use this owner - create new one
    // Prevents cross-owner data access
}
```

### **UUID Validation**
Before proceeding, the middleware verifies `ownerId` is a valid UUID:

```javascript
if (!req.user.ownerId || typeof req.user.ownerId !== 'string') {
    return res.status(500).json({ error: 'Account sync failed' });
}
```

## Database Schema

### **Owners Table (PostgreSQL)**
```sql
CREATE TABLE owners (
    id UUID PRIMARY KEY,           -- PostgreSQL UUID (not Cognito ID!)
    email VARCHAR(255) UNIQUE,     -- Matches Cognito email
    name VARCHAR(100),
    password VARCHAR(255),          -- 'cognito-auth' placeholder
    phone VARCHAR(20),
    businessName VARCHAR(100),
    businessType ENUM(...),
    isActive BOOLEAN,
    loginCount INTEGER,
    lastLogin TIMESTAMP,
    createdAt TIMESTAMP,
    updatedAt TIMESTAMP
);
```

### **Relationship**
- **Cognito User** ↔️ **Owner Record**
- **Link**: Email address (must match exactly)
- **Owner.id** (PostgreSQL UUID) is used throughout the application

## Files Involved

1. **`middleware/auth.js`** - Verifies Cognito JWT tokens
2. **`middleware/cognitoSync.js`** - Syncs Cognito user to PostgreSQL Owner
3. **`server.js`** - Applies middleware to all protected routes:
   ```javascript
   app.use('/api/menu', authenticateToken, syncCognitoUserToOwner, menuRoutes);
   app.use('/api/employees', authenticateToken, syncCognitoUserToOwner, employeeRoutes);
   // etc.
   ```

## Summary

**Cognito** handles authentication, **PostgreSQL** handles data. The **`syncCognitoUserToOwner` middleware** bridges them by:
1. Extracting email from Cognito token
2. Finding or creating matching Owner record in PostgreSQL
3. Setting `req.user.ownerId` to the PostgreSQL UUID
4. All subsequent queries use this UUID to filter data by owner

This ensures **data isolation** - each owner only sees their own data!

