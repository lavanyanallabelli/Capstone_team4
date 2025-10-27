import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { USER_ROLES, PERMISSIONS, hasPermission } from '../aws/userRoles';
import {
    Users,
    Menu,
    ShoppingCart,
    CreditCard,
    BarChart3,
    Settings,
    UserCheck,
    FileText,
    DollarSign,
    Package
} from 'lucide-react';

const RoleBasedDashboard = () => {
    const { currentUser } = useAuth();
    const userRole = currentUser?.userRole || USER_ROLES.EMPLOYEE;

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

    // Owner Dashboard Features
    const ownerFeatures = [
        {
            title: 'User Management',
            description: 'Create and manage employee accounts',
            icon: Users,
            permission: PERMISSIONS.CAN_CREATE_EMPLOYEE,
            color: 'from-blue-500 to-blue-600'
        },
        {
            title: 'Menu Management',
            description: 'Manage menu items and categories',
            icon: Menu,
            permission: PERMISSIONS.CAN_MANAGE_MENU_ITEMS,
            color: 'from-green-500 to-green-600'
        },
        {
            title: 'Analytics & Reports',
            description: 'View sales analytics and performance',
            icon: BarChart3,
            permission: PERMISSIONS.CAN_VIEW_SALES_ANALYTICS,
            color: 'from-purple-500 to-purple-600'
        },
        {
            title: 'System Settings',
            description: 'Configure restaurant and payment settings',
            icon: Settings,
            permission: PERMISSIONS.CAN_MANAGE_RESTAURANT_DETAILS,
            color: 'from-orange-500 to-orange-600'
        },
        {
            title: 'All Orders',
            description: 'View and manage all orders',
            icon: ShoppingCart,
            permission: PERMISSIONS.CAN_VIEW_ALL_ORDERS,
            color: 'from-indigo-500 to-indigo-600'
        },
        {
            title: 'Financial Reports',
            description: 'View all transactions and reports',
            icon: DollarSign,
            permission: PERMISSIONS.CAN_VIEW_ALL_TRANSACTIONS,
            color: 'from-emerald-500 to-emerald-600'
        }
    ];

    // Employee Dashboard Features
    const employeeFeatures = [
        {
            title: 'Take Orders',
            description: 'Take new dine-in orders',
            icon: ShoppingCart,
            permission: PERMISSIONS.CAN_TAKE_DINE_IN_ORDERS,
            color: 'from-blue-500 to-blue-600'
        },
        {
            title: 'Online Orders',
            description: 'Handle online orders',
            icon: FileText,
            permission: PERMISSIONS.CAN_HANDLE_ONLINE_ORDERS,
            color: 'from-green-500 to-green-600'
        },
        {
            title: 'Process Payments',
            description: 'Process customer payments',
            icon: CreditCard,
            permission: PERMISSIONS.CAN_PROCESS_PAYMENTS,
            color: 'from-purple-500 to-purple-600'
        },
        {
            title: 'Generate Bills',
            description: 'Generate and print receipts',
            icon: FileText,
            permission: PERMISSIONS.CAN_GENERATE_BILLS,
            color: 'from-orange-500 to-orange-600'
        },
        {
            title: 'View Menu',
            description: 'View available menu items',
            icon: Menu,
            permission: PERMISSIONS.CAN_VIEW_MENU_ITEMS,
            color: 'from-indigo-500 to-indigo-600'
        },
        {
            title: 'Update Profile',
            description: 'Update personal information',
            icon: UserCheck,
            permission: PERMISSIONS.CAN_UPDATE_PERSONAL_DETAILS,
            color: 'from-emerald-500 to-emerald-600'
        }
    ];

    const isOwner = userRole === USER_ROLES.OWNER;
    const features = isOwner ? ownerFeatures : employeeFeatures;

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Welcome, {currentUser?.name || 'User'}!
                    </h1>
                    <p className="text-gray-600">
                        {isOwner ? 'Owner Dashboard' : 'Employee Dashboard'} -
                        Manage your {isOwner ? 'restaurant operations' : 'daily tasks'}
                    </p>
                </motion.div>

                {/* Role Badge */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mb-8"
                >
                    <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${isOwner
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                        {isOwner ? '👑 Owner' : '👨‍🍳 Employee'}
                    </span>
                </motion.div>

                {/* Features Grid */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                    {features.map((feature, index) => {
                        const hasAccess = hasPermission(userRole, feature.permission);
                        const Icon = feature.icon;

                        return (
                            <motion.div
                                key={index}
                                variants={itemVariants}
                                className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${hasAccess
                                        ? 'border-l-green-500 hover:shadow-lg transition-shadow cursor-pointer'
                                        : 'border-l-gray-300 opacity-50'
                                    }`}
                            >
                                <div className="flex items-center mb-4">
                                    <div className={`p-3 rounded-lg bg-gradient-to-r ${feature.color} mr-4`}>
                                        <Icon className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900">
                                            {feature.title}
                                        </h3>
                                    </div>
                                </div>
                                <p className="text-gray-600 mb-4">
                                    {feature.description}
                                </p>
                                <div className="flex items-center justify-between">
                                    <span className={`text-sm font-medium ${hasAccess ? 'text-green-600' : 'text-gray-400'
                                        }`}>
                                        {hasAccess ? '✓ Available' : '✗ Restricted'}
                                    </span>
                                    {hasAccess && (
                                        <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                                            Access →
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </motion.div>

                {/* Quick Stats */}
                <motion.div
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6"
                >
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center">
                            <Package className="w-8 h-8 text-blue-600 mr-3" />
                            <div>
                                <p className="text-sm font-medium text-gray-600">Menu Items</p>
                                <p className="text-2xl font-bold text-gray-900">0</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center">
                            <ShoppingCart className="w-8 h-8 text-green-600 mr-3" />
                            <div>
                                <p className="text-sm font-medium text-gray-600">Orders Today</p>
                                <p className="text-2xl font-bold text-gray-900">0</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center">
                            <DollarSign className="w-8 h-8 text-purple-600 mr-3" />
                            <div>
                                <p className="text-sm font-medium text-gray-600">Revenue Today</p>
                                <p className="text-2xl font-bold text-gray-900">$0</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center">
                            <Users className="w-8 h-8 text-orange-600 mr-3" />
                            <div>
                                <p className="text-sm font-medium text-gray-600">
                                    {isOwner ? 'Employees' : 'My Orders'}
                                </p>
                                <p className="text-2xl font-bold text-gray-900">0</p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default RoleBasedDashboard;
