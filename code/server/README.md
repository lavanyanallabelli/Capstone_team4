# POS System Backend API

A comprehensive backend API for the Point of Sale (POS) system built with Node.js, Express, and AWS DynamoDB.

## Features

- **Authentication & Authorization**: JWT-based authentication with role-based access control
- **Menu Management**: Full CRUD operations for menu items and categories
- **Employee Management**: Create, update, and manage employee accounts
- **Analytics**: Sales analytics, performance tracking, and reporting
- **Settings**: Restaurant configuration, payment gateway setup, and notifications
- **AWS Integration**: DynamoDB for data storage with automatic table creation

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: AWS DynamoDB
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Joi
- **Security**: Helmet, CORS, Rate Limiting

## Prerequisites

- Node.js (v16 or higher)
- AWS Account with DynamoDB access
- AWS CLI configured (optional)

## Installation

1. **Navigate to the server directory**:
   ```bash
   cd code/server
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` file with your configuration:
   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development
   FRONTEND_URL=http://localhost:3000

   # AWS Configuration
   AWS_REGION=us-east-1
   AWS_ACCESS_KEY_ID=your_aws_access_key_id
   AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key

   # JWT Configuration
   JWT_SECRET=your_super_secret_jwt_key_here
   JWT_EXPIRES_IN=24h

   # DynamoDB Table Names
   DYNAMODB_USERS_TABLE=pos-users
   DYNAMODB_MENU_ITEMS_TABLE=pos-menu-items
   DYNAMODB_EMPLOYEES_TABLE=pos-employees
   DYNAMODB_ORDERS_TABLE=pos-orders
   DYNAMODB_ANALYTICS_TABLE=pos-analytics
   DYNAMODB_SETTINGS_TABLE=pos-settings
   ```

## AWS Setup

### 1. Create AWS Account
- Sign up for AWS account at [aws.amazon.com](https://aws.amazon.com)
- Complete the account verification process

### 2. Create IAM User
- Go to AWS IAM Console
- Create a new user with programmatic access
- Attach the following policies:
  - `AmazonDynamoDBFullAccess`
  - `AmazonDynamoDBReadOnlyAccess` (optional, for read-only operations)

### 3. Get AWS Credentials
- Download the CSV file with Access Key ID and Secret Access Key
- Use these credentials in your `.env` file

### 4. DynamoDB Tables
The application will automatically create the following tables on first run:
- `pos-users` - User accounts and authentication
- `pos-menu-items` - Restaurant menu items
- `pos-employees` - Employee accounts
- `pos-orders` - Order transactions
- `pos-analytics` - Analytics data
- `pos-settings` - Restaurant settings

## Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will start on `http://localhost:5000` (or the port specified in your `.env` file).

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new business owner
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/employee-login` - Employee login with ID/password
- `POST /api/auth/logout` - Logout
- `GET /api/auth/verify` - Verify JWT token
- `POST /api/auth/change-password` - Change password

### Menu Management
- `GET /api/menu` - Get all menu items
- `GET /api/menu/:itemId` - Get specific menu item
- `POST /api/menu` - Create new menu item
- `PUT /api/menu/:itemId` - Update menu item
- `DELETE /api/menu/:itemId` - Delete menu item
- `PATCH /api/menu/:itemId/availability` - Toggle item availability
- `GET /api/menu/categories/list` - Get menu categories
- `GET /api/menu/stats/overview` - Get menu statistics

### Employee Management
- `GET /api/employees` - Get all employees
- `GET /api/employees/:employeeId` - Get specific employee
- `POST /api/employees` - Create new employee
- `PUT /api/employees/:employeeId` - Update employee
- `PATCH /api/employees/:employeeId/status` - Activate/deactivate employee
- `POST /api/employees/:employeeId/reset-password` - Reset employee password
- `GET /api/employees/:employeeId/performance` - Get employee performance
- `GET /api/employees/:employeeId/activity` - Get employee activity log
- `GET /api/employees/stats/overview` - Get employee statistics

### Analytics
- `GET /api/analytics/sales` - Get sales analytics
- `GET /api/analytics/top-items` - Get top selling items
- `GET /api/analytics/employee-performance` - Get employee performance analytics
- `GET /api/analytics/revenue-breakdown` - Get revenue breakdown
- `GET /api/analytics/customers` - Get customer analytics
- `GET /api/analytics/overview` - Get analytics overview

### Settings
- `GET /api/settings` - Get all settings
- `GET /api/settings/:settingType` - Get specific setting type
- `PUT /api/settings/general` - Update general settings
- `PUT /api/settings/hours` - Update hours settings
- `PUT /api/settings/payment` - Update payment settings
- `PUT /api/settings/notifications` - Update notification settings
- `POST /api/settings/initialize` - Initialize default settings
- `POST /api/settings/payment/test` - Test payment gateway
- `POST /api/settings/notifications/test` - Send test notification

## Role-Based Access Control

### Owner Role
- Full access to all features
- Can manage employees, menu, analytics, and settings
- Can view all data and reports

### Employee Role
- Limited access to operational features
- Can take orders, process payments, view menu
- Cannot access analytics or settings

## Error Handling

The API uses consistent error response format:
```json
{
  "success": false,
  "error": "Error type",
  "message": "Detailed error message"
}
```

## Security Features

- JWT token authentication
- Role-based authorization
- Input validation with Joi
- CORS protection
- Helmet security headers
- Rate limiting (configurable)

## Development

### Project Structure
```
server/
├── config/
│   └── dynamodb.js          # DynamoDB configuration
├── middleware/
│   └── auth.js              # Authentication middleware
├── routes/
│   ├── auth.js              # Authentication routes
│   ├── menu.js              # Menu management routes
│   ├── employees.js         # Employee management routes
│   ├── analytics.js         # Analytics routes
│   └── settings.js          # Settings routes
├── server.js                # Main server file
├── package.json             # Dependencies
└── README.md               # This file
```

### Adding New Features

1. Create new route file in `routes/` directory
2. Add route to `server.js`
3. Update authentication middleware if needed
4. Add validation schemas
5. Update API documentation

## Deployment

### Environment Variables for Production
```env
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://your-frontend-domain.com
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_production_access_key
AWS_SECRET_ACCESS_KEY=your_production_secret_key
JWT_SECRET=your_production_jwt_secret
```

### AWS Deployment Options
- **EC2**: Deploy on AWS EC2 instance
- **Elastic Beanstalk**: Use AWS Elastic Beanstalk for easy deployment
- **Lambda**: Convert to serverless functions
- **ECS**: Deploy using Docker containers

## Monitoring and Logging

- Use AWS CloudWatch for monitoring
- Implement structured logging
- Set up health checks
- Monitor DynamoDB performance

## Support

For issues and questions:
1. Check the logs for error details
2. Verify AWS credentials and permissions
3. Ensure DynamoDB tables are created
4. Check environment variables

## License

MIT License - see LICENSE file for details.
