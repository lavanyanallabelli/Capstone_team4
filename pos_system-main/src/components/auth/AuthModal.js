import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import LoginForm from './LoginForm';
import SignupForm from './SignupForm';
import ResetPasswordForm from './ResetPasswordForm';

const AuthModal = ({ isOpen, onClose, initialView = 'login' }) => {
    const [currentView, setCurrentView] = useState(initialView);

    if (!isOpen) return null;

    const modalVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1 },
        exit: { opacity: 0 }
    };

    const contentVariants = {
        hidden: { opacity: 0, scale: 0.95, y: 20 },
        visible: { opacity: 1, scale: 1, y: 0 },
        exit: { opacity: 0, scale: 0.95, y: 20 }
    };

    const handleClose = () => {
        setCurrentView(initialView);
        onClose();
    };

    return (
        <AnimatePresence>
            <motion.div
                variants={modalVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
                {/* Backdrop */}
                <motion.div
                    className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                    onClick={handleClose}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                />

                {/* Modal Content */}
                <motion.div
                    variants={contentVariants}
                    className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 max-h-[90vh] overflow-y-auto"
                >
                    {/* Close Button */}
                    <button
                        onClick={handleClose}
                        className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>

                    {/* Form Content */}
                    <AnimatePresence mode="wait">
                        {currentView === 'login' && (
                            <LoginForm
                                key="login"
                                onClose={handleClose}
                                onSwitchToSignup={() => setCurrentView('signup')}
                                onSwitchToReset={() => setCurrentView('reset')}
                            />
                        )}
                        {currentView === 'signup' && (
                            <SignupForm
                                key="signup"
                                onClose={handleClose}
                                onSwitchToLogin={() => setCurrentView('login')}
                            />
                        )}
                        {currentView === 'reset' && (
                            <ResetPasswordForm
                                key="reset"
                                onClose={handleClose}
                                onSwitchToLogin={() => setCurrentView('login')}
                            />
                        )}
                    </AnimatePresence>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default AuthModal;
