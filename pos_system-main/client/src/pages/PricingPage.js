import React from 'react';
import { motion } from 'framer-motion';
import { Check, Star, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const PricingPage = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    const plans = [
        {
            name: 'Starter',
            price: 'Free',
            period: 'Forever',
            description: 'Perfect for small businesses just getting started',
            features: [
                'Up to 100 transactions/month',
                'Basic inventory management',
                'Simple reporting',
                'Email support',
                '1 user account'
            ],
            buttonText: 'Get Started',
            popular: false,
            color: 'from-gray-600 to-gray-700'
        },
        {
            name: 'Professional',
            price: '$29',
            period: 'per month',
            description: 'Ideal for growing businesses with advanced needs',
            features: [
                'Unlimited transactions',
                'Advanced inventory management',
                'Detailed analytics & reports',
                'Priority support',
                'Up to 5 user accounts',
                'Multi-location support',
                'Custom receipts',
                'Tax management'
            ],
            buttonText: 'Start Free Trial',
            popular: true,
            color: 'from-primary-600 to-secondary-600'
        },
        {
            name: 'Enterprise',
            price: '$99',
            period: 'per month',
            description: 'For large businesses requiring enterprise features',
            features: [
                'Everything in Professional',
                'Unlimited user accounts',
                'Advanced integrations',
                'Custom branding',
                '24/7 phone support',
                'Dedicated account manager',
                'Custom training',
                'API access'
            ],
            buttonText: 'Contact Sales',
            popular: false,
            color: 'from-accent-600 to-purple-600'
        }
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

    const handleGetStarted = (plan) => {
        if (currentUser) {
            navigate('/dashboard');
        } else {
            navigate('/signup');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            {/* Hero Section */}
            <section className="pt-24 pb-16 bg-gradient-to-br from-primary-600 via-secondary-600 to-accent-600">
                <div className="container">
                    <motion.div
                        className="text-center text-white"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <h1 className="text-4xl md:text-6xl font-bold mb-6">
                            Simple, Transparent Pricing
                        </h1>
                        <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto">
                            Choose the perfect plan for your business. Start free and scale as you grow.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Pricing Cards */}
            <section className="py-20">
                <div className="container">
                    <motion.div
                        className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        {plans.map((plan, index) => (
                            <motion.div
                                key={plan.name}
                                variants={itemVariants}
                                className={`relative bg-white rounded-2xl shadow-xl overflow-hidden ${plan.popular ? 'ring-4 ring-primary-500 scale-105' : ''
                                    }`}
                            >
                                {plan.popular && (
                                    <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-primary-600 to-secondary-600 text-white text-center py-2 text-sm font-semibold">
                                        <Star className="inline w-4 h-4 mr-1" />
                                        Most Popular
                                    </div>
                                )}

                                <div className="p-8">
                                    <div className="text-center mb-8">
                                        <h3 className="text-2xl font-bold text-gray-900 mb-2">
                                            {plan.name}
                                        </h3>
                                        <p className="text-gray-600 mb-4">
                                            {plan.description}
                                        </p>
                                        <div className="mb-4">
                                            <span className="text-5xl font-bold text-gray-900">
                                                {plan.price}
                                            </span>
                                            {plan.period !== 'Forever' && (
                                                <span className="text-gray-600 ml-2">
                                                    {plan.period}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <ul className="space-y-4 mb-8">
                                        {plan.features.map((feature, featureIndex) => (
                                            <li key={featureIndex} className="flex items-center">
                                                <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                                                <span className="text-gray-700">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    <motion.button
                                        onClick={() => handleGetStarted(plan)}
                                        className={`w-full py-4 px-6 rounded-xl font-semibold text-white bg-gradient-to-r ${plan.color} hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center justify-center space-x-2`}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <span>{plan.buttonText}</span>
                                        <ArrowRight className="w-4 h-4" />
                                    </motion.button>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* FAQ Section */}
            <section className="py-20 bg-white">
                <div className="container">
                    <motion.div
                        className="text-center mb-16"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                            Frequently Asked Questions
                        </h2>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            Got questions? We've got answers.
                        </p>
                    </motion.div>

                    <div className="max-w-4xl mx-auto space-y-6">
                        {[
                            {
                                question: "Can I change my plan anytime?",
                                answer: "Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately and we'll prorate any billing differences."
                            },
                            {
                                question: "Is there a free trial?",
                                answer: "Yes, we offer a 30-day free trial for all paid plans. No credit card required to get started."
                            },
                            {
                                question: "What payment methods do you accept?",
                                answer: "We accept all major credit cards, PayPal, and bank transfers for enterprise customers."
                            },
                            {
                                question: "Is my data secure?",
                                answer: "Absolutely. We use enterprise-grade security with 256-bit SSL encryption and regular security audits."
                            }
                        ].map((faq, index) => (
                            <motion.div
                                key={index}
                                className="bg-gray-50 rounded-xl p-6"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: index * 0.1 }}
                            >
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                    {faq.question}
                                </h3>
                                <p className="text-gray-600">
                                    {faq.answer}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default PricingPage;
