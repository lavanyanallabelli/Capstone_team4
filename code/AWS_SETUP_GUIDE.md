# AWS Setup Guide for POS System

This guide will help you set up AWS DynamoDB for your POS system while using your existing AWS Cognito User Pool for authentication.

## 🎯 **What You Already Have:**
- ✅ AWS Cognito User Pool
- ✅ User authentication working

## 🎯 **What You Need to Set Up:**
- 🔧 AWS DynamoDB tables for POS data
- 🔧 IAM permissions for DynamoDB access
- 🔧 Backend configuration

---

## 📋 **Step 1: Set Up DynamoDB Tables**

### **Option A: Using AWS Console (Recommended)**

1. **Go to DynamoDB Console**
   - Navigate to [AWS DynamoDB Console](https://console.aws.amazon.com/dynamodb/)
   - Click "Create table"

2. **Create Each Table** (repeat for all 6 tables):

#### **Table 1: pos-menu-items**
- **Table name**: `pos-menu-items`
- **Partition key**: `businessId` (String)
- **Sort key**: `itemId` (String)
- **Settings**: On-demand capacity mode
- **Click "Create table"**

#### **Table 2: pos-employees**
- **Table name**: `pos-employees`
- **Partition key**: `businessId` (String)
- **Sort key**: `employeeId` (String)
- **Settings**: On-demand capacity mode
- **Click "Create table"**

#### **Table 3: pos-orders**
- **Table name**: `pos-orders`
- **Partition key**: `businessId` (String)
- **Sort key**: `orderId` (String)
- **Settings**: On-demand capacity mode
- **Click "Create table"**

#### **Table 4: pos-analytics**
- **Table name**: `pos-analytics`
- **Partition key**: `businessId` (String)
- **Sort key**: `date` (String)
- **Settings**: On-demand capacity mode
- **Click "Create table"**

#### **Table 5: pos-settings**
- **Table name**: `pos-settings`
- **Partition key**: `businessId` (String)
- **Sort key**: `settingType` (String)
- **Settings**: On-demand capacity mode
- **Click "Create table"**

#### **Table 6: pos-users** (Optional - for additional user data)
- **Table name**: `pos-users`
- **Partition key**: `userId` (String)
- **Settings**: On-demand capacity mode
- **Click "Create table"**

### **Option B: Using AWS CLI**

Create a file called `create-tables.sh`:

```bash
#!/bin/bash

# Set your AWS region
AWS_REGION="us-east-1"

# Create pos-menu-items table
aws dynamodb create-table \
    --table-name pos-menu-items \
    --attribute-definitions \
        AttributeName=businessId,AttributeType=S \
        AttributeName=itemId,AttributeType=S \
    --key-schema \
        AttributeName=businessId,KeyType=HASH \
        AttributeName=itemId,KeyType=RANGE \
    --billing-mode PAY_PER_REQUEST \
    --region $AWS_REGION

# Create pos-employees table
aws dynamodb create-table \
    --table-name pos-employees \
    --attribute-definitions \
        AttributeName=businessId,AttributeType=S \
        AttributeName=employeeId,AttributeType=S \
    --key-schema \
        AttributeName=businessId,KeyType=HASH \
        AttributeName=employeeId,KeyType=RANGE \
    --billing-mode PAY_PER_REQUEST \
    --region $AWS_REGION

# Create pos-orders table
aws dynamodb create-table \
    --table-name pos-orders \
    --attribute-definitions \
        AttributeName=businessId,AttributeType=S \
        AttributeName=orderId,AttributeType=S \
    --key-schema \
        AttributeName=businessId,KeyType=HASH \
        AttributeName=orderId,KeyType=RANGE \
    --billing-mode PAY_PER_REQUEST \
    --region $AWS_REGION

# Create pos-analytics table
aws dynamodb create-table \
    --table-name pos-analytics \
    --attribute-definitions \
        AttributeName=businessId,AttributeType=S \
        AttributeName=date,AttributeType=S \
    --key-schema \
        AttributeName=businessId,KeyType=HASH \
        AttributeName=date,KeyType=RANGE \
    --billing-mode PAY_PER_REQUEST \
    --region $AWS_REGION

# Create pos-settings table
aws dynamodb create-table \
    --table-name pos-settings \
    --attribute-definitions \
        AttributeName=businessId,AttributeType=S \
        AttributeName=settingType,AttributeType=S \
    --key-schema \
        AttributeName=businessId,KeyType=HASH \
        AttributeName=settingType,KeyType=RANGE \
    --billing-mode PAY_PER_REQUEST \
    --region $AWS_REGION

# Create pos-users table
aws dynamodb create-table \
    --table-name pos-users \
    --attribute-definitions \
        AttributeName=userId,AttributeType=S \
    --key-schema \
        AttributeName=userId,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST \
    --region $AWS_REGION

echo "All tables created successfully!"
```

Run the script:
```bash
chmod +x create-tables.sh
./create-tables.sh
```

---

## 🔐 **Step 2: Set Up IAM Permissions**

### **Create IAM User for Backend**

1. **Go to IAM Console**
   - Navigate to [AWS IAM Console](https://console.aws.amazon.com/iam/)
   - Click "Users" → "Create user"

2. **Create User**
   - **User name**: `pos-backend-user`
   - **Access type**: Programmatic access
   - Click "Next"

3. **Attach Policies**
   - Search and attach: `AmazonDynamoDBFullAccess`
   - Click "Next" → "Create user"

4. **Save Credentials**
   - Download the CSV file with Access Key ID and Secret Access Key
   - **Keep these secure!**

### **Alternative: Use Existing IAM User**
If you already have an IAM user with DynamoDB access, you can use those credentials.

---

## ⚙️ **Step 3: Configure Backend**

### **1. Update Environment Variables**

Create `.env` file in `code/server/` directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_iam_user_access_key_id
AWS_SECRET_ACCESS_KEY=your_iam_user_secret_access_key

# AWS Cognito Configuration (Your Existing Setup)
AWS_USER_POOL_ID=us-east-1_XXXXXXXXX
AWS_USER_POOL_WEB_CLIENT_ID=your_cognito_client_id
JWKS_URI=https://cognito-idp.us-east-1.amazonaws.com/us-east-1_XXXXXXXXX/.well-known/jwks.json

# DynamoDB Table Names
DYNAMODB_USERS_TABLE=pos-users
DYNAMODB_MENU_ITEMS_TABLE=pos-menu-items
DYNAMODB_EMPLOYEES_TABLE=pos-employees
DYNAMODB_ORDERS_TABLE=pos-orders
DYNAMODB_ANALYTICS_TABLE=pos-analytics
DYNAMODB_SETTINGS_TABLE=pos-settings
```

### **2. Find Your Cognito Configuration**

To get your Cognito details:

1. **Go to Cognito Console**
   - Navigate to [AWS Cognito Console](https://console.aws.amazon.com/cognito/)
   - Click on your User Pool

2. **Get User Pool ID**
   - Copy the "User pool ID" (format: `us-east-1_XXXXXXXXX`)

3. **Get Client ID**
   - Go to "App integration" tab
   - Click on your app client
   - Copy the "Client ID"

4. **Update JWKS URI**
   - Replace `us-east-1_XXXXXXXXX` in the JWKS_URI with your actual User Pool ID

---

## 🚀 **Step 4: Test the Setup**

### **1. Install Backend Dependencies**
```bash
cd code/server
npm install
```

### **2. Start the Backend**
```bash
npm run dev
```

### **3. Test API Endpoints**
The server should start on `http://localhost:5000`

Test the health endpoint:
```bash
curl http://localhost:5000/health
```

---

## 🔧 **Step 5: Update Frontend Configuration**

### **Update API Service**

In `code/client/src/services/api.js`, make sure the API URL is correct:

```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
```

### **Update Environment Variables**

Create `.env` file in `code/client/` directory:

```env
REACT_APP_API_URL=http://localhost:5000/api
```

---

## 📊 **Step 6: Verify DynamoDB Tables**

### **Check Tables in Console**
1. Go to [DynamoDB Console](https://console.aws.amazon.com/dynamodb/)
2. Verify all 6 tables are created:
   - `pos-menu-items`
   - `pos-employees`
   - `pos-orders`
   - `pos-analytics`
   - `pos-settings`
   - `pos-users`

### **Test Data Insertion**
Once your backend is running, the tables will be populated when you:
- Create menu items
- Add employees
- Process orders
- Update settings

---

## 🎯 **Step 7: Cognito User Attributes**

### **Required Custom Attributes**

Make sure your Cognito User Pool has these custom attributes:

1. **Go to Cognito Console**
2. **Click on your User Pool**
3. **Go to "Sign-up experience" tab**
4. **Click "Add custom attribute"**

Add these attributes:
- `userRole` (String) - for "owner" or "employee"
- `businessId` (String) - unique business identifier
- `businessName` (String) - restaurant name
- `businessType` (String) - type of business
- `phone` (String) - contact phone

### **Update User Registration**

When users register through your frontend, make sure to set these custom attributes:

```javascript
// In your frontend registration
const userAttributes = {
    email: email,
    'custom:userRole': 'owner',
    'custom:businessId': generateBusinessId(),
    'custom:businessName': businessName,
    'custom:businessType': businessType,
    'custom:phone': phone
};
```

---

## 🚨 **Troubleshooting**

### **Common Issues:**

1. **"Access Denied" Error**
   - Check IAM user permissions
   - Verify DynamoDB policies are attached

2. **"Table Not Found" Error**
   - Verify table names match exactly
   - Check AWS region configuration

3. **"Invalid Token" Error**
   - Verify Cognito User Pool ID
   - Check JWKS URI format
   - Ensure client ID is correct

4. **"CORS Error"**
   - Add your frontend URL to CORS settings
   - Check FRONTEND_URL in .env

### **Debug Steps:**

1. **Check AWS Credentials**
   ```bash
   aws sts get-caller-identity
   ```

2. **Test DynamoDB Access**
   ```bash
   aws dynamodb list-tables --region us-east-1
   ```

3. **Check Cognito Configuration**
   - Verify User Pool ID format
   - Check app client settings

---

## 📈 **Next Steps**

Once everything is set up:

1. **Test the complete flow:**
   - User registration/login through Cognito
   - Menu item creation
   - Employee management
   - Analytics viewing

2. **Monitor costs:**
   - DynamoDB on-demand pricing
   - Cognito pricing
   - Data transfer costs

3. **Set up monitoring:**
   - CloudWatch logs
   - DynamoDB metrics
   - Error tracking

---

## 💡 **Pro Tips**

1. **Use DynamoDB Local for Development**
   - Faster development cycles
   - No AWS costs during testing

2. **Set up CloudWatch Alarms**
   - Monitor DynamoDB throttling
   - Track error rates

3. **Implement Data Backup**
   - Enable point-in-time recovery
   - Set up cross-region replication

4. **Optimize Costs**
   - Use on-demand billing for variable workloads
   - Monitor read/write capacity usage

---

## 🆘 **Need Help?**

If you encounter issues:

1. **Check AWS CloudWatch Logs**
2. **Verify IAM permissions**
3. **Test with AWS CLI**
4. **Check network connectivity**

Your POS system is now ready to use with AWS Cognito authentication and DynamoDB data storage! 🎉
