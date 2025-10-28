import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { USER_ROLES, PERMISSIONS, hasPermission } from '../aws/userRoles';
import apiService from '../services/api';
import {
    Menu,
    Plus,
    Edit,
    Trash2,
    Eye,
    EyeOff,
    Search,
    DollarSign,
    Clock,
    Tag
} from 'lucide-react';

const MenuManagement = () => {
    const { currentUser } = useAuth();
    const [menuItems, setMenuItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [showCreateCategory, setShowCreateCategory] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const userRole = currentUser?.userRole || USER_ROLES.EMPLOYEE;
    const canManageMenuItems = hasPermission(userRole, PERMISSIONS.CAN_MANAGE_MENU_ITEMS);
    const canManageCategories = hasPermission(userRole, PERMISSIONS.CAN_MANAGE_MENU_CATEGORIES);
    const canToggleAvailability = hasPermission(userRole, PERMISSIONS.CAN_TOGGLE_ITEM_AVAILABILITY);

    const loadMenuItems = useCallback(async () => {
        try {
            const params = {};
            if (searchTerm) params.search = searchTerm;
            if (selectedCategory !== 'All') params.category = selectedCategory;

            const response = await apiService.getMenuItems(params);
            if (response.success) {
                setMenuItems(response.data);
            }
        } catch (error) {
            console.error('Error loading menu items:', error);
            setError('Failed to load menu items');
        }
    }, [searchTerm, selectedCategory]);

    // Load menu items and categories on component mount
    useEffect(() => {
        loadMenuData();
    }, []);

    // Load menu items when filters change
    useEffect(() => {
        if (!loading) {
            loadMenuItems();
        }
    }, [loadMenuItems, loading]);

    const loadMenuData = async () => {
        try {
            setLoading(true);
            setError(null);

            const [menuResponse, categoriesResponse] = await Promise.all([
                apiService.getMenuItems(),
                apiService.getMenuCategories()
            ]);

            console.log('Menu Response:', menuResponse);
            console.log('Categories Response:', categoriesResponse);

            if (menuResponse.success && menuResponse.data) {
                setMenuItems(menuResponse.data);
            } else {
                console.log('Menu data not available, setting empty array');
                setMenuItems([]);
            }

            if (categoriesResponse.success && categoriesResponse.data && categoriesResponse.data.length > 0) {
                setCategories(categoriesResponse.data);
            } else {
                console.log('No categories found, using default categories');
                // Provide default categories if none exist
                setCategories(['Appetizers', 'Main Course', 'Desserts', 'Beverages', 'Specials']);
            }
        } catch (error) {
            console.error('Error loading menu data:', error);
            setError('Failed to load menu data');
        } finally {
            setLoading(false);
        }
    };


    // Only show this component to owners
    if (userRole !== USER_ROLES.OWNER) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Menu className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
                    <p className="text-gray-600">Only restaurant owners can manage menu items.</p>
                </div>
            </div>
        );
    }

    const handleCreateItem = async (itemData) => {
        try {
            const response = await apiService.createMenuItem(itemData);
            if (response.success) {
                setMenuItems([...menuItems, response.data]);
                setShowCreateForm(false);
                // Show success message
                alert('Menu item created successfully!');
            }
        } catch (error) {
            console.error('Error creating menu item:', error);
            alert('Failed to create menu item. Please try again.');
        }
    };

    const handleEditItem = async (itemId, updatedData) => {
        try {
            const response = await apiService.updateMenuItem(itemId, updatedData);
            if (response.success) {
                setMenuItems(menuItems.map(item =>
                    item.itemId === itemId ? response.data : item
                ));
                setEditingItem(null);
                alert('Menu item updated successfully!');
            }
        } catch (error) {
            console.error('Error updating menu item:', error);
            alert('Failed to update menu item. Please try again.');
        }
    };

    const handleDeleteItem = async (itemId) => {
        if (window.confirm('Are you sure you want to delete this menu item?')) {
            try {
                const response = await apiService.deleteMenuItem(itemId);
                if (response.success) {
                    setMenuItems(menuItems.filter(item => item.itemId !== itemId));
                    alert('Menu item deleted successfully!');
                }
            } catch (error) {
                console.error('Error deleting menu item:', error);
                alert('Failed to delete menu item. Please try again.');
            }
        }
    };

    const handleToggleAvailability = async (itemId) => {
        try {
            const item = menuItems.find(item => item.itemId === itemId);
            const newAvailability = !item.availability;

            const response = await apiService.toggleItemAvailability(itemId, newAvailability);
            if (response.success) {
                setMenuItems(menuItems.map(item =>
                    item.itemId === itemId ? response.data : item
                ));
            }
        } catch (error) {
            console.error('Error toggling item availability:', error);
            alert('Failed to update item availability. Please try again.');
        }
    };

    const handleCreateCategory = (categoryName) => {
        if (!categories.includes(categoryName)) {
            setCategories([...categories, categoryName]);
        }
        setShowCreateCategory(false);
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                Menu Management
                            </h1>
                            <p className="text-gray-600">
                                Manage your restaurant menu items and categories
                            </p>
                        </div>
                        {canManageMenuItems && (
                            <button
                                onClick={() => setShowCreateForm(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium flex items-center transition-colors"
                            >
                                <Plus className="w-5 h-5 mr-2" />
                                Add Menu Item
                            </button>
                        )}
                    </div>
                </motion.div>

                {/* Stats Cards */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
                >
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center">
                            <Menu className="w-8 h-8 text-blue-600 mr-3" />
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Items</p>
                                <p className="text-2xl font-bold text-gray-900">{menuItems.length}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center">
                            <Eye className="w-8 h-8 text-green-600 mr-3" />
                            <div>
                                <p className="text-sm font-medium text-gray-600">Available</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {menuItems.filter(item => item.availability).length}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center">
                            <EyeOff className="w-8 h-8 text-red-600 mr-3" />
                            <div>
                                <p className="text-sm font-medium text-gray-600">Unavailable</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {menuItems.filter(item => !item.availability).length}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center">
                            <Tag className="w-8 h-8 text-purple-600 mr-3" />
                            <div>
                                <p className="text-sm font-medium text-gray-600">Categories</p>
                                <p className="text-2xl font-bold text-gray-900">{categories.length}</p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Filters */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-lg shadow-md p-6 mb-8"
                >
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search menu items..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="All">All Categories</option>
                                {categories && categories.map(category => (
                                    <option key={category} value={category}>{category}</option>
                                ))}
                            </select>
                            {canManageCategories && (
                                <button
                                    onClick={() => setShowCreateCategory(true)}
                                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium flex items-center transition-colors"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Category
                                </button>
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* Loading State */}
                {loading && (
                    <div className="flex justify-center items-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
                        {error}
                    </div>
                )}

                {/* Menu Items Grid */}
                {!loading && !error && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        {menuItems && menuItems.map((item) => (
                            <div key={item.itemId} className="bg-white rounded-lg shadow-md overflow-hidden">
                                <div className="p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1">
                                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                                {item.name}
                                            </h3>
                                            <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mb-2">
                                                {item.category}
                                            </span>
                                            <p className="text-gray-600 text-sm mb-3">
                                                {item.description}
                                            </p>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            {canToggleAvailability && (
                                                <button
                                                    onClick={() => handleToggleAvailability(item.itemId)}
                                                    className={`p-2 rounded-lg transition-colors ${item.availability
                                                        ? 'bg-green-100 text-green-600 hover:bg-green-200'
                                                        : 'bg-red-100 text-red-600 hover:bg-red-200'
                                                        }`}
                                                >
                                                    {item.availability ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                                </button>
                                            )}
                                            {canManageMenuItems && (
                                                <>
                                                    <button
                                                        onClick={() => setEditingItem(item)}
                                                        className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteItem(item.itemId)}
                                                        className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center text-green-600 font-semibold">
                                            <DollarSign className="w-4 h-4 mr-1" />
                                            {item.price}
                                        </div>
                                        <div className="flex items-center text-gray-500 text-sm">
                                            <Clock className="w-4 h-4 mr-1" />
                                            {item.prepTime}
                                        </div>
                                    </div>

                                    <div className="mt-3 flex flex-wrap gap-1">
                                        {item.tags && item.tags.map((tag, index) => (
                                            <span key={index} className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </motion.div>
                )}

                {/* Create Menu Item Form Modal */}
                {showCreateForm && (
                    <CreateMenuItemForm
                        categories={categories}
                        onSubmit={handleCreateItem}
                        onCancel={() => setShowCreateForm(false)}
                    />
                )}

                {/* Edit Menu Item Form Modal */}
                {editingItem && (
                    <EditMenuItemForm
                        item={editingItem}
                        categories={categories}
                        onSubmit={(data) => handleEditItem(editingItem.id, data)}
                        onCancel={() => setEditingItem(null)}
                    />
                )}

                {/* Create Category Form Modal */}
                {showCreateCategory && (
                    <CreateCategoryForm
                        onSubmit={handleCreateCategory}
                        onCancel={() => setShowCreateCategory(false)}
                    />
                )}
            </div>
        </div>
    );
};

// Create Menu Item Form Component
const CreateMenuItemForm = ({ categories, onSubmit, onCancel }) => {
    const [formData, setFormData] = useState({
        name: '',
        category: categories && categories.length > 0 ? categories[0] : '',
        description: '',
        price: '',
        prepTime: '',
        tags: ''
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        const tags = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
        onSubmit({
            ...formData,
            price: parseFloat(formData.price),
            tags
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
            >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Create Menu Item</h3>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Item Name
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Category
                        </label>
                        <select
                            required
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {categories && categories.length > 0 ? (
                                categories.map(category => (
                                    <option key={category} value={category}>{category}</option>
                                ))
                            ) : (
                                <option value="">No categories available</option>
                            )}
                        </select>
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Description
                        </label>
                        <textarea
                            required
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows="3"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Price ($)
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            required
                            value={formData.price}
                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Prep Time
                        </label>
                        <input
                            type="text"
                            placeholder="e.g., 15-20 min"
                            value={formData.prepTime}
                            onChange={(e) => setFormData({ ...formData, prepTime: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tags (comma-separated)
                        </label>
                        <input
                            type="text"
                            placeholder="e.g., vegetarian, popular, spicy"
                            value={formData.tags}
                            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-4 py-2 text-gray-600 hover:text-gray-800"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                            Create Item
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

// Edit Menu Item Form Component
const EditMenuItemForm = ({ item, categories, onSubmit, onCancel }) => {
    const [formData, setFormData] = useState({
        name: item.name,
        category: item.category,
        description: item.description,
        price: item.price.toString(),
        prepTime: item.prepTime,
        tags: item.tags.join(', ')
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        const tags = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
        onSubmit({
            ...formData,
            price: parseFloat(formData.price),
            tags
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
            >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Menu Item</h3>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Item Name
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Category
                        </label>
                        <select
                            required
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {categories && categories.length > 0 ? (
                                categories.map(category => (
                                    <option key={category} value={category}>{category}</option>
                                ))
                            ) : (
                                <option value="">No categories available</option>
                            )}
                        </select>
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Description
                        </label>
                        <textarea
                            required
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows="3"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Price ($)
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            required
                            value={formData.price}
                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Prep Time
                        </label>
                        <input
                            type="text"
                            placeholder="e.g., 15-20 min"
                            value={formData.prepTime}
                            onChange={(e) => setFormData({ ...formData, prepTime: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tags (comma-separated)
                        </label>
                        <input
                            type="text"
                            placeholder="e.g., vegetarian, popular, spicy"
                            value={formData.tags}
                            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-4 py-2 text-gray-600 hover:text-gray-800"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                        >
                            Update Item
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

// Create Category Form Component
const CreateCategoryForm = ({ onSubmit, onCancel }) => {
    const [categoryName, setCategoryName] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(categoryName);
        setCategoryName('');
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-lg p-6 w-full max-w-md"
            >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Category</h3>
                <form onSubmit={handleSubmit}>
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Category Name
                        </label>
                        <input
                            type="text"
                            required
                            value={categoryName}
                            onChange={(e) => setCategoryName(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-4 py-2 text-gray-600 hover:text-gray-800"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                        >
                            Create Category
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default MenuManagement;
