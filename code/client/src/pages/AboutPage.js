import React from 'react';
import { motion } from 'framer-motion';
import { Target, Users, Heart, Shield } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const AboutPage = () => {
    const values = [
        {
            icon: Target,
            title: 'Mission-Driven',
            description: 'We\'re committed to empowering small businesses with enterprise-grade POS solutions that are simple, affordable, and effective.'
        },
        {
            icon: Users,
            title: 'Customer-Centric',
            description: 'Every feature we build starts with understanding our customers\' needs. Your success is our success.'
        },
        {
            icon: Shield,
            title: 'Security First',
            description: 'We prioritize the security of your business data with enterprise-grade encryption and regular security audits.'
        },
        {
            icon: Heart,
            title: 'Community Focus',
            description: 'We believe in supporting local businesses and communities by providing tools that help them thrive.'
        }
    ];

    const team = [
        {
            name: 'Sarah Johnson',
            role: 'CEO & Founder',
            image: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80',
            bio: 'Former retail executive with 15+ years of experience helping businesses optimize their operations.'
        },
        {
            name: 'Michael Chen',
            role: 'CTO',
            image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80',
            bio: 'Tech veteran with expertise in building scalable, secure systems for the retail industry.'
        },
        {
            name: 'Emily Rodriguez',
            role: 'Head of Customer Success',
            image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80',
            bio: 'Passionate about helping businesses succeed with personalized support and training.'
        }
    ];

    const stats = [
        { number: '10,000+', label: 'Happy Customers' },
        { number: '50M+', label: 'Transactions Processed' },
        { number: '99.9%', label: 'Uptime' },
        { number: '24/7', label: 'Support Available' }
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
                            About POS Pro
                        </h1>
                        <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto">
                            We're on a mission to empower small businesses with powerful,
                            easy-to-use point-of-sale solutions that help them grow and succeed.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Story Section */}
            <section className="py-20 bg-white">
                <div className="container">
                    <div className="max-w-4xl mx-auto">
                        <motion.div
                            className="text-center mb-16"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                        >
                            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                                Our Story
                            </h2>
                            <p className="text-lg text-gray-600 leading-relaxed">
                                Founded in 2020, POS Pro was born from a simple observation: small businesses
                                were struggling with outdated, expensive POS systems that were either too
                                complex or too limited. Our founders, having worked in retail for decades,
                                knew there had to be a better way.
                            </p>
                        </motion.div>

                        <motion.div
                            className="grid md:grid-cols-2 gap-12 items-center"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                        >
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                                    Why We Started POS Pro
                                </h3>
                                <p className="text-gray-600 mb-6">
                                    We witnessed countless small business owners frustrated with their POS systems.
                                    They needed something powerful enough to handle their operations but simple
                                    enough to use without extensive training.
                                </p>
                                <p className="text-gray-600">
                                    That's when we decided to build POS Pro - a solution that combines enterprise-level
                                    features with the simplicity that small businesses deserve.
                                </p>
                            </div>
                            <div className="relative">
                                <img
                                    src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80"
                                    alt="Small business owner"
                                    className="rounded-2xl shadow-xl"
                                />
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Values Section */}
            <section className="py-20 bg-gray-50">
                <div className="container">
                    <motion.div
                        className="text-center mb-16"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                            Our Values
                        </h2>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            These core values guide everything we do and every decision we make.
                        </p>
                    </motion.div>

                    <motion.div
                        className="grid md:grid-cols-2 lg:grid-cols-4 gap-8"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        {values.map((value, index) => (
                            <motion.div
                                key={index}
                                variants={itemVariants}
                                className="text-center bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300"
                            >
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-2xl mb-6">
                                    <value.icon className="w-8 h-8 text-white" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-4">
                                    {value.title}
                                </h3>
                                <p className="text-gray-600">
                                    {value.description}
                                </p>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-20 bg-gradient-to-r from-primary-600 to-secondary-600">
                <div className="container">
                    <motion.div
                        className="grid md:grid-cols-4 gap-8 text-center text-white"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        {stats.map((stat, index) => (
                            <motion.div
                                key={index}
                                variants={itemVariants}
                                className="space-y-2"
                            >
                                <div className="text-4xl md:text-5xl font-bold">
                                    {stat.number}
                                </div>
                                <div className="text-lg text-white/90">
                                    {stat.label}
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* Team Section */}
            <section className="py-20 bg-white">
                <div className="container">
                    <motion.div
                        className="text-center mb-16"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                            Meet Our Team
                        </h2>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            The passionate people behind POS Pro who are dedicated to your success.
                        </p>
                    </motion.div>

                    <motion.div
                        className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        {team.map((member, index) => (
                            <motion.div
                                key={index}
                                variants={itemVariants}
                                className="text-center bg-gray-50 p-8 rounded-2xl hover:shadow-lg transition-shadow duration-300"
                            >
                                <img
                                    src={member.image}
                                    alt={member.name}
                                    className="w-24 h-24 rounded-full mx-auto mb-6 object-cover"
                                />
                                <h3 className="text-xl font-bold text-gray-900 mb-2">
                                    {member.name}
                                </h3>
                                <p className="text-primary-600 font-semibold mb-4">
                                    {member.role}
                                </p>
                                <p className="text-gray-600">
                                    {member.bio}
                                </p>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default AboutPage;
