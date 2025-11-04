import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Homepage from './components/Homepage';
import Dashboard from './components/Dashboard';
import EmployeeManagement from './components/EmployeeManagement';
import MenuManagement from './components/MenuManagement';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import RestaurantSettings from './components/RestaurantSettings';
import ScheduleManagement from './components/ScheduleManagement';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import PricingPage from './pages/PricingPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import POSPage from './pages/POSPage';
import EmployeeLoginPage from './pages/EmployeeLoginPage';
import EmailVerification from './components/auth/EmailVerification';
import ResetPasswordConfirm from './components/auth/ResetPasswordConfirm';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

function App() {
    return (
        <AuthProvider>
            <Router>
                <div className="App">
                    <Routes>
                        <Route path="/" element={<Homepage />} />
                        <Route path="/pricing" element={<PricingPage />} />
                        <Route path="/about" element={<AboutPage />} />
                        <Route path="/contact" element={<ContactPage />} />
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/employee-login" element={<EmployeeLoginPage />} />
                        <Route path="/signup" element={<SignupPage />} />
                        <Route path="/verify-email" element={<EmailVerification />} />
                        <Route path="/reset-password" element={<ResetPasswordPage />} />
                        <Route path="/reset-password-confirm" element={<ResetPasswordConfirm />} />
                        <Route
                            path="/dashboard"
                            element={
                                <ProtectedRoute>
                                    <Dashboard />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/employees"
                            element={
                                <ProtectedRoute>
                                    <EmployeeManagement />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/schedules"
                            element={
                                <ProtectedRoute>
                                    <ScheduleManagement />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/analytics"
                            element={
                                <ProtectedRoute>
                                    <AnalyticsDashboard />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/menu"
                            element={
                                <ProtectedRoute>
                                    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                                        <div className="text-center">
                                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Menu View</h2>
                                            <p className="text-gray-600">Coming soon! This will show the restaurant menu for employees.</p>
                                        </div>
                                    </div>
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/menu/manage"
                            element={
                                <ProtectedRoute>
                                    <MenuManagement />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/pos"
                            element={
                                <ProtectedRoute>
                                    <POSPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/orders/new"
                            element={
                                <ProtectedRoute>
                                    <POSPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/orders/online"
                            element={
                                <ProtectedRoute>
                                    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                                        <div className="text-center">
                                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Online Orders</h2>
                                            <p className="text-gray-600">Coming soon! This will show online orders to process.</p>
                                        </div>
                                    </div>
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/payments"
                            element={
                                <ProtectedRoute>
                                    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                                        <div className="text-center">
                                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Processing</h2>
                                            <p className="text-gray-600">Coming soon! This will allow you to process payments.</p>
                                        </div>
                                    </div>
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/settings"
                            element={
                                <ProtectedRoute>
                                    <RestaurantSettings />
                                </ProtectedRoute>
                            }
                        />
                    </Routes>
                </div>
            </Router>
        </AuthProvider>
    );
}

export default App;
