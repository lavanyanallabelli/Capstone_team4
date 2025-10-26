import React from 'react';
import { motion } from 'framer-motion';
import { Users, Rocket, MessageCircle, Award, CheckCircle2, ArrowRight } from 'lucide-react';
import { useInView } from 'react-intersection-observer';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const Community = () => {
    const [ref, inView] = useInView({
        triggerOnce: true,
        threshold: 0.1,
    });
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    const benefits = [
        {
            icon: Rocket,
            title: 'Early Access',
            description: 'Be among the first to experience cutting-edge POS features'
        },
        {
            icon: MessageCircle,
            title: 'Direct Feedback',
            description: 'Shape the product roadmap with your valuable input'
        },
        {
            icon: Award,
            title: 'Exclusive Perks',
            description: 'Special pricing and priority support for early adopters'
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
        <section className="section bg-white relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute inset-0">
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary-100 rounded-full blur-3xl opacity-30"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary-100 rounded-full blur-3xl opacity-30"></div>
            </div>

            <div className="container relative z-10">
                <motion.div
                    ref={ref}
                    variants={containerVariants}
                    initial="hidden"
                    animate={inView ? "visible" : "hidden"}
                    className="text-center mb-16"
                >
                    <motion.div
                        variants={itemVariants}
                        className="inline-flex items-center space-x-2 bg-primary-100 text-primary-700 px-4 py-2 rounded-full text-sm font-medium mb-6"
                    >
                        <Users className="w-4 h-4" />
                        <span>Join Our Growing Community</span>
                    </motion.div>

                    <motion.h2
                        variants={itemVariants}
                        className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6"
                    >
                        Be Part of Something{' '}
                        <span className="gradient-text">Revolutionary</span>
                    </motion.h2>

                    <motion.p
                        variants={itemVariants}
                        className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed"
                    >
                        We're building the future of point-of-sale technology with a community of forward-thinking
                        business owners who believe in innovation and growth.
                    </motion.p>
                </motion.div>

                {/* Benefits Grid */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate={inView ? "visible" : "hidden"}
                    className="grid md:grid-cols-3 gap-8 mb-16"
                >
                    {benefits.map((benefit, index) => {
                        const IconComponent = benefit.icon;
                        return (
                            <motion.div
                                key={index}
                                variants={itemVariants}
                                className="group"
                            >
                                <motion.div
                                    className="card p-8 text-center hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-white to-gray-50"
                                    whileHover={{ y: -5, scale: 1.02 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                                >
                                    <motion.div
                                        className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl flex items-center justify-center shadow-lg"
                                        whileHover={{ rotate: 5, scale: 1.1 }}
                                        transition={{ type: "spring", stiffness: 400, damping: 10 }}
                                    >
                                        <IconComponent className="w-8 h-8 text-white" />
                                    </motion.div>

                                    <h3 className="text-xl font-bold text-gray-900 mb-4">
                                        {benefit.title}
                                    </h3>
                                    <p className="text-gray-600 leading-relaxed">
                                        {benefit.description}
                                    </p>
                                </motion.div>
                            </motion.div>
                        );
                    })}
                </motion.div>

                {/* Call to Action */}
                <motion.div
                    variants={itemVariants}
                    initial="hidden"
                    animate={inView ? "visible" : "hidden"}
                    className="card p-8 lg:p-12 bg-gradient-to-r from-primary-50 to-secondary-50 border-0 text-center mb-16"
                >
                    <motion.h3
                        variants={itemVariants}
                        className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4"
                    >
                        Ready to Join Our Beta Community?
                    </motion.h3>
                    <motion.p
                        variants={itemVariants}
                        className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto"
                    >
                        Get early access to POS Pro and help us build the perfect solution for your business needs.
                    </motion.p>

                    <motion.div
                        variants={itemVariants}
                        className="flex flex-col sm:flex-row gap-4 justify-center items-center"
                    >
                        {currentUser ? (
                            <motion.button
                                onClick={() => navigate('/dashboard')}
                                className="btn btn-primary btn-large group"
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
                                    className="btn btn-primary btn-large group"
                                >
                                    Request Early Access
                                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                                </Link>
                            </motion.div>
                        )}

                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            <span>No payment required</span>
                        </div>
                    </motion.div>
                </motion.div>

            </div>

        </section>
    );
};

export default Community;
