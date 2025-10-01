import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, Menu, X, User, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const Navbar = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);

    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navItems = [
        { href: '/#features', label: 'Features' },
        { href: '/pricing', label: 'Pricing' },
        { href: '/about', label: 'About' },
        { href: '/contact', label: 'Contact' },
    ];

    return (
        <motion.nav
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled
                ? 'bg-white/95 backdrop-blur-lg shadow-lg border-b border-gray-200/50'
                : 'bg-white/90 backdrop-blur-sm'
                }`}
        >
            <div className="container">
                <div className="flex items-center justify-between h-16 lg:h-20">
                    {/* Brand */}
                    <Link to="/">
                        <motion.div
                            className="flex items-center space-x-3"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-xl">
                                <CreditCard className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                                POS Pro
                            </span>
                        </motion.div>
                    </Link>

                    {/* Desktop Menu */}
                    <div className="hidden lg:flex items-center space-x-8">
                        {navItems.map((item, index) => (
                            <motion.div
                                key={item.href}
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                whileHover={{ y: -2 }}
                            >
                                <Link
                                    to={item.href}
                                    className="text-gray-700 hover:text-primary-600 font-medium transition-colors duration-200 relative group"
                                >
                                    {item.label}
                                    <span className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-primary-600 to-secondary-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200"></span>
                                </Link>
                            </motion.div>
                        ))}
                    </div>

                    {/* Desktop Actions */}
                    <div className="hidden lg:flex items-center space-x-4">
                        {currentUser ? (
                            <>
                                <motion.button
                                    onClick={() => navigate('/dashboard')}
                                    className="flex items-center space-x-2 text-gray-700 hover:text-primary-600 font-medium transition-colors duration-200"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <User className="w-4 h-4" />
                                    <span>Dashboard</span>
                                </motion.button>
                                <motion.button
                                    onClick={async () => {
                                        await logout();
                                        navigate('/');
                                    }}
                                    className="flex items-center space-x-2 text-gray-700 hover:text-red-600 font-medium transition-colors duration-200"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <LogOut className="w-4 h-4" />
                                    <span>Logout</span>
                                </motion.button>
                            </>
                        ) : (
                            <>
                                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                    <Link
                                        to="/login"
                                        className="text-gray-700 hover:text-primary-600 font-medium transition-colors duration-200"
                                    >
                                        Login
                                    </Link>
                                </motion.div>
                                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                    <Link
                                        to="/signup"
                                        className="btn btn-primary"
                                    >
                                        Get Started
                                    </Link>
                                </motion.div>
                            </>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <motion.button
                        className="lg:hidden flex items-center justify-center w-10 h-10 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        whileTap={{ scale: 0.95 }}
                    >
                        <AnimatePresence mode="wait">
                            {isMenuOpen ? (
                                <motion.div
                                    key="close"
                                    initial={{ rotate: -90, opacity: 0 }}
                                    animate={{ rotate: 0, opacity: 1 }}
                                    exit={{ rotate: 90, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <X className="w-6 h-6 text-gray-700" />
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="menu"
                                    initial={{ rotate: 90, opacity: 0 }}
                                    animate={{ rotate: 0, opacity: 1 }}
                                    exit={{ rotate: -90, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <Menu className="w-6 h-6 text-gray-700" />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.button>
                </div>

                {/* Mobile Menu */}
                <AnimatePresence>
                    {isMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="lg:hidden overflow-hidden"
                        >
                            <div className="py-4 space-y-4 border-t border-gray-200">
                                {navItems.map((item, index) => (
                                    <motion.div
                                        key={item.href}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                    >
                                        <Link
                                            to={item.href}
                                            className="block text-gray-700 hover:text-primary-600 font-medium transition-colors duration-200 py-2"
                                            onClick={() => setIsMenuOpen(false)}
                                        >
                                            {item.label}
                                        </Link>
                                    </motion.div>
                                ))}
                                <div className="pt-4 space-y-3 border-t border-gray-200">
                                    {currentUser ? (
                                        <>
                                            <motion.button
                                                onClick={() => {
                                                    navigate('/dashboard');
                                                    setIsMenuOpen(false);
                                                }}
                                                className="flex items-center justify-center space-x-2 w-full py-2 text-gray-700 hover:text-primary-600 font-medium transition-colors duration-200"
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.4 }}
                                            >
                                                <User className="w-4 h-4" />
                                                <span>Dashboard</span>
                                            </motion.button>
                                            <motion.button
                                                onClick={async () => {
                                                    await logout();
                                                    navigate('/');
                                                    setIsMenuOpen(false);
                                                }}
                                                className="flex items-center justify-center space-x-2 w-full py-2 text-gray-700 hover:text-red-600 font-medium transition-colors duration-200"
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.5 }}
                                            >
                                                <LogOut className="w-4 h-4" />
                                                <span>Logout</span>
                                            </motion.button>
                                        </>
                                    ) : (
                                        <>
                                            <motion.div
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.4 }}
                                            >
                                                <Link
                                                    to="/login"
                                                    className="block text-center py-2 w-full text-gray-700 hover:text-primary-600 font-medium transition-colors duration-200"
                                                    onClick={() => setIsMenuOpen(false)}
                                                >
                                                    Login
                                                </Link>
                                            </motion.div>
                                            <motion.div
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.5 }}
                                            >
                                                <Link
                                                    to="/signup"
                                                    className="btn btn-primary w-full justify-center"
                                                    onClick={() => setIsMenuOpen(false)}
                                                >
                                                    Get Started
                                                </Link>
                                            </motion.div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

        </motion.nav>
    );
};

export default Navbar;
