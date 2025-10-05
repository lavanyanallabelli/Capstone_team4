import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Shield, CreditCard, Cloud, Headphones, Lock } from 'lucide-react';
import { useInView } from 'react-intersection-observer';

const CTA = () => {
    const [ref, inView] = useInView({
        triggerOnce: true,
        threshold: 0.1,
    });

    const [formData, setFormData] = useState({
        businessName: '',
        email: '',
        phone: '',
        businessType: ''
    });
    const [errors, setErrors] = useState({});

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        // Clear error for this field
        if (errors[e.target.name]) {
            setErrors(prev => ({
                ...prev,
                [e.target.name]: ''
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate form
        const newErrors = {};
        if (!formData.businessName) newErrors.businessName = 'Business name is required';
        if (!formData.email) newErrors.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
        if (!formData.phone) newErrors.phone = 'Phone is required';
        if (!formData.businessType) newErrors.businessType = 'Business type is required';

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        // For now, we'll just open the signup modal with pre-filled data
        // You can integrate with your backend API here
        console.log('Form submitted:', formData);

        // Clear form
        setFormData({
            businessName: '',
            email: '',
            phone: '',
            businessType: ''
        });

        // Show success message or redirect to signup
        alert('Thank you for your interest! Please complete your registration.');
    };

    const features = [
        { icon: Shield, text: '30-day free trial' },
        { icon: CreditCard, text: 'No setup fees' },
        { icon: ArrowRight, text: 'Cancel anytime' },
    ];

    const badges = [
        { icon: Shield, text: 'SSL Secured' },
        { icon: CreditCard, text: 'PCI Compliant' },
        { icon: Cloud, text: 'Cloud Backup' },
        { icon: Headphones, text: '24/7 Support' },
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
        <section className="section bg-gradient-to-br from-gray-50 to-white relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute inset-0">
                <div className="absolute top-0 left-0 w-96 h-96 bg-primary-100 rounded-full blur-3xl opacity-30"></div>
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary-100 rounded-full blur-3xl opacity-30"></div>
            </div>

            <div className="container relative z-10">
                <motion.div
                    ref={ref}
                    variants={containerVariants}
                    initial="hidden"
                    animate={inView ? "visible" : "hidden"}
                    className="grid lg:grid-cols-2 gap-12 items-center mb-16"
                >
                    {/* Left Content */}
                    <div>
                        <motion.h2
                            variants={itemVariants}
                            className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight"
                        >
                            Ready to Transform Your{' '}
                            <span className="gradient-text">Business?</span>
                        </motion.h2>

                        <motion.p
                            variants={itemVariants}
                            className="text-lg md:text-xl text-gray-600 mb-8 leading-relaxed"
                        >
                            Join thousands of successful businesses using POS Pro. Start your free trial today
                            and experience the difference our platform can make for your operations.
                        </motion.p>

                        <motion.div
                            variants={containerVariants}
                            className="space-y-4"
                        >
                            {features.map((feature, index) => {
                                const IconComponent = feature.icon;
                                return (
                                    <motion.div
                                        key={index}
                                        variants={itemVariants}
                                        className="flex items-center space-x-3 text-gray-700"
                                    >
                                        <div className="w-6 h-6 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                                            <IconComponent className="w-4 h-4 text-white" />
                                        </div>
                                        <span className="font-medium">{feature.text}</span>
                                    </motion.div>
                                );
                            })}
                        </motion.div>
                    </div>

                    {/* Right Content - Form */}
                    <motion.div
                        variants={itemVariants}
                        className="w-full"
                    >
                        <motion.div
                            className="card p-8 lg:p-10 shadow-xl border-0 bg-white"
                            whileHover={{ y: -5 }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        >
                            <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">
                                Start Your Free Trial
                            </h3>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={inView ? { opacity: 1, x: 0 } : {}}
                                    transition={{ delay: 0.3 }}
                                >
                                    <input
                                        type="text"
                                        name="businessName"
                                        placeholder="Business Name"
                                        value={formData.businessName}
                                        onChange={handleInputChange}
                                        className={`w-full px-4 py-4 bg-gray-50 border-2 rounded-xl focus:bg-white focus:outline-none transition-all duration-300 text-gray-900 placeholder-gray-500 ${errors.businessName ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-primary-500'
                                            }`}
                                        required
                                    />
                                    {errors.businessName && (
                                        <p className="mt-1 text-sm text-red-600">{errors.businessName}</p>
                                    )}
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={inView ? { opacity: 1, x: 0 } : {}}
                                    transition={{ delay: 0.4 }}
                                >
                                    <input
                                        type="email"
                                        name="email"
                                        placeholder="Email Address"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:bg-white focus:outline-none transition-all duration-300 text-gray-900 placeholder-gray-500"
                                        required
                                    />
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={inView ? { opacity: 1, x: 0 } : {}}
                                    transition={{ delay: 0.5 }}
                                >
                                    <input
                                        type="tel"
                                        name="phone"
                                        placeholder="Phone Number"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:bg-white focus:outline-none transition-all duration-300 text-gray-900 placeholder-gray-500"
                                        required
                                    />
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={inView ? { opacity: 1, x: 0 } : {}}
                                    transition={{ delay: 0.6 }}
                                >
                                    <select
                                        name="businessType"
                                        value={formData.businessType}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:bg-white focus:outline-none transition-all duration-300 text-gray-900"
                                        required
                                    >
                                        <option value="">Select Business Type</option>
                                        <option value="retail">Retail Store</option>
                                        <option value="restaurant">Restaurant</option>
                                        <option value="cafe">Café/Coffee Shop</option>
                                        <option value="salon">Salon/Spa</option>
                                        <option value="pharmacy">Pharmacy</option>
                                        <option value="other">Other</option>
                                    </select>
                                </motion.div>

                                <motion.button
                                    type="submit"
                                    className="btn btn-primary btn-large w-full justify-center group"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={inView ? { opacity: 1, y: 0 } : {}}
                                    transition={{ delay: 0.7 }}
                                >
                                    Start Free Trial
                                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                                </motion.button>
                            </form>

                            <motion.div
                                className="mt-6 text-center"
                                initial={{ opacity: 0 }}
                                animate={inView ? { opacity: 1 } : {}}
                                transition={{ delay: 0.8 }}
                            >
                                <p className="text-sm text-gray-600 flex items-center justify-center space-x-2">
                                    <Lock className="w-4 h-4" />
                                    <span>Your information is secure and will never be shared</span>
                                </p>
                            </motion.div>
                        </motion.div>
                    </motion.div>
                </motion.div>

                {/* Security Badges */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate={inView ? "visible" : "hidden"}
                    className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto"
                >
                    {badges.map((badge, index) => {
                        const IconComponent = badge.icon;
                        return (
                            <motion.div
                                key={index}
                                variants={itemVariants}
                                className="group"
                            >
                                <motion.div
                                    className="card p-6 text-center hover:shadow-lg transition-all duration-300"
                                    whileHover={{ y: -3, scale: 1.02 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                                >
                                    <motion.div
                                        className="w-12 h-12 mx-auto mb-3 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center"
                                        whileHover={{ rotate: 5, scale: 1.1 }}
                                        transition={{ type: "spring", stiffness: 400, damping: 10 }}
                                    >
                                        <IconComponent className="w-6 h-6 text-white" />
                                    </motion.div>
                                    <span className="text-sm font-semibold text-gray-700 group-hover:text-primary-600 transition-colors">
                                        {badge.text}
                                    </span>
                                </motion.div>
                            </motion.div>
                        );
                    })}
                </motion.div>
            </div>
        </section>
    );
};

export default CTA;