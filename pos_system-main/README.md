# POS Pro - Point of Sale System

A modern, responsive Point of Sale system built with React, Express, Node.js, Firebase, and styled with Tailwind CSS.

## ✨ Features

- 🎨 **Modern UI Design** - Built with Tailwind CSS and Framer Motion animations
- 💳 **Payment Processing** - Accept all payment methods securely
- 📦 **Inventory Management** - Real-time stock tracking and alerts
- 📊 **Analytics & Reports** - Detailed business insights and metrics
- 👥 **Customer Management** - Build profiles and loyalty programs
- ☁️ **Cloud-Based** - Secure cloud storage with automatic backups
- 📱 **Multi-Platform** - Responsive design for all devices
- 🔒 **Secure Authentication** - Firebase-powered user management
- 🚀 **Smooth Animations** - Enhanced UX with Framer Motion
- 🎯 **Modern Icons** - Beautiful Lucide React icons

## 🛠 Tech Stack

- **Frontend**: React 18, Tailwind CSS, Framer Motion
- **Backend**: Node.js, Express.js
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Storage**: Firebase Storage
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **Styling**: Tailwind CSS with custom design system
- **Deployment**: Ready for Vercel/Netlify

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Firebase account

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd capstone
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Firebase**
   - Create a new Firebase project at [Firebase Console](https://console.firebase.google.com)
   - Enable Authentication and Firestore Database
   - Copy your Firebase configuration
   - Create a `.env` file based on `env.example`
   - Add your Firebase configuration to the `.env` file

4. **Start the development servers**
   ```bash
   # Start both frontend and backend
   npm run dev
   
   # Or start them separately:
   # Frontend (React)
   npm start
   
   # Backend (Express)
   npm run server
   ```

5. **Open your browser**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## Project Structure

```
capstone/
├── public/                 # Static files
├── src/
│   ├── components/        # React components
│   │   ├── Homepage.js    # Main homepage component
│   │   ├── Navbar.js      # Navigation bar
│   │   ├── Hero.js        # Hero section
│   │   ├── Features.js    # Features section
│   │   ├── Stats.js       # Statistics section
│   │   ├── CTA.js         # Call-to-action section
│   │   └── Footer.js      # Footer component
│   ├── firebase/          # Firebase configuration
│   ├── App.js             # Main App component
│   └── index.js           # Entry point
├── server.js              # Express server
├── package.json           # Dependencies and scripts
└── README.md             # This file
```

## Available Scripts

- `npm start` - Start React development server
- `npm run server` - Start Express backend server
- `npm run dev` - Start both frontend and backend concurrently
- `npm run build` - Build React app for production
- `npm test` - Run tests

## API Endpoints

- `GET /api/health` - Health check
- `GET /api/dashboard/stats` - Dashboard statistics
- `GET /api/products` - Get products
- `POST /api/auth/signup` - User signup

## Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project
3. Enable the following services:
   - Authentication (Email/Password)
   - Firestore Database
   - Storage
4. Get your Firebase config and add to `.env` file

## Deployment

### Frontend (Vercel/Netlify)
1. Build the project: `npm run build`
2. Deploy the `build` folder

### Backend (Heroku/Railway)
1. Ensure `server.js` is configured for production
2. Set environment variables
3. Deploy

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, email support@pospro.com or create an issue in the repository.
