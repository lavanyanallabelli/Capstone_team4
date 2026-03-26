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
    Tag,
    Check,
    X
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
    const [editingCategory, setEditingCategory] = useState(null);
    const [newCategoryName, setNewCategoryName] = useState('');
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
            console.log('📝 Creating menu item with data:', JSON.stringify(itemData, null, 2));

            // Validate required fields on client side first
            if (!itemData.name || itemData.name.trim() === '') {
                alert('Please enter an item name.');
                return;
            }
            if (!itemData.category || itemData.category.trim() === '') {
                alert('Please select a category.');
                return;
            }
            if (!itemData.description || itemData.description.trim() === '') {
                alert('Please enter a description.');
                return;
            }
            if (!itemData.price || isNaN(itemData.price) || itemData.price <= 0) {
                alert('Please enter a valid price.');
                return;
            }

            const response = await apiService.createMenuItem(itemData);
            if (response.success) {
                setMenuItems([...menuItems, response.data]);
                setShowCreateForm(false);
                // Show success message
                alert('Menu item created successfully!');
            } else {
                console.error('❌ Create failed:', response);
                const errorMsg = response.message || response.error || 'Unknown error';
                alert(`Failed to create menu item: ${errorMsg}`);
            }
        } catch (error) {
            console.error('Error creating menu item:', error);
            const errorDetails = error.response?.data?.details || [];
            const errorMessage = error.response?.data?.message ||
                (errorDetails.length > 0 ? errorDetails.map(d => d.message).join(', ') : error.message) ||
                'Please try again.';
            alert(`Failed to create menu item: ${errorMessage}`);
        }
    };

    const handleEditItem = async (itemId, updatedData) => {
        try {
            const response = await apiService.updateMenuItem(itemId, updatedData);
            if (response.success) {
                // Reload menu data to get fresh data from database
                await loadMenuData();
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

    const handleEditCategory = async (oldCategoryName, newCategoryName) => {
        if (!newCategoryName || newCategoryName.trim() === '') {
            alert('Category name cannot be empty');
            return;
        }
        if (newCategoryName === oldCategoryName) {
            return; // No change
        }

        try {
            // Update all items in this category to the new category name
            const itemsToUpdate = menuItems.filter(item => item.category === oldCategoryName);
            const updatePromises = itemsToUpdate.map(item =>
                apiService.updateMenuItem(item.itemId || item.id, {
                    ...item,
                    category: newCategoryName
                })
            );

            await Promise.all(updatePromises);
            await loadMenuData(); // Reload menu data
            alert(`Category "${oldCategoryName}" renamed to "${newCategoryName}" successfully!`);
        } catch (error) {
            console.error('Error editing category:', error);
            alert('Failed to edit category. Please try again.');
        }
    };

    const handleDeleteCategory = async (categoryName) => {
        const itemsInCategory = menuItems.filter(item => item.category === categoryName);
        if (itemsInCategory.length === 0) {
            return;
        }

        const confirmMessage = `Are you sure you want to delete the category "${categoryName}"?\n\nThis will delete ${itemsInCategory.length} item(s) in this category.`;
        if (!window.confirm(confirmMessage)) {
            return;
        }

        try {
            // Delete all items in this category
            const deletePromises = itemsInCategory.map(item =>
                apiService.deleteMenuItem(item.itemId || item.id)
            );

            await Promise.all(deletePromises);
            await loadMenuData(); // Reload menu data
            alert(`Category "${categoryName}" and all its items deleted successfully!`);
        } catch (error) {
            console.error('Error deleting category:', error);
            alert('Failed to delete category. Please try again.');
        }
    };

    const handleToggleCategoryAvailability = async (categoryName) => {
        try {
            const itemsInCategory = menuItems.filter(item => item.category === categoryName);
            if (itemsInCategory.length === 0) {
                return;
            }

            // Check current availability status - if all are unavailable, make all available, otherwise make all unavailable
            const allUnavailable = itemsInCategory.every(item => !item.availability);
            const newAvailability = allUnavailable; // If all unavailable, make available (true), otherwise make unavailable (false)

            // Update all items in this category
            const updatePromises = itemsInCategory.map(item =>
                apiService.toggleItemAvailability(item.itemId || item.id, newAvailability)
            );

            await Promise.all(updatePromises);
            await loadMenuData(); // Reload menu data
            alert(`Category "${categoryName}" ${newAvailability ? 'marked as available' : 'marked as unavailable'} successfully!`);
        } catch (error) {
            console.error('Error toggling category availability:', error);
            alert('Failed to update category availability. Please try again.');
        }
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

                {/* Menu Items Grouped by Category */}
                {!loading && !error && (() => {
                    // Group items by category
                    const groupedItems = {};
                    menuItems.forEach(item => {
                        const category = item.category || 'Uncategorized';
                        if (!groupedItems[category]) {
                            groupedItems[category] = [];
                        }
                        groupedItems[category].push(item);
                    });

                    return (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-8"
                        >
                            {Object.entries(groupedItems).map(([category, items]) => {
                                const isCategoryUnavailable = items.every(item => !item.availability);
                                const categoryItemCount = items.length;

                                return (
                                    <div key={category} className="bg-white rounded-lg shadow-md p-6">
                                        <div className="flex items-center justify-between mb-6 border-b pb-3">
                                            {editingCategory === category ? (
                                                <div className="flex items-center space-x-2 flex-1">
                                                    <input
                                                        type="text"
                                                        value={newCategoryName}
                                                        onChange={(e) => setNewCategoryName(e.target.value)}
                                                        className="text-2xl font-bold text-gray-900 capitalize border border-gray-300 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        placeholder="Category name"
                                                        autoFocus
                                                    />
                                                    <button
                                                        onClick={() => {
                                                            handleEditCategory(category, newCategoryName);
                                                            setEditingCategory(null);
                                                            setNewCategoryName('');
                                                        }}
                                                        className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                                                        title="Save"
                                                    >
                                                        <Check className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setEditingCategory(null);
                                                            setNewCategoryName('');
                                                        }}
                                                        className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                                                        title="Cancel"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <>
                                                    <h2 className="text-2xl font-bold text-gray-900 capitalize">
                                                        {category} <span className="text-sm font-normal text-gray-500">({categoryItemCount} items)</span>
                                                    </h2>
                                                    <div className="flex items-center space-x-2">
                                                        {canToggleAvailability && (
                                                            <button
                                                                onClick={() => handleToggleCategoryAvailability(category)}
                                                                className={`p-2 rounded-lg transition-colors ${isCategoryUnavailable
                                                                    ? 'bg-red-100 text-red-600 hover:bg-red-200'
                                                                    : 'bg-green-100 text-green-600 hover:bg-green-200'
                                                                    }`}
                                                                title={isCategoryUnavailable ? 'Mark Category as Available' : 'Mark Category as Unavailable'}
                                                            >
                                                                {isCategoryUnavailable ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                            </button>
                                                        )}
                                                        {canManageCategories && (
                                                            <>
                                                                <button
                                                                    onClick={() => {
                                                                        setEditingCategory(category);
                                                                        setNewCategoryName(category);
                                                                    }}
                                                                    className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                                                                    title="Edit Category Name"
                                                                >
                                                                    <Edit className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteCategory(category)}
                                                                    className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                                                                    title="Delete Category"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {items.map((item) => (
                                                <div key={item.itemId} className="bg-gray-50 rounded-lg shadow-sm overflow-hidden border border-gray-200">
                                                    <div className="p-4">
                                                        <div className="flex items-start justify-between mb-3">
                                                            <div className="flex-1">
                                                                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                                                    {item.name}
                                                                </h3>
                                                                <p className="text-gray-600 text-sm mb-2">
                                                                    {item.description}
                                                                </p>
                                                            </div>
                                                            <div className="flex items-center space-x-2 ml-2">
                                                                {canToggleAvailability && (
                                                                    <button
                                                                        onClick={() => handleToggleAvailability(item.itemId)}
                                                                        className={`p-2 rounded-lg transition-colors ${item.availability
                                                                            ? 'bg-green-100 text-green-600 hover:bg-green-200'
                                                                            : 'bg-red-100 text-red-600 hover:bg-red-200'
                                                                            }`}
                                                                        title={item.availability ? 'Mark as Unavailable' : 'Mark as Available'}
                                                                    >
                                                                        {item.availability ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                                                    </button>
                                                                )}
                                                                {canManageMenuItems && (
                                                                    <>
                                                                        <button
                                                                            onClick={() => setEditingItem(item)}
                                                                            className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                                                                            title="Edit Item"
                                                                        >
                                                                            <Edit className="w-4 h-4" />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleDeleteItem(item.itemId)}
                                                                            className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                                                                            title="Delete Item"
                                                                        >
                                                                            <Trash2 className="w-4 h-4" />
                                                                        </button>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center justify-between mb-2">
                                                            <div className="flex items-center text-green-600 font-semibold">
                                                                <DollarSign className="w-4 h-4 mr-1" />
                                                                ${typeof item.price === 'number' ? item.price.toFixed(2) : item.price}
                                                            </div>
                                                            <div className="flex items-center text-gray-500 text-sm">
                                                                <Clock className="w-4 h-4 mr-1" />
                                                                {item.prepTime || 'N/A'}
                                                            </div>
                                                        </div>

                                                        {item.tags && item.tags.length > 0 && (
                                                            <div className="mt-2 flex flex-wrap gap-1">
                                                                {item.tags.map((tag, index) => (
                                                                    <span key={index} className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                                                                        {tag}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}

                                                        {!item.availability && (
                                                            <div className="mt-2">
                                                                <span className="inline-block bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                                                                    Unavailable
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </motion.div>
                    );
                })()}

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
        selectedCategories: [], // For additional categories
        description: '',
        price: '',
        prepTime: '',
        tags: '',
        hasSizes: false,
        sizes: {
            small: { name: 'Small', price: '' },
            medium: { name: 'Medium', price: '' },
            large: { name: 'Large', price: '' }
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        const customTags = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
        // Combine additional categories with custom tags
        const allTags = [...(formData.selectedCategories || []), ...customTags];

        // Process sizes - only include sizes that have prices set
        let sizesData = null;
        let hasSizesValue = Boolean(formData.hasSizes) || false;

        if (formData.hasSizes) {
            sizesData = {};
            Object.keys(formData.sizes).forEach(sizeKey => {
                const size = formData.sizes[sizeKey];
                if (size.price && size.price !== '') {
                    sizesData[sizeKey] = {
                        name: size.name || sizeKey.charAt(0).toUpperCase() + sizeKey.slice(1),
                        price: parseFloat(size.price)
                    };
                }
            });
            // Only set sizes if at least one size has a price
            if (Object.keys(sizesData).length === 0) {
                sizesData = null;
                hasSizesValue = false; // If no sizes configured, set hasSizes to false
            }
        }

        const submitData = {
            name: formData.name?.trim() || '',
            category: formData.category?.trim() || '',
            description: formData.description?.trim() || '',
            price: parseFloat(formData.price),
            prepTime: formData.prepTime?.trim() || undefined,
            tags: allTags.length > 0 ? allTags : undefined,
            hasSizes: hasSizesValue,
            sizes: sizesData,
            availability: true
        };

        // Remove undefined values to avoid sending them
        Object.keys(submitData).forEach(key => {
            if (submitData[key] === undefined || submitData[key] === null) {
                delete submitData[key];
            }
        });

        onSubmit(submitData);
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
                            Primary Category <span className="text-gray-500 text-xs">(Required)</span>
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
                            Additional Categories <span className="text-gray-500 text-xs">(Optional - select multiple)</span>
                        </label>
                        <div className="border border-gray-300 rounded-md p-2 max-h-40 overflow-y-auto">
                            {categories && categories.length > 0 ? (
                                categories.map(category => {
                                    const isSelected = formData.selectedCategories?.includes(category);
                                    return (
                                        <label key={category} className="flex items-center space-x-2 py-1 hover:bg-gray-50 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={isSelected || false}
                                                onChange={(e) => {
                                                    const current = formData.selectedCategories || [];
                                                    if (e.target.checked) {
                                                        setFormData({
                                                            ...formData,
                                                            selectedCategories: [...current, category]
                                                        });
                                                    } else {
                                                        setFormData({
                                                            ...formData,
                                                            selectedCategories: current.filter(c => c !== category)
                                                        });
                                                    }
                                                }}
                                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <span className="text-sm text-gray-700">{category}</span>
                                        </label>
                                    );
                                })
                            ) : (
                                <p className="text-sm text-gray-500">No categories available</p>
                            )}
                        </div>
                        {formData.selectedCategories && formData.selectedCategories.length > 0 && (
                            <p className="mt-2 text-xs text-gray-500">
                                Selected: {formData.selectedCategories.join(', ')}
                            </p>
                        )}
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
                    <div className="mb-4">
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
                    <div className="mb-4">
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.hasSizes || false}
                                onChange={(e) => setFormData({ ...formData, hasSizes: e.target.checked })}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm font-medium text-gray-700">
                                Enable Size Options
                            </span>
                        </label>
                        <p className="text-xs text-gray-500 mt-1 ml-6">
                            Allow customers to select different sizes for this item
                        </p>
                    </div>
                    {formData.hasSizes && (
                        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                Size Configuration
                            </label>
                            {['small', 'medium', 'large'].map((sizeKey) => (
                                <div key={sizeKey} className="mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1">
                                            <input
                                                type="text"
                                                placeholder={`${sizeKey.charAt(0).toUpperCase() + sizeKey.slice(1)} Name`}
                                                value={formData.sizes[sizeKey]?.name || ''}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    sizes: {
                                                        ...formData.sizes,
                                                        [sizeKey]: {
                                                            ...formData.sizes[sizeKey],
                                                            name: e.target.value
                                                        }
                                                    }
                                                })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                            />
                                        </div>
                                        <div className="w-24">
                                            <input
                                                type="number"
                                                step="0.01"
                                                placeholder="Price"
                                                value={formData.sizes[sizeKey]?.price || ''}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    sizes: {
                                                        ...formData.sizes,
                                                        [sizeKey]: {
                                                            ...formData.sizes[sizeKey],
                                                            price: e.target.value
                                                        }
                                                    }
                                                })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <p className="text-xs text-gray-500 mt-2">
                                Leave price empty to exclude a size option
                            </p>
                        </div>
                    )}
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
    const [loading, setLoading] = useState(false);
    const [itemData, setItemData] = useState(item);

    // Extract itemId for logging (if needed for debugging)
    const itemId = itemData?.id || itemData?.itemId;

    // Reload item data when component mounts to ensure we have latest data
    useEffect(() => {
        const loadItemData = async () => {
            if (itemId) {
                try {
                    setLoading(true);
                    const response = await apiService.getMenuItem(itemId);
                    if (response.success && response.data) {
                        console.log('✅ Loaded item data for editing:', response.data);
                        setItemData(response.data);
                    }
                } catch (error) {
                    console.error('Error loading item data:', error);
                    // Use the item passed as prop if API call fails
                } finally {
                    setLoading(false);
                }
            }
        };
        loadItemData();
    }, [itemId]);

    // Separate category tags from other tags
    const categoryTags = (itemData.tags || []).filter(tag => categories && categories.includes(tag));
    const otherTags = (itemData.tags || []).filter(tag => !categories || !categories.includes(tag));

    // Initialize sizes from item or use defaults
    const initializeSizes = () => {
        console.log('Initializing sizes from itemData:', itemData);
        if (itemData.sizes && typeof itemData.sizes === 'object' && Object.keys(itemData.sizes).length > 0) {
            console.log('Item has sizes:', itemData.sizes);
            return {
                small: itemData.sizes.small ? {
                    name: itemData.sizes.small.name || 'Small',
                    price: itemData.sizes.small.price !== undefined ? itemData.sizes.small.price.toString() : ''
                } : { name: 'Small', price: '' },
                medium: itemData.sizes.medium ? {
                    name: itemData.sizes.medium.name || 'Medium',
                    price: itemData.sizes.medium.price !== undefined ? itemData.sizes.medium.price.toString() : ''
                } : { name: 'Medium', price: '' },
                large: itemData.sizes.large ? {
                    name: itemData.sizes.large.name || 'Large',
                    price: itemData.sizes.large.price !== undefined ? itemData.sizes.large.price.toString() : ''
                } : { name: 'Large', price: '' }
            };
        }
        console.log('No sizes found, using defaults');
        return {
            small: { name: 'Small', price: '' },
            medium: { name: 'Medium', price: '' },
            large: { name: 'Large', price: '' }
        };
    };

    const [formData, setFormData] = useState({
        name: itemData.name || '',
        category: itemData.category || '',
        selectedCategories: categoryTags, // Load existing category tags as additional categories
        description: itemData.description || '',
        price: itemData.price ? itemData.price.toString() : '',
        prepTime: itemData.prepTime || '',
        tags: otherTags.join(', '), // Only non-category tags in the tags field
        hasSizes: itemData.hasSizes || false,
        sizes: initializeSizes()
    });

    // Update form data when itemData changes (after reload)
    useEffect(() => {
        if (itemData && !loading) {
            const newCategoryTags = (itemData.tags || []).filter(tag => categories && categories.includes(tag));
            const newOtherTags = (itemData.tags || []).filter(tag => !categories || !categories.includes(tag));

            // Initialize sizes from current itemData
            let sizesData = {
                small: { name: 'Small', price: '' },
                medium: { name: 'Medium', price: '' },
                large: { name: 'Large', price: '' }
            };

            if (itemData.sizes && typeof itemData.sizes === 'object' && Object.keys(itemData.sizes).length > 0) {
                sizesData = {
                    small: itemData.sizes.small ? {
                        name: itemData.sizes.small.name || 'Small',
                        price: itemData.sizes.small.price !== undefined ? itemData.sizes.small.price.toString() : ''
                    } : { name: 'Small', price: '' },
                    medium: itemData.sizes.medium ? {
                        name: itemData.sizes.medium.name || 'Medium',
                        price: itemData.sizes.medium.price !== undefined ? itemData.sizes.medium.price.toString() : ''
                    } : { name: 'Medium', price: '' },
                    large: itemData.sizes.large ? {
                        name: itemData.sizes.large.name || 'Large',
                        price: itemData.sizes.large.price !== undefined ? itemData.sizes.large.price.toString() : ''
                    } : { name: 'Large', price: '' }
                };
            }

            setFormData({
                name: itemData.name || '',
                category: itemData.category || '',
                selectedCategories: newCategoryTags,
                description: itemData.description || '',
                price: itemData.price ? itemData.price.toString() : '',
                prepTime: itemData.prepTime || '',
                tags: newOtherTags.join(', '),
                hasSizes: itemData.hasSizes || false,
                sizes: sizesData
            });
        }
    }, [itemData, loading, categories]);

    const handleSubmit = (e) => {
        e.preventDefault();
        const customTags = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
        // Combine additional categories with custom tags
        const allTags = [...(formData.selectedCategories || []), ...customTags];

        // Process sizes - only include sizes that have prices set
        let sizesData = null;
        let hasSizesValue = Boolean(formData.hasSizes) || false;

        if (formData.hasSizes) {
            sizesData = {};
            Object.keys(formData.sizes).forEach(sizeKey => {
                const size = formData.sizes[sizeKey];
                if (size.price && size.price !== '') {
                    sizesData[sizeKey] = {
                        name: size.name || sizeKey.charAt(0).toUpperCase() + sizeKey.slice(1),
                        price: parseFloat(size.price)
                    };
                }
            });
            // Only set sizes if at least one size has a price
            if (Object.keys(sizesData).length === 0) {
                sizesData = null;
                hasSizesValue = false; // If no sizes configured, set hasSizes to false
            }
        }

        const submitData = {
            name: formData.name?.trim() || '',
            category: formData.category?.trim() || '',
            description: formData.description?.trim() || '',
            price: parseFloat(formData.price),
            prepTime: formData.prepTime?.trim() || undefined,
            tags: allTags.length > 0 ? allTags : undefined,
            hasSizes: hasSizesValue,
            sizes: sizesData
        };

        // Remove undefined values to avoid sending them
        Object.keys(submitData).forEach(key => {
            if (submitData[key] === undefined || submitData[key] === null) {
                delete submitData[key];
            }
        });

        onSubmit(submitData);
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
                            Primary Category <span className="text-gray-500 text-xs">(Required)</span>
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
                            Additional Categories <span className="text-gray-500 text-xs">(Optional - select multiple)</span>
                        </label>
                        <div className="border border-gray-300 rounded-md p-2 max-h-40 overflow-y-auto">
                            {categories && categories.length > 0 ? (
                                categories.map(category => {
                                    const isSelected = formData.selectedCategories?.includes(category);
                                    return (
                                        <label key={category} className="flex items-center space-x-2 py-1 hover:bg-gray-50 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={isSelected || false}
                                                onChange={(e) => {
                                                    const current = formData.selectedCategories || [];
                                                    if (e.target.checked) {
                                                        setFormData({
                                                            ...formData,
                                                            selectedCategories: [...current, category]
                                                        });
                                                    } else {
                                                        setFormData({
                                                            ...formData,
                                                            selectedCategories: current.filter(c => c !== category)
                                                        });
                                                    }
                                                }}
                                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <span className="text-sm text-gray-700">{category}</span>
                                        </label>
                                    );
                                })
                            ) : (
                                <p className="text-sm text-gray-500">No categories available</p>
                            )}
                        </div>
                        {formData.selectedCategories && formData.selectedCategories.length > 0 && (
                            <p className="mt-2 text-xs text-gray-500">
                                Selected: {formData.selectedCategories.join(', ')}
                            </p>
                        )}
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
                    <div className="mb-4">
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
                    <div className="mb-4">
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.hasSizes || false}
                                onChange={(e) => setFormData({ ...formData, hasSizes: e.target.checked })}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm font-medium text-gray-700">
                                Enable Size Options
                            </span>
                        </label>
                        <p className="text-xs text-gray-500 mt-1 ml-6">
                            Allow customers to select different sizes for this item
                        </p>
                    </div>
                    {formData.hasSizes && (
                        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                Size Configuration
                            </label>
                            {['small', 'medium', 'large'].map((sizeKey) => (
                                <div key={sizeKey} className="mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1">
                                            <input
                                                type="text"
                                                placeholder={`${sizeKey.charAt(0).toUpperCase() + sizeKey.slice(1)} Name`}
                                                value={formData.sizes[sizeKey]?.name || ''}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    sizes: {
                                                        ...formData.sizes,
                                                        [sizeKey]: {
                                                            ...formData.sizes[sizeKey],
                                                            name: e.target.value
                                                        }
                                                    }
                                                })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                            />
                                        </div>
                                        <div className="w-24">
                                            <input
                                                type="number"
                                                step="0.01"
                                                placeholder="Price"
                                                value={formData.sizes[sizeKey]?.price || (formData.sizes[sizeKey]?.price === 0 ? '0' : '')}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    sizes: {
                                                        ...formData.sizes,
                                                        [sizeKey]: {
                                                            ...formData.sizes[sizeKey],
                                                            price: e.target.value
                                                        }
                                                    }
                                                })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <p className="text-xs text-gray-500 mt-2">
                                Leave price empty to exclude a size option
                            </p>
                        </div>
                    )}
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
