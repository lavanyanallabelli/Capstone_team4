# POS System

A modern Point of Sale system built with React frontend and Express.js backend.

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm (v8 or higher)
- AWS Account (for Cognito authentication and PostgreSQL RDS)
- PostgreSQL Database (Amazon RDS recommended)

### Step-by-Step Setup

#### Step 1: Clone the Repository
Clone this repository to your local machine:
```bash
git clone https://github.com/lavanyanallabelli/Capstone_team4.git
cd Capstone_team4/code
```

#### Step 2: Install Server Dependencies
Open the `server` folder in command line and run:
```bash
cd server
npm install express cors dotenv sequelize pg pg-hstore bcryptjs jsonwebtoken jwks-rsa aws-sdk nodemailer multer compression helmet morgan joi express-rate-limit uuid --save
npm install nodemon eslint jest supertest --save-dev
```

#### Step 3: Install Client Dependencies
Open the `client` folder in command line and run:
```bash
cd ../client
npm install react react-dom react-router-dom react-scripts aws-amplify @aws-amplify/ui-react framer-motion lucide-react react-intersection-observer clsx --save
npm install tailwindcss postcss autoprefixer --save-dev
```

**OR Install All Dependencies at Once:**
From the `code` folder, run:
```bash
npm run install:all
```

#### Step 4: Configure Environment Variables

**Server Configuration:**
1. Copy the example environment file:
   ```bash
   cd server
   copy env.example .env
   ```
   (On Linux/Mac: `cp env.example .env`)

2. Open `server/.env` and update the following:
   - **PostgreSQL Database Credentials:**
     - `DB_HOST` - Your RDS endpoint
     - `DB_PORT` - Usually 5432
     - `DB_USER` - Your database username
     - `DB_PASSWORD` - Your database password
     - `DB_NAME` - Database name (e.g., posdb)
   
   - **AWS Cognito Configuration:**
     - `AWS_REGION` - Your AWS region (e.g., us-east-1)
     - `AWS_USER_POOL_ID` - Your Cognito User Pool ID
     - `AWS_USER_POOL_WEB_CLIENT_ID` - Your Cognito Client ID
     - `JWKS_URI` - Your Cognito JWKS URI
     - `AWS_ACCESS_KEY_ID` - Your AWS Access Key
     - `AWS_SECRET_ACCESS_KEY` - Your AWS Secret Key
   
   - **Email Configuration (Optional):**
     - `SMTP_HOST` - SMTP server (e.g., smtp.gmail.com)
     - `SMTP_PORT` - SMTP port (usually 587)
     - `SMTP_USER` - Your email address
     - `SMTP_PASS` - Your email app password

**Client Configuration:**
1. Create `.env` file in the `client` folder:
   ```bash
   cd ../client
   ```
   
2. Add the following variables to `client/.env`:
   ```
   REACT_APP_AWS_REGION=us-east-1
   REACT_APP_USER_POOL_ID=your_cognito_user_pool_id
   REACT_APP_USER_POOL_WEB_CLIENT_ID=your_cognito_client_id
   REACT_APP_OAUTH_DOMAIN=your-domain.auth.us-east-1.amazoncognito.com
   REACT_APP_REDIRECT_SIGN_IN=http://localhost:3000/
   REACT_APP_REDIRECT_SIGN_OUT=http://localhost:3000/
   REACT_APP_API_URL=http://localhost:5000/api
   ```

#### Step 5: Set Up Database
1. Create a PostgreSQL database (using Amazon RDS or local PostgreSQL)
2. Update the database credentials in `server/.env` (as mentioned in Step 4)
3. The application will automatically create tables on first run using Sequelize

#### Step 6: Run the Application

**Option 1: Run Both Server and Client Together**
From the `code` folder:
```bash
npm run dev
```

**Option 2: Run Separately**

1. **Start the Server:**
   Go to `server` folder in PowerShell/Command Line and enter:
   ```bash
   cd server
   npm run dev
   ```
   The server will start on `http://localhost:5000`

2. **Start the Client:**
   Go to `client` folder in PowerShell/Command Line and enter:
   ```bash
   cd client
   npm start
   ```
   The client will start on `http://localhost:3000`

### Quick Start (All-in-One)
```bash
# From the code folder
npm run install:all    # Install all dependencies
npm run dev            # Start both server and client
```

## Summary of Installation Steps

1. ✅ Clone the repository
2. ✅ Install server dependencies: `cd server && npm install`
3. ✅ Install client dependencies: `cd client && npm install`
4. ✅ Configure `server/.env` with database and AWS credentials
5. ✅ Configure `client/.env` with AWS Cognito settings
6. ✅ Set up PostgreSQL database
7. ✅ Run server: `cd server && npm run dev`
8. ✅ Run client: `cd client && npm start`

## API Endpoints

- `GET /api/health` - Health check
- `GET /api/dashboard/stats` - Dashboard statistics
- `GET /api/menu` - Get menu items
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/orders` - Create order
- `GET /api/analytics/overview` - Analytics overview

For complete API documentation, see `code/server/README.md`

## Environment Variables

**Server:** Copy `code/server/env.example` to `code/server/.env` and configure:
- PostgreSQL database credentials
- AWS Cognito configuration
- AWS credentials
- Email/SMTP settings (optional)

**Client:** Create `code/client/.env` with:
- AWS Cognito User Pool ID
- AWS Cognito Client ID
- API URL

## Technologies Used

### Frontend
- React 18
- React Router DOM
- Tailwind CSS
- Framer Motion
- AWS Amplify
- Lucide React

### Backend
- Express.js
- Sequelize ORM
- PostgreSQL
- AWS SDK
- JWT Authentication
- Nodemailer

## Available Scripts

**From `code` folder:**
- `npm run install:all` - Install all dependencies (root, client, server)
- `npm run dev` - Start both client and server in development mode
- `npm run dev:client` - Start client only (port 3000)
- `npm run dev:server` - Start server only (port 5000)
- `npm run build:client` - Build client for production
- `npm run start:server` - Start server in production mode

**From `code/server` folder:**
- `npm run dev` - Start server with nodemon (auto-reload)
- `npm start` - Start server in production mode
- `npm test` - Run tests

**From `code/client` folder:**
- `npm start` - Start React development server
- `npm run build` - Build for production
- `npm test` - Run tests
