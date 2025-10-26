import React from 'react';
import { motion } from 'framer-motion';
import {
    CreditCard,
    Package,
    BarChart3,
    Users,
    Cloud,
    Smartphone,
    CheckCircle,
    Monitor,
    Tablet,
    Phone
} from 'lucide-react';
import { useInView } from 'react-intersection-observer';

const Features = () => {
    const [ref, inView] = useInView({
        triggerOnce: true,
        threshold: 0.1,
    });

    const features = [
        {
            icon: CreditCard,
            title: 'Payment Processing',
            description: 'Accept all payment methods including credit cards, mobile payments, and contactless transactions with secure encryption.',
            color: 'from-blue-500 to-blue-600'
        },
        {
            icon: Package,
            title: 'Inventory Management',
            description: 'Track stock levels in real-time, get low-stock alerts, and manage suppliers with our intelligent inventory system.',
            color: 'from-purple-500 to-purple-600'
        },
        {
            icon: BarChart3,
            title: 'Analytics & Reports',
            description: 'Gain insights into your business with detailed sales reports, customer analytics, and performance metrics.',
            color: 'from-indigo-500 to-indigo-600'
        },
        {
            icon: Users,
            title: 'Customer Management',
            description: 'Build customer profiles, track purchase history, and create loyalty programs to increase retention.',
            color: 'from-green-500 to-green-600'
        },
        {
            icon: Cloud,
            title: 'Cloud-Based',
            description: 'Access your data anywhere, anytime with secure cloud storage and automatic backups.',
            color: 'from-pink-500 to-pink-600'
        },
        {
            icon: Smartphone,
            title: 'Multi-Platform',
            description: 'Works seamlessly across desktop, tablet, and mobile devices for maximum flexibility.',
            color: 'from-yellow-500 to-yellow-600'
        }
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2,
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
        <section id="features" className="section bg-white relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute inset-0 bg-gradient-to-b from-gray-50/50 to-white"></div>
            <div className="absolute top-10 left-10 w-72 h-72 bg-primary-100 rounded-full blur-3xl opacity-30"></div>
            <div className="absolute bottom-10 right-10 w-72 h-72 bg-secondary-100 rounded-full blur-3xl opacity-30"></div>

            <div className="container relative z-10">
                <motion.div
                    ref={ref}
                    variants={containerVariants}
                    initial="hidden"
                    animate={inView ? "visible" : "hidden"}
                    className="text-center mb-16"
                >
                    <motion.h2
                        variants={itemVariants}
                        className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6"
                    >
                        Powerful Features for{' '}
                        <span className="gradient-text">Modern Business</span>
                    </motion.h2>
                    <motion.p
                        variants={itemVariants}
                        className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed"
                    >
                        Everything you need to run your business efficiently, all in one comprehensive platform
                    </motion.p>
                </motion.div>

                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate={inView ? "visible" : "hidden"}
                    className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20"
                >
                    {features.map((feature, index) => {
                        const IconComponent = feature.icon;
                        return (
                            <motion.div
                                key={index}
                                variants={itemVariants}
                                className="group"
                            >
                                <motion.div
                                    className="card p-8 h-full text-center hover:shadow-xl transition-all duration-300 relative overflow-hidden"
                                    whileHover={{ y: -5 }}
                                >
                                    {/* Gradient overlay on hover */}
                                    <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>

                                    <motion.div
                                        className={`w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center shadow-lg relative z-10`}
                                        whileHover={{ scale: 1.1, rotate: 5 }}
                                        transition={{ type: "spring", stiffness: 400, damping: 10 }}
                                    >
                                        <IconComponent className="w-8 h-8 text-white" />
                                    </motion.div>

                                    <h3 className="text-xl font-bold text-gray-900 mb-4 relative z-10">
                                        {feature.title}
                                    </h3>
                                    <p className="text-gray-600 leading-relaxed relative z-10">
                                        {feature.description}
                                    </p>
                                </motion.div>
                            </motion.div>
                        );
                    })}
                </motion.div>

                {/* Feature Highlight Section */}
                <motion.div
                    variants={itemVariants}
                    initial="hidden"
                    animate={inView ? "visible" : "hidden"}
                    className="card p-8 lg:p-12 bg-gradient-to-br from-gray-50 to-white border-0 shadow-xl"
                >
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <motion.h3
                                variants={itemVariants}
                                className="text-2xl lg:text-3xl font-bold text-gray-900 mb-6"
                            >
                                Real-time Synchronization
                            </motion.h3>
                            <motion.p
                                variants={itemVariants}
                                className="text-lg text-gray-600 mb-8 leading-relaxed"
                            >
                                Stay connected with live updates across all your devices. Changes made on one device
                                instantly sync to all others, ensuring your team always has the latest information.
                            </motion.p>
                            <motion.ul
                                variants={containerVariants}
                                className="space-y-4"
                            >
                                {[
                                    'Instant data synchronization',
                                    'Multi-device compatibility',
                                    'Real-time inventory updates',
                                    'Automatic conflict resolution'
                                ].map((item, index) => (
                                    <motion.li
                                        key={index}
                                        variants={itemVariants}
                                        className="flex items-center space-x-3 text-gray-700"
                                    >
                                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                                        <span className="font-medium">{item}</span>
                                    </motion.li>
                                ))}
                            </motion.ul>
                        </div>

                        <div className="relative">
                            <motion.div
                                className="flex flex-col items-center space-y-8"
                                variants={containerVariants}
                                initial="hidden"
                                animate={inView ? "visible" : "hidden"}
                            >
                                {/* Desktop */}
                                <motion.div
                                    variants={itemVariants}
                                    className="flex flex-col items-center space-y-3 group cursor-pointer"
                                    whileHover={{ scale: 1.05 }}
                                >
                                    <motion.div
                                        className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg"
                                        animate={{
                                            y: [0, -10, 0],
                                        }}
                                        transition={{
                                            duration: 4,
                                            repeat: Infinity,
                                            ease: "easeInOut",
                                        }}
                                    >
                                        <Monitor className="w-10 h-10 text-white" />
                                    </motion.div>
                                    <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors">
                                        Desktop
                                    </span>
                                </motion.div>

                                {/* Sync Lines */}
                                <motion.div
                                    className="flex flex-col space-y-2"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.5 }}
                                >
                                    {[1, 2].map((_, index) => (
                                        <motion.div
                                            key={index}
                                            className="w-1 h-8 bg-gradient-to-b from-blue-400 to-transparent rounded-full"
                                            animate={{
                                                opacity: [0.3, 1, 0.3],
                                            }}
                                            transition={{
                                                duration: 2,
                                                repeat: Infinity,
                                                delay: index * 0.5,
                                            }}
                                        />
                                    ))}
                                </motion.div>

                                {/* Tablet & Mobile */}
                                <div className="flex space-x-12">
                                    <motion.div
                                        variants={itemVariants}
                                        className="flex flex-col items-center space-y-3 group cursor-pointer"
                                        whileHover={{ scale: 1.05 }}
                                    >
                                        <motion.div
                                            className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg"
                                            animate={{
                                                y: [0, -8, 0],
                                            }}
                                            transition={{
                                                duration: 3,
                                                repeat: Infinity,
                                                ease: "easeInOut",
                                                delay: 1,
                                            }}
                                        >
                                            <Tablet className="w-8 h-8 text-white" />
                                        </motion.div>
                                        <span className="text-sm font-medium text-gray-700 group-hover:text-purple-600 transition-colors">
                                            Tablet
                                        </span>
                                    </motion.div>

                                    <motion.div
                                        variants={itemVariants}
                                        className="flex flex-col items-center space-y-3 group cursor-pointer"
                                        whileHover={{ scale: 1.05 }}
                                    >
                                        <motion.div
                                            className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg"
                                            animate={{
                                                y: [0, -6, 0],
                                            }}
                                            transition={{
                                                duration: 2.5,
                                                repeat: Infinity,
                                                ease: "easeInOut",
                                                delay: 2,
                                            }}
                                        >
                                            <Phone className="w-6 h-6 text-white" />
                                        </motion.div>
                                        <span className="text-sm font-medium text-gray-700 group-hover:text-green-600 transition-colors">
                                            Mobile
                                        </span>
                                    </motion.div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

export default Features;