import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Homepage from './components/Homepage';
import Dashboard from './components/Dashboard';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import PricingPage from './pages/PricingPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import EmailVerification from './components/auth/EmailVerification';
import ResetPasswordConfirm from './components/auth/ResetPasswordConfirm';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ProtectedRoute from './components/ProtectedRoute';
import DebugAuth from './components/DebugAuth';
import EmployeeManagement from './components/EmployeeManagement';
import MenuManagement from './components/MenuManagement';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import RestaurantSettings from './components/RestaurantSettings';
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
                        <Route path="/signup" element={<SignupPage />} />
                        <Route path="/verify-email" element={<EmailVerification />} />
                        <Route path="/reset-password" element={<ResetPasswordPage />} />
                        <Route path="/reset-password-confirm" element={<ResetPasswordConfirm />} />
                        <Route path="/debug-auth" element={<DebugAuth />} />
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
                            path="/menu/manage"
                            element={
                                <ProtectedRoute>
                                    <MenuManagement />
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
