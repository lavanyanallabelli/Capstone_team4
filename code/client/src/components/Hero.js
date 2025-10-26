import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Play, DollarSign, ShoppingCart, TrendingUp } from 'lucide-react';
import { useInView } from 'react-intersection-observer';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const Hero = () => {
    const [ref, inView] = useInView({
        triggerOnce: true,
        threshold: 0.1,
    });
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    const stats = [
        { number: '100+', label: 'Beta Users' },
        { number: '30 Days', label: 'Free Trial' },
        { number: '24/7', label: 'Support' },
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2,
                delayChildren: 0.1,
            },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.6,
                ease: 'easeOut',
            },
        },
    };

    return (
        <section className="relative min-h-screen flex items-center bg-gradient-to-br from-primary-600 via-secondary-600 to-accent-600 overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-hero-pattern opacity-20"></div>

            {/* Floating Elements */}
            <div className="absolute inset-0 overflow-hidden">
                <motion.div
                    className="absolute top-20 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl"
                    animate={{
                        x: [0, 30, 0],
                        y: [0, -30, 0],
                    }}
                    transition={{
                        duration: 8,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                />
                <motion.div
                    className="absolute bottom-20 right-10 w-96 h-96 bg-white/5 rounded-full blur-3xl"
                    animate={{
                        x: [0, -40, 0],
                        y: [0, 40, 0],
                    }}
                    transition={{
                        duration: 10,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                />
            </div>

            <div className="container relative z-10 pt-20">
                <motion.div
                    ref={ref}
                    variants={containerVariants}
                    initial="hidden"
                    animate={inView ? "visible" : "hidden"}
                    className="grid lg:grid-cols-2 gap-12 items-center"
                >
                    {/* Left Content */}
                    <div className="text-white">
                        <motion.h1
                            variants={itemVariants}
                            className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6"
                        >
                            Streamline Your Business with{' '}
                            <span className="bg-gradient-to-r from-accent-300 to-yellow-300 bg-clip-text text-transparent">
                                Smart POS
                            </span>
                        </motion.h1>

                        <motion.p
                            variants={itemVariants}
                            className="text-lg md:text-xl text-blue-100 mb-8 leading-relaxed max-w-2xl"
                        >
                            Transform your retail experience with our cutting-edge Point of Sale system.
                            Manage inventory, process payments, and grow your business with powerful analytics
                            and real-time insights.
                        </motion.p>

                        <motion.div
                            variants={itemVariants}
                            className="flex flex-col sm:flex-row gap-4 mb-12"
                        >
                            {currentUser ? (
                                <motion.button
                                    onClick={() => navigate('/dashboard')}
                                    className="btn btn-large bg-white text-primary-600 hover:bg-gray-100 font-semibold shadow-lg group"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    Go to Dashboard
                                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                                </motion.button>
                            ) : (
                                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                    <Link
                                        to="/signup"
                                        className="btn btn-large bg-white text-primary-600 hover:bg-gray-100 font-semibold shadow-lg group"
                                    >
                                        Start Free Trial
                                        <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                                    </Link>
                                </motion.div>
                            )}
                            <motion.button
                                onClick={() => {
                                    // For now, just scroll to features - you can add a demo video later
                                    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                                }}
                                className="btn btn-large border-2 border-white text-white hover:bg-white hover:text-primary-600 font-semibold group"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <Play className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                                Learn More
                            </motion.button>
                        </motion.div>

                        <motion.div
                            variants={itemVariants}
                            className="grid grid-cols-3 gap-8"
                        >
                            {stats.map((stat, index) => (
                                <motion.div
                                    key={index}
                                    className="text-center"
                                    variants={itemVariants}
                                >
                                    <div className="text-2xl md:text-3xl font-bold text-accent-300 mb-1">
                                        {stat.number}
                                    </div>
                                    <div className="text-sm text-blue-200">
                                        {stat.label}
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>

                    {/* Right Content - Dashboard Mockup */}
                    <motion.div
                        variants={itemVariants}
                        className="flex justify-center lg:justify-end"
                    >
                        <motion.div
                            className="relative w-full max-w-md lg:max-w-lg"
                            initial={{ rotateY: 25, rotateX: 10 }}
                            animate={inView ? { rotateY: 0, rotateX: 0 } : {}}
                            transition={{ duration: 0.8, delay: 0.3 }}
                        >
                            {/* Dashboard Container */}
                            <div className="glass rounded-3xl p-6 shadow-2xl">
                                {/* Header */}
                                <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/20">
                                    <div className="flex space-x-2">
                                        <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                                        <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                                        <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                                    </div>
                                    <span className="text-white font-medium text-sm">POS Dashboard</span>
                                </div>

                                {/* Chart Section */}
                                <div className="bg-white/10 rounded-2xl p-4 mb-6">
                                    <div className="flex items-end justify-between h-24 space-x-2">
                                        {[60, 80, 45, 90, 70, 85, 65].map((height, index) => (
                                            <motion.div
                                                key={index}
                                                className="bg-gradient-to-t from-accent-400 to-yellow-300 rounded-t-sm flex-1 min-w-0"
                                                style={{ height: `${height}%` }}
                                                initial={{ height: 0 }}
                                                animate={inView ? { height: `${height}%` } : {}}
                                                transition={{ duration: 0.6, delay: 0.5 + index * 0.1 }}
                                            />
                                        ))}
                                    </div>
                                </div>

                                {/* Stats Cards */}
                                <div className="grid grid-cols-2 gap-4">
                                    <motion.div
                                        className="bg-white/10 rounded-xl p-4 flex items-center space-x-3"
                                        initial={{ x: -50, opacity: 0 }}
                                        animate={inView ? { x: 0, opacity: 1 } : {}}
                                        transition={{ duration: 0.6, delay: 0.8 }}
                                    >
                                        <div className="w-10 h-10 bg-green-400 rounded-lg flex items-center justify-center">
                                            <DollarSign className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <div className="text-white font-semibold">$12,450</div>
                                            <div className="text-white/70 text-xs">Revenue</div>
                                        </div>
                                    </motion.div>

                                    <motion.div
                                        className="bg-white/10 rounded-xl p-4 flex items-center space-x-3"
                                        initial={{ x: 50, opacity: 0 }}
                                        animate={inView ? { x: 0, opacity: 1 } : {}}
                                        transition={{ duration: 0.6, delay: 0.9 }}
                                    >
                                        <div className="w-10 h-10 bg-blue-400 rounded-lg flex items-center justify-center">
                                            <ShoppingCart className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <div className="text-white font-semibold">234</div>
                                            <div className="text-white/70 text-xs">Orders</div>
                                        </div>
                                    </motion.div>
                                </div>

                                {/* Floating Indicators */}
                                <motion.div
                                    className="absolute -top-4 -right-4 w-8 h-8 bg-green-400 rounded-full flex items-center justify-center shadow-lg"
                                    animate={{
                                        scale: [1, 1.2, 1],
                                        boxShadow: [
                                            '0 0 0 0 rgba(34, 197, 94, 0.7)',
                                            '0 0 0 10px rgba(34, 197, 94, 0)',
                                            '0 0 0 0 rgba(34, 197, 94, 0)',
                                        ],
                                    }}
                                    transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                    }}
                                >
                                    <TrendingUp className="w-4 h-4 text-white" />
                                </motion.div>
                            </div>
                        </motion.div>
                    </motion.div>
                </motion.div>
            </div>

        </section>
    );
};

export default Hero;