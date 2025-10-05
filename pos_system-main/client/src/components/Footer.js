import React from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Facebook, Twitter, Linkedin, Instagram, MapPin, Mail, Phone } from 'lucide-react';

const Footer = () => {
    const currentYear = new Date().getFullYear();

    const footerSections = [
        {
            title: 'Product',
            links: [
                { label: 'Features', href: '#features' },
                { label: 'Pricing', href: '#pricing' },
                { label: 'Integrations', href: '#integrations' },
                { label: 'API', href: '#api' },
                { label: 'Mobile App', href: '#mobile' },
            ]
        },
        {
            title: 'Company',
            links: [
                { label: 'About Us', href: '#about' },
                { label: 'Careers', href: '#careers' },
                { label: 'Press', href: '#press' },
                { label: 'Partners', href: '#partners' },
                { label: 'Blog', href: '#blog' },
            ]
        },
        {
            title: 'Support',
            links: [
                { label: 'Help Center', href: '#help' },
                { label: 'Documentation', href: '#documentation' },
                { label: 'Contact Us', href: '#contact' },
                { label: 'Training', href: '#training' },
                { label: 'System Status', href: '#status' },
            ]
        },
        {
            title: 'Legal',
            links: [
                { label: 'Privacy Policy', href: '#privacy' },
                { label: 'Terms of Service', href: '#terms' },
                { label: 'Security', href: '#security' },
                { label: 'Compliance', href: '#compliance' },
                { label: 'Cookie Policy', href: '#cookies' },
            ]
        }
    ];

    const socialLinks = [
        { icon: Facebook, href: '#facebook', label: 'Facebook' },
        { icon: Twitter, href: '#twitter', label: 'Twitter' },
        { icon: Linkedin, href: '#linkedin', label: 'LinkedIn' },
        { icon: Instagram, href: '#instagram', label: 'Instagram' },
    ];

    const contactInfo = [
        { icon: MapPin, text: '123 Business St, Suite 100, San Francisco, CA 94105' },
        { icon: Mail, text: 'hello@pospro.com' },
        { icon: Phone, text: '+1 (555) 123-4567' },
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
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.5,
                ease: 'easeOut',
            },
        },
    };

    return (
        <footer className="bg-gray-900 text-white relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"></div>
            <div className="absolute inset-0 opacity-5">
                <div className="absolute top-0 left-0 w-96 h-96 bg-primary-500 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary-500 rounded-full blur-3xl"></div>
            </div>

            <div className="relative z-10">
                {/* Main Footer Content */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, threshold: 0.1 }}
                    className="container py-16"
                >
                    <div className="grid lg:grid-cols-6 gap-8 lg:gap-12">
                        {/* Brand Section */}
                        <motion.div variants={itemVariants} className="lg:col-span-2">
                            <div className="flex items-center space-x-3 mb-6">
                                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-xl">
                                    <CreditCard className="w-7 h-7 text-white" />
                                </div>
                                <span className="text-2xl font-bold">POS Pro</span>
                            </div>

                            <p className="text-gray-400 leading-relaxed mb-6 max-w-sm">
                                Empowering businesses with intelligent point-of-sale solutions.
                                Transform your operations and grow your business with our comprehensive platform.
                            </p>

                            {/* Contact Info */}
                            <div className="space-y-3 mb-6">
                                {contactInfo.map((item, index) => {
                                    const IconComponent = item.icon;
                                    return (
                                        <div key={index} className="flex items-start space-x-3 text-sm text-gray-400">
                                            <IconComponent className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                            <span>{item.text}</span>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Social Links */}
                            <div className="flex space-x-4">
                                {socialLinks.map((social, index) => {
                                    const IconComponent = social.icon;
                                    return (
                                        <motion.a
                                            key={index}
                                            href={social.href}
                                            className="w-10 h-10 bg-gray-800 hover:bg-gradient-to-r hover:from-primary-500 hover:to-secondary-500 rounded-lg flex items-center justify-center transition-all duration-300 group"
                                            whileHover={{ scale: 1.1, y: -2 }}
                                            whileTap={{ scale: 0.95 }}
                                            aria-label={social.label}
                                        >
                                            <IconComponent className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                                        </motion.a>
                                    );
                                })}
                            </div>
                        </motion.div>

                        {/* Footer Links */}
                        {footerSections.map((section, sectionIndex) => (
                            <motion.div key={section.title} variants={itemVariants} className="lg:col-span-1">
                                <h4 className="text-lg font-semibold mb-6 text-white">
                                    {section.title}
                                </h4>
                                <ul className="space-y-3">
                                    {section.links.map((link, linkIndex) => (
                                        <motion.li
                                            key={linkIndex}
                                            initial={{ opacity: 0, x: -10 }}
                                            whileInView={{ opacity: 1, x: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ delay: sectionIndex * 0.1 + linkIndex * 0.05 }}
                                        >
                                            <a
                                                href={link.href}
                                                className="text-gray-400 hover:text-white transition-colors duration-200 text-sm block py-1 hover:translate-x-1 transform transition-transform"
                                            >
                                                {link.label}
                                            </a>
                                        </motion.li>
                                    ))}
                                </ul>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* Newsletter Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="border-t border-gray-800"
                >
                    <div className="container py-12">
                        <div className="grid md:grid-cols-2 gap-8 items-center">
                            <div>
                                <h3 className="text-2xl font-bold mb-3">Stay Updated</h3>
                                <p className="text-gray-400">
                                    Get the latest updates on new features, industry insights, and special offers.
                                </p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <input
                                    type="email"
                                    placeholder="Enter your email"
                                    className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:border-primary-500 focus:outline-none transition-colors text-white placeholder-gray-400"
                                />
                                <motion.button
                                    className="btn btn-primary px-6 py-3 whitespace-nowrap"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    Subscribe
                                </motion.button>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Bottom Footer */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="border-t border-gray-800 py-8"
                >
                    <div className="container">
                        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                            <div className="text-gray-400 text-sm">
                                © {currentYear} POS Pro. All rights reserved.
                            </div>
                            <div className="flex space-x-6 text-sm">
                                <a href="#privacy" className="text-gray-400 hover:text-white transition-colors">
                                    Privacy
                                </a>
                                <a href="#terms" className="text-gray-400 hover:text-white transition-colors">
                                    Terms
                                </a>
                                <a href="#sitemap" className="text-gray-400 hover:text-white transition-colors">
                                    Sitemap
                                </a>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </footer>
    );
};

export default Footer;