import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Edit2, Trash2, Eye, EyeOff, Filter, Tag, Clock, DollarSign } from 'lucide-react';
import apiService from '../services/api';

const MenuManagement = () => {
    const [menuItems, setMenuItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [showEditForm, setShowEditForm] = useState(false);
    const [showCategoryForm, setShowCategoryForm] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');
    const [filterAvailability, setFilterAvailability] = useState('all');

    useEffect(() => {
        loadMenuData();
    }, []);

    const loadMenuData = async () => {
        try {
            setLoading(true);
            const [menuResponse, categoriesResponse] = await Promise.all([
                apiService.getMenuItems(),
                apiService.getMenuCategories()
            ]);

            console.log('Menu Response:', menuResponse);
            console.log('Categories Response:', categoriesResponse);

            if (menuResponse.success && menuResponse.data) {
                setMenuItems(menuResponse.data);
            } else {
                setMenuItems([]);
            }

            if (categoriesResponse.success && categoriesResponse.data) {
                setCategories(categoriesResponse.data);
            } else {
                setCategories([]);
            }
        } catch (error) {
            console.error('Error loading menu data:', error);
            setError('Failed to load menu data');
            setMenuItems([]);
            setCategories([]);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateItem = async (itemData) => {
        try {
            const response = await apiService.createMenuItem(itemData);
            if (response.success) {
                setMenuItems(prev => [...prev, response.data]);
                setShowCreateForm(false);
                return { success: true, data: response.data };
            } else {
                return { success: false, error: response.message };
            }
        } catch (error) {
            console.error('Error creating menu item:', error);
            return { success: false, error: error.message };
        }
    };

    const handleEditItem = async (itemId, itemData) => {
        try {
            const response = await apiService.updateMenuItem(itemId, itemData);
            if (response.success) {
                setMenuItems(prev => prev.map(item =>
                    item.itemId === itemId ? response.data : item
                ));
                setShowEditForm(false);
                setEditingItem(null);
                return { success: true };
            } else {
                return { success: false, error: response.message };
            }
        } catch (error) {
            console.error('Error updating menu item:', error);
            return { success: false, error: error.message };
        }
    };

    const handleDeleteItem = async (itemId) => {
        if (window.confirm('Are you sure you want to delete this menu item?')) {
            try {
                const response = await apiService.deleteMenuItem(itemId);
                if (response.success) {
                    setMenuItems(prev => prev.filter(item => item.itemId !== itemId));
                } else {
                    alert('Failed to delete menu item');
                }
            } catch (error) {
                console.error('Error deleting menu item:', error);
                alert('Failed to delete menu item');
            }
        }
    };

    const handleToggleAvailability = async (itemId) => {
        try {
            const item = menuItems.find(item => item.itemId === itemId);
            const response = await apiService.toggleMenuItemAvailability(itemId, !item.isAvailable);
            if (response.success) {
                setMenuItems(prev => prev.map(item =>
                    item.itemId === itemId ? { ...item, isAvailable: !item.isAvailable } : item
                ));
            }
        } catch (error) {
            console.error('Error toggling availability:', error);
        }
    };

    const handleCreateCategory = async (categoryData) => {
        try {
            const response = await apiService.createMenuCategory(categoryData);
            if (response.success) {
                setCategories(prev => [...prev, response.data]);
                setShowCategoryForm(false);
                return { success: true, data: response.data };
            } else {
                return { success: false, error: response.message };
            }
        } catch (error) {
            console.error('Error creating category:', error);
            return { success: false, error: error.message };
        }
    };

    const filteredItems = menuItems.filter(item => {
        const matchesSearch = item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.description?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesCategory = filterCategory === 'all' || item.category === filterCategory;

        const matchesAvailability = filterAvailability === 'all' ||
            (filterAvailability === 'available' && item.isAvailable) ||
            (filterAvailability === 'unavailable' && !item.isAvailable);

        return matchesSearch && matchesCategory && matchesAvailability;
    });

    const stats = {
        total: menuItems.length,
        available: menuItems.filter(item => item.isAvailable).length,
        unavailable: menuItems.filter(item => !item.isAvailable).length,
        categories: categories.length
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Menu Management</h1>
                <p className="text-gray-600">Manage your restaurant menu items and categories</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                            <Tag className="h-6 w-6" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Total Items</p>
                            <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-green-100 text-green-600">
                            <Eye className="h-6 w-6" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Available</p>
                            <p className="text-2xl font-semibold text-gray-900">{stats.available}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-red-100 text-red-600">
                            <EyeOff className="h-6 w-6" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Unavailable</p>
                            <p className="text-2xl font-semibold text-gray-900">{stats.unavailable}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                            <Filter className="h-6 w-6" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Categories</p>
                            <p className="text-2xl font-semibold text-gray-900">{stats.categories}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="bg-white rounded-lg shadow mb-6 p-6">
                <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                    <div className="flex flex-col sm:flex-row gap-4 flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                            <input
                                type="text"
                                placeholder="Search menu items..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                        </div>
                        <select
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                            <option value="all">All Categories</option>
                            {categories && categories.map(category => (
                                <option key={category.categoryId} value={category.name}>
                                    {category.name}
                                </option>
                            ))}
                        </select>
                        <select
                            value={filterAvailability}
                            onChange={(e) => setFilterAvailability(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                            <option value="all">All Items</option>
                            <option value="available">Available Only</option>
                            <option value="unavailable">Unavailable Only</option>
                        </select>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowCategoryForm(true)}
                            className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-2"
                        >
                            <Filter className="h-5 w-5" />
                            Add Category
                        </button>
                        <button
                            onClick={() => setShowCreateForm(true)}
                            className="bg-primary-500 text-white px-6 py-2 rounded-lg hover:bg-primary-600 transition-colors flex items-center gap-2"
                        >
                            <Plus className="h-5 w-5" />
                            Add Item
                        </button>
                    </div>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                    <p className="text-red-600">{error}</p>
                </div>
            )}

            {/* Menu Items Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredItems.map((item) => (
                    <div key={item.itemId} className="bg-white rounded-lg shadow overflow-hidden">
                        <div className="aspect-w-16 aspect-h-9">
                            {item.imageUrl ? (
                                <img
                                    src={item.imageUrl}
                                    alt={item.name}
                                    className="w-full h-48 object-cover"
                                />
                            ) : (
                                <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                                    <span className="text-gray-400">No Image</span>
                                </div>
                            )}
                        </div>
                        <div className="p-6">
                            <div className="flex items-start justify-between mb-2">
                                <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${item.isAvailable
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-red-100 text-red-800'
                                    }`}>
                                    {item.isAvailable ? 'Available' : 'Unavailable'}
                                </span>
                            </div>
                            <p className="text-gray-600 text-sm mb-3 line-clamp-2">{item.description}</p>
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center text-primary-600 font-semibold">
                                    <DollarSign className="h-4 w-4 mr-1" />
                                    ${item.price?.toFixed(2)}
                                </div>
                                <div className="flex items-center text-gray-500 text-sm">
                                    <Clock className="h-4 w-4 mr-1" />
                                    {item.prepTime || 'N/A'} min
                                </div>
                            </div>
                            <div className="mb-4">
                                <span className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full mr-2">
                                    {item.category}
                                </span>
                                {item.tags && item.tags.map((tag, index) => (
                                    <span key={index} className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mr-2">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => {
                                        setEditingItem(item);
                                        setShowEditForm(true);
                                    }}
                                    className="flex-1 bg-primary-500 text-white px-3 py-2 rounded text-sm hover:bg-primary-600 transition-colors"
                                >
                                    <Edit2 className="h-4 w-4 inline mr-1" />
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleToggleAvailability(item.itemId)}
                                    className={`flex-1 px-3 py-2 rounded text-sm transition-colors ${item.isAvailable
                                            ? 'bg-red-500 text-white hover:bg-red-600'
                                            : 'bg-green-500 text-white hover:bg-green-600'
                                        }`}
                                >
                                    {item.isAvailable ? (
                                        <>
                                            <EyeOff className="h-4 w-4 inline mr-1" />
                                            Hide
                                        </>
                                    ) : (
                                        <>
                                            <Eye className="h-4 w-4 inline mr-1" />
                                            Show
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={() => handleDeleteItem(item.itemId)}
                                    className="bg-red-500 text-white px-3 py-2 rounded text-sm hover:bg-red-600 transition-colors"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Create Item Form Modal */}
            {showCreateForm && (
                <CreateItemForm
                    categories={categories}
                    onSubmit={handleCreateItem}
                    onClose={() => setShowCreateForm(false)}
                />
            )}

            {/* Edit Item Form Modal */}
            {showEditForm && editingItem && (
                <EditItemForm
                    item={editingItem}
                    categories={categories}
                    onSubmit={(data) => handleEditItem(editingItem.itemId, data)}
                    onClose={() => {
                        setShowEditForm(false);
                        setEditingItem(null);
                    }}
                />
            )}

            {/* Create Category Form Modal */}
            {showCategoryForm && (
                <CreateCategoryForm
                    onSubmit={handleCreateCategory}
                    onClose={() => setShowCategoryForm(false)}
                />
            )}
        </div>
    );
};

// Create Item Form Component
const CreateItemForm = ({ categories, onSubmit, onClose }) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        category: '',
        prepTime: '',
        tags: '',
        imageUrl: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const itemData = {
            ...formData,
            price: parseFloat(formData.price),
            prepTime: parseInt(formData.prepTime) || 0,
            tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : [],
            isAvailable: true
        };

        const result = await onSubmit(itemData);
        if (result.success) {
            setFormData({
                name: '',
                description: '',
                price: '',
                category: '',
                prepTime: '',
                tags: '',
                imageUrl: ''
            });
        } else {
            setError(result.error);
        }
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                <h2 className="text-xl font-semibold mb-4">Create Menu Item</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Name *
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Price *
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                required
                                value={formData.price}
                                onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Prep Time (min)
                            </label>
                            <input
                                type="number"
                                value={formData.prepTime}
                                onChange={(e) => setFormData(prev => ({ ...prev, prepTime: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Category *
                        </label>
                        <select
                            required
                            value={formData.category}
                            onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                            <option value="">Select Category</option>
                            {categories && categories.map(category => (
                                <option key={category.categoryId} value={category.name}>
                                    {category.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tags (comma-separated)
                        </label>
                        <input
                            type="text"
                            value={formData.tags}
                            onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                            placeholder="e.g., spicy, vegetarian, gluten-free"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Image URL
                        </label>
                        <input
                            type="url"
                            value={formData.imageUrl}
                            onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                    </div>
                    {error && (
                        <div className="text-red-600 text-sm">{error}</div>
                    )}
                    <div className="flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 hover:text-gray-800"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50"
                        >
                            {loading ? 'Creating...' : 'Create Item'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Edit Item Form Component
const EditItemForm = ({ item, categories, onSubmit, onClose }) => {
    const [formData, setFormData] = useState({
        name: item.name || '',
        description: item.description || '',
        price: item.price?.toString() || '',
        category: item.category || '',
        prepTime: item.prepTime?.toString() || '',
        tags: item.tags ? item.tags.join(', ') : '',
        imageUrl: item.imageUrl || ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const itemData = {
            ...formData,
            price: parseFloat(formData.price),
            prepTime: parseInt(formData.prepTime) || 0,
            tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : []
        };

        const result = await onSubmit(itemData);
        if (result.success) {
            onClose();
        } else {
            setError(result.error);
        }
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                <h2 className="text-xl font-semibold mb-4">Edit Menu Item</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Name *
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Price *
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                required
                                value={formData.price}
                                onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Prep Time (min)
                            </label>
                            <input
                                type="number"
                                value={formData.prepTime}
                                onChange={(e) => setFormData(prev => ({ ...prev, prepTime: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Category *
                        </label>
                        <select
                            required
                            value={formData.category}
                            onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                            <option value="">Select Category</option>
                            {categories && categories.map(category => (
                                <option key={category.categoryId} value={category.name}>
                                    {category.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tags (comma-separated)
                        </label>
                        <input
                            type="text"
                            value={formData.tags}
                            onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                            placeholder="e.g., spicy, vegetarian, gluten-free"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Image URL
                        </label>
                        <input
                            type="url"
                            value={formData.imageUrl}
                            onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                    </div>
                    {error && (
                        <div className="text-red-600 text-sm">{error}</div>
                    )}
                    <div className="flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 hover:text-gray-800"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50"
                        >
                            {loading ? 'Updating...' : 'Update Item'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Create Category Form Component
const CreateCategoryForm = ({ onSubmit, onClose }) => {
    const [formData, setFormData] = useState({
        name: '',
        description: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const result = await onSubmit(formData);
        if (result.success) {
            setFormData({ name: '', description: '' });
        } else {
            setError(result.error);
        }
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h2 className="text-xl font-semibold mb-4">Create Category</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Name *
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                    </div>
                    {error && (
                        <div className="text-red-600 text-sm">{error}</div>
                    )}
                    <div className="flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 hover:text-gray-800"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50"
                        >
                            {loading ? 'Creating...' : 'Create Category'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default MenuManagement;
