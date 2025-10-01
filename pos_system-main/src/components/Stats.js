import React from 'react';
import { motion } from 'framer-motion';
import { Store, DollarSign, Shield, Star } from 'lucide-react';
import { useInView } from 'react-intersection-observer';

const Stats = () => {
    const [ref, inView] = useInView({
        triggerOnce: true,
        threshold: 0.1,
    });

    const stats = [
        {
            number: '100+',
            label: 'Early Adopters',
            icon: Store,
            description: 'Beta testing our platform'
        },
        {
            number: '24/7',
            label: 'Support Available',
            icon: Shield,
            description: 'Dedicated to your success'
        },
        {
            number: '30 Days',
            label: 'Free Trial',
            icon: Star,
            description: 'No commitment required'
        },
        {
            number: '99%+',
            label: 'Data Security',
            icon: DollarSign,
            description: 'Enterprise-grade protection'
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
        hidden: { opacity: 0, scale: 0.8 },
        visible: {
            opacity: 1,
            scale: 1,
            transition: {
                duration: 0.6,
                ease: 'easeOut',
            },
        },
    };

    return (
        <section className="section bg-gradient-to-br from-primary-600 via-secondary-600 to-accent-600 relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute inset-0">
                <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-white/5 rounded-full blur-3xl"></div>
            </div>

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
                        className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6"
                    >
                        Built for Growing Businesses
                    </motion.h2>
                    <motion.p
                        variants={itemVariants}
                        className="text-lg md:text-xl text-blue-100 max-w-3xl mx-auto leading-relaxed"
                    >
                        Join our community of early adopters who are already experiencing the future of point-of-sale technology
                    </motion.p>
                </motion.div>

                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate={inView ? "visible" : "hidden"}
                    className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20"
                >
                    {stats.map((stat, index) => {
                        const IconComponent = stat.icon;
                        return (
                            <motion.div
                                key={index}
                                variants={itemVariants}
                                className="group"
                            >
                                <motion.div
                                    className="glass rounded-3xl p-8 text-center hover:bg-white/15 transition-all duration-300 relative"
                                    whileHover={{ y: -8, scale: 1.02 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                                >
                                    <motion.div
                                        className="w-16 h-16 mx-auto mb-6 bg-white/20 rounded-2xl flex items-center justify-center"
                                        whileHover={{ rotate: 10, scale: 1.1 }}
                                        transition={{ type: "spring", stiffness: 400, damping: 10 }}
                                    >
                                        <IconComponent className="w-8 h-8 text-white" />
                                    </motion.div>

                                    <motion.div
                                        className="text-3xl lg:text-4xl font-bold text-white mb-2"
                                        initial={{ scale: 0 }}
                                        animate={inView ? { scale: 1 } : {}}
                                        transition={{ delay: 0.3 + index * 0.1, type: "spring", stiffness: 200 }}
                                    >
                                        {stat.number}
                                    </motion.div>

                                    <h4 className="text-lg font-semibold text-white mb-2">
                                        {stat.label}
                                    </h4>
                                    <p className="text-blue-200 text-sm">
                                        {stat.description}
                                    </p>

                                    {/* Glow effect */}
                                    <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-white/10 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                </motion.div>
                            </motion.div>
                        );
                    })}
                </motion.div>

                {/* Vision Statement */}
                <motion.div
                    variants={itemVariants}
                    initial="hidden"
                    animate={inView ? "visible" : "hidden"}
                    className="glass rounded-3xl p-8 lg:p-12 max-w-4xl mx-auto text-center"
                >
                    <motion.h3
                        variants={itemVariants}
                        className="text-2xl lg:text-3xl font-bold text-white mb-6"
                    >
                        Our Mission
                    </motion.h3>
                    <motion.p
                        variants={itemVariants}
                        className="text-lg lg:text-xl text-blue-100 leading-relaxed mb-6"
                    >
                        We're building POS Pro to democratize business technology. Every small business
                        deserves access to enterprise-level tools without the enterprise-level complexity or cost.
                    </motion.p>
                    <motion.div
                        variants={itemVariants}
                        className="inline-flex items-center space-x-2 bg-white/20 px-6 py-3 rounded-full"
                    >
                        <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                        <span className="text-white font-medium">Currently in Development</span>
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
};

export default Stats;