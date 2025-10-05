# POS System

A modern Point of Sale system built with React frontend and Express.js backend.

## Project Structure

```
pos_system-main/
├── client/                 # React frontend application
│   ├── src/               # React source code
│   ├── public/            # Public assets
│   ├── build/             # Production build
│   ├── package.json       # Frontend dependencies
│   ├── tailwind.config.js # Tailwind CSS configuration
│   └── postcss.config.js  # PostCSS configuration
├── server/                # Express.js backend
│   ├── server.js          # Main server file
│   ├── env.example        # Environment variables example
│   └── package.json       # Backend dependencies
├── package.json           # Root package.json with workspace scripts
└── README.md             # This file
```

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm

### Installation

1. Install all dependencies:
```bash
npm run install:all
```

Or install individually:
```bash
# Install root dependencies
npm install

# Install client dependencies
npm run install:client

# Install server dependencies
npm run install:server
```

### Development

Start both client and server in development mode:
```bash
npm run dev
```

Or start them individually:
```bash
# Start client only (React app on port 3000)
npm run dev:client

# Start server only (Express API on port 8000)
npm run dev:server
```

### Production

Build the client for production:
```bash
npm run build:client
```

Start the server in production:
```bash
npm run start:server
```

## API Endpoints

- `GET /api/health` - Health check
- `GET /api/dashboard/stats` - Dashboard statistics
- `GET /api/products` - Get products
- `POST /api/auth/signup` - User signup

## Environment Variables

Copy `server/env.example` to `server/.env` and configure your environment variables.

## Technologies Used

### Frontend
- React 18
- React Router
- Tailwind CSS
- Framer Motion
- Firebase
- Lucide React

### Backend
- Express.js
- CORS
- dotenv

## Scripts

- `npm run install:all` - Install all dependencies
- `npm run dev` - Start both client and server in development
- `npm run start:client` - Start client only
- `npm run start:server` - Start server only
- `npm run build:client` - Build client for production