import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, CreditCard, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const TrialExpiredPage = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <div className="flex items-center justify-center min-h-[80vh] px-4">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8 md:p-12 text-center"
                >
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: 'spring' }}
                        className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-6"
                    >
                        <AlertCircle className="w-10 h-10 text-red-600" />
                    </motion.div>

                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                        Your Free Trial Has Ended
                    </h1>

                    <p className="text-lg text-gray-600 mb-8">
                        Thank you for trying our service! To continue using all features,
                        please subscribe to one of our plans.
                    </p>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
                        <h2 className="text-xl font-semibold text-gray-900 mb-3">
                            What happens next?
                        </h2>
                        <ul className="text-left space-y-2 text-gray-700">
                            <li className="flex items-start">
                                <span className="text-blue-600 mr-2">•</span>
                                <span>Choose a subscription plan that fits your business needs</span>
                            </li>
                            <li className="flex items-start">
                                <span className="text-blue-600 mr-2">•</span>
                                <span>Add your payment method (we'll enable auto-payment for convenience)</span>
                            </li>
                            <li className="flex items-start">
                                <span className="text-blue-600 mr-2">•</span>
                                <span>Get instant access to all features</span>
                            </li>
                        </ul>
                    </div>

                    <motion.button
                        onClick={() => navigate('/pricing')}
                        className="w-full md:w-auto px-8 py-4 bg-gradient-to-r from-primary-600 to-secondary-600 text-white font-semibold rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center justify-center space-x-2 mx-auto"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <CreditCard className="w-5 h-5" />
                        <span>View Pricing Plans</span>
                        <ArrowRight className="w-5 h-5" />
                    </motion.button>
                </motion.div>
            </div>

            <Footer />
        </div>
    );
};

export default TrialExpiredPage;

