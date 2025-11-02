import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { USER_ROLES } from '../aws/userRoles';
import apiService from '../services/api';
import {
    Settings,
    Building,
    Clock,
    CreditCard,
    Bell,
    Save,
    Upload,
    Eye,
    EyeOff,
    User,
    Trash2,
    AlertCircle,
    Edit,
    Pencil,
    X,
    Check
} from 'lucide-react';

const RestaurantSettings = () => {
    const { currentUser, logout } = useAuth();
    const [activeTab, setActiveTab] = useState('profile');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(true);
    const [ownerProfile, setOwnerProfile] = useState(null);
    const [profileFormData, setProfileFormData] = useState({
        name: '',
        email: '',
        phone: '',
        businessName: '',
        businessType: 'Restaurant'
    });
    const [profileLoaded, setProfileLoaded] = useState(false);
    const [isProfileEditing, setIsProfileEditing] = useState(false);
    const [isGeneralEditing, setIsGeneralEditing] = useState(false);
    const [settings, setSettings] = useState({
        general: {
            restaurantName: '',
            businessType: 'Restaurant',
            address: '',
            phone: '',
            email: '',
            website: '',
            description: '',
            logo: null
        },
        hours: {
            monday: { open: '09:00', close: '22:00', closed: false },
            tuesday: { open: '09:00', close: '22:00', closed: false },
            wednesday: { open: '09:00', close: '22:00', closed: false },
            thursday: { open: '09:00', close: '22:00', closed: false },
            friday: { open: '09:00', close: '23:00', closed: false },
            saturday: { open: '10:00', close: '23:00', closed: false },
            sunday: { open: '10:00', close: '21:00', closed: false }
        },
        payment: {
            stripePublicKey: 'pk_test_...',
            stripeSecretKey: 'sk_test_...',
            paypalClientId: 'paypal_client_id',
            taxRate: 8.5,
            serviceCharge: 0,
            currency: 'USD'
        },
        notifications: {
            emailNotifications: true,
            smsNotifications: false,
            orderAlerts: true,
            lowInventoryAlerts: true,
            dailyReports: true,
            weeklyReports: true,
            monthlyReports: false
        }
    });

    const userRole = currentUser?.userRole || USER_ROLES.EMPLOYEE;

    // Load owner profile and settings on mount - must be before conditional return
    useEffect(() => {
        if (userRole === USER_ROLES.OWNER) {
            loadOwnerProfile();
            loadSettings();
        }
    }, [userRole]);

    const loadOwnerProfile = async () => {
        try {
            setLoading(true);
            const response = await apiService.getOwnerProfile();
            if (response.success) {
                setOwnerProfile(response.data);

                // Only update form data if values actually exist in response, otherwise keep empty
                setProfileFormData(prev => ({
                    name: response.data.name || '',
                    email: response.data.email || '',
                    phone: response.data.phone || '',
                    businessName: response.data.businessName || '',
                    businessType: response.data.businessType || 'Restaurant' // Default to Restaurant only if not provided
                }));

                // Update general settings with actual owner data only if it exists in response
                setSettings(prev => ({
                    ...prev,
                    general: {
                        ...prev.general,
                        restaurantName: response.data.businessName || '',
                        businessType: response.data.businessType || 'Restaurant', // Default only if not provided
                        phone: response.data.phone || '',
                        email: response.data.email || '',
                        // address, website, description will be loaded from settings API if they exist
                    }
                }));
                setProfileLoaded(true);
            }
        } catch (error) {
            console.error('Error loading owner profile:', error);
            alert('Failed to load profile. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const loadSettings = async () => {
        try {
            const response = await apiService.getSettings();
            if (response.success && response.data) {
                // Merge saved settings with owner profile data
                setSettings(prev => ({
                    ...prev,
                    general: {
                        restaurantName: prev.general.restaurantName || (response.data.general?.restaurantName || ''),
                        businessType: prev.general.businessType || (response.data.general?.businessType || 'Restaurant'),
                        address: response.data.general?.address || '',
                        phone: prev.general.phone || (response.data.general?.phone || ''),
                        email: prev.general.email || (response.data.general?.email || ''),
                        website: response.data.general?.website || '',
                        description: response.data.general?.description || '',
                        logo: response.data.general?.logo || null
                    },
                    hours: response.data.hours ? { ...response.data.hours } : prev.hours,
                    payment: response.data.payment ? { ...response.data.payment } : prev.payment,
                    notifications: response.data.notifications ? { ...response.data.notifications } : prev.notifications
                }));
            }
        } catch (error) {
            console.error('Error loading settings:', error);
            // Don't show error - settings might not exist yet, which is fine
        }
    };

    const handleUpdateProfile = async () => {
        try {
            const response = await apiService.updateOwnerProfile(profileFormData);
            if (response.success) {
                setOwnerProfile(response.data);
                alert('Profile updated successfully!');
                await loadOwnerProfile(); // Reload to get latest data
                setIsProfileEditing(false); // Exit edit mode after successful save
            } else {
                alert('Failed to update profile. Please try again.');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('Failed to update profile. Please try again.');
        }
    };

    const handleCancelProfileEdit = () => {
        // Reload original data to discard changes
        loadOwnerProfile();
        setIsProfileEditing(false);
    };

    const handleStartProfileEdit = () => {
        setIsProfileEditing(true);
    };

    const handleStartGeneralEdit = () => {
        setIsGeneralEditing(true);
    };

    const handleCancelGeneralEdit = () => {
        // Reload original settings to discard changes
        loadSettings();
        loadOwnerProfile(); // Reload owner profile to restore original values
        setIsGeneralEditing(false);
    };

    const handleDeleteAccount = async () => {
        const confirmMessage = `Are you sure you want to DELETE your account?\n\nThis will:\n- Deactivate your account\n- Disable all access\n- Your data will be preserved but inaccessible\n\nThis action cannot be undone easily.`;

        if (window.confirm(confirmMessage)) {
            const finalConfirm = window.confirm('This is your final warning. Click OK to permanently deactivate your account.');

            if (finalConfirm) {
                try {
                    const response = await apiService.deleteOwnerAccount();
                    if (response.success) {
                        alert('Account deactivated successfully. You will be logged out.');
                        logout();
                    }
                } catch (error) {
                    console.error('Error deleting account:', error);
                    alert('Failed to delete account. Please try again.');
                }
            }
        }
    };

    // const canManageRestaurantDetails = hasPermission(userRole, PERMISSIONS.CAN_MANAGE_RESTAURANT_DETAILS); // Commented out for future use
    // const canManagePaymentGateway = hasPermission(userRole, PERMISSIONS.CAN_MANAGE_PAYMENT_GATEWAY); // Commented out for future use
    // const canManageNotificationSettings = hasPermission(userRole, PERMISSIONS.CAN_MANAGE_NOTIFICATION_SETTINGS); // Commented out for future use

    // Only show this component to owners
    if (userRole !== USER_ROLES.OWNER) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Settings className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
                    <p className="text-gray-600">Only restaurant owners can manage settings.</p>
                </div>
            </div>
        );
    }

    const tabs = [
        { id: 'profile', label: 'Profile', icon: User },
        { id: 'general', label: 'General', icon: Building },
        { id: 'hours', label: 'Hours', icon: Clock },
        { id: 'payment', label: 'Payment', icon: CreditCard },
        { id: 'notifications', label: 'Notifications', icon: Bell }
    ];

    const handleSave = async (section) => {
        try {
            if (section === 'general') {
                // First, update owner profile if restaurantName, businessType, phone, or email changed
                // This ensures Profile tab and General tab stay in sync
                if (ownerProfile) {
                    const ownerUpdates = {};
                    let needsOwnerUpdate = false;

                    if (settings.general.restaurantName !== ownerProfile.businessName) {
                        ownerUpdates.businessName = settings.general.restaurantName;
                        needsOwnerUpdate = true;
                    }
                    if (settings.general.businessType !== ownerProfile.businessType) {
                        ownerUpdates.businessType = settings.general.businessType;
                        needsOwnerUpdate = true;
                    }
                    if (settings.general.phone !== ownerProfile.phone) {
                        ownerUpdates.phone = settings.general.phone;
                        needsOwnerUpdate = true;
                    }
                    if (settings.general.email !== ownerProfile.email) {
                        ownerUpdates.email = settings.general.email;
                        needsOwnerUpdate = true;
                    }

                    if (needsOwnerUpdate) {
                        console.log('📝 Updating owner profile from General tab:', ownerUpdates);
                        const ownerResponse = await apiService.updateOwnerProfile(ownerUpdates);
                        if (ownerResponse.success) {
                            // Reload owner profile to get updated data
                            await loadOwnerProfile();
                        }
                    }
                }

                // Save general settings to backend (address, website, description, etc.)
                const response = await apiService.updateGeneralSettings(settings.general);
                if (response.success) {
                    alert('General settings saved successfully!');
                    // Reload settings to get any server-side updates
                    await loadSettings();
                    await loadOwnerProfile(); // Reload owner profile to sync
                    setIsGeneralEditing(false); // Exit edit mode after successful save
                } else {
                    alert('Failed to save general settings. Please try again.');
                }
            } else if (section === 'hours') {
                // Save hours settings to backend
                const response = await apiService.updateHoursSettings(settings.hours);
                if (response.success) {
                    alert('Hours settings saved successfully!');
                } else {
                    alert('Failed to save hours settings. Please try again.');
                }
            } else if (section === 'payment') {
                // Save payment settings to backend
                const response = await apiService.updatePaymentSettings(settings.payment);
                if (response.success) {
                    alert('Payment settings saved successfully!');
                } else {
                    alert('Failed to save payment settings. Please try again.');
                }
            } else if (section === 'notifications') {
                // Save notification settings to backend
                const response = await apiService.updateNotificationSettings(settings.notifications);
                if (response.success) {
                    alert('Notification settings saved successfully!');
                } else {
                    alert('Failed to save notification settings. Please try again.');
                }
            } else {
                console.log(`Saving ${section} settings:`, settings[section]);
                alert(`${section.charAt(0).toUpperCase() + section.slice(1)} settings saved successfully!`);
            }
        } catch (error) {
            console.error(`Error saving ${section} settings:`, error);
            alert(`Failed to save ${section} settings. Please try again.`);
        }
    };

    const handleInputChange = (section, field, value) => {
        setSettings(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: value
            }
        }));
    };

    const handleHoursChange = (day, field, value) => {
        setSettings(prev => ({
            ...prev,
            hours: {
                ...prev.hours,
                [day]: {
                    ...prev.hours[day],
                    [field]: value
                }
            }
        }));
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Restaurant Settings
                    </h1>
                    <p className="text-gray-600">
                        Configure your restaurant details, hours, payment methods, and notifications
                    </p>
                </motion.div>

                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    {/* Tabs */}
                    <div className="border-b border-gray-200">
                        <nav className="flex space-x-8 px-6">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id
                                            ? 'border-blue-500 text-blue-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                            }`}
                                    >
                                        <Icon className="w-5 h-5 mr-2" />
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </nav>
                    </div>

                    {/* Tab Content */}
                    <div className="p-6">
                        {loading && (
                            <div className="flex justify-center items-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                            </div>
                        )}

                        {!loading && activeTab === 'profile' && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="space-y-6"
                            >
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                                    <div className="flex items-start">
                                        <AlertCircle className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
                                        <div>
                                            <h4 className="font-medium text-blue-900 mb-1">Restaurant Registration Details</h4>
                                            <p className="text-sm text-blue-700">
                                                This section shows the information you provided during registration.
                                                You can update these details or deactivate your account.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Full Name
                                        </label>
                                        <input
                                            type="text"
                                            value={profileFormData.name || ''}
                                            onChange={(e) => setProfileFormData({ ...profileFormData, name: e.target.value })}
                                            disabled={!isProfileEditing}
                                            maxLength={100}
                                            placeholder="Enter your full name"
                                            className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${!isProfileEditing ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white'}`}
                                        />
                                        <p className="mt-1 text-xs text-gray-500">
                                            {profileFormData.name?.length || 0}/100 characters
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Email
                                        </label>
                                        <input
                                            type="email"
                                            value={profileFormData.email || ''}
                                            onChange={(e) => setProfileFormData({ ...profileFormData, email: e.target.value })}
                                            disabled={!isProfileEditing}
                                            placeholder="Enter your email address"
                                            className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${!isProfileEditing ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white'}`}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Phone
                                        </label>
                                        <input
                                            type="tel"
                                            value={profileFormData.phone || ''}
                                            onChange={(e) => setProfileFormData({ ...profileFormData, phone: e.target.value })}
                                            disabled={!isProfileEditing}
                                            placeholder="Enter your phone number"
                                            className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${!isProfileEditing ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white'}`}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Business Type
                                        </label>
                                        <select
                                            value={profileFormData.businessType}
                                            onChange={(e) => setProfileFormData({ ...profileFormData, businessType: e.target.value })}
                                            disabled={!isProfileEditing}
                                            className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${!isProfileEditing ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white'}`}
                                        >
                                            <option value="Restaurant">Restaurant</option>
                                            <option value="Cafe">Cafe</option>
                                            <option value="Fast Food">Fast Food</option>
                                            <option value="Fine Dining">Fine Dining</option>
                                            <option value="Bar">Bar</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Business Name
                                    </label>
                                    <input
                                        type="text"
                                        value={profileFormData.businessName || ''}
                                        onChange={(e) => setProfileFormData({ ...profileFormData, businessName: e.target.value })}
                                        disabled={!isProfileEditing}
                                        maxLength={100}
                                        placeholder="Enter your business/restaurant name"
                                        className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${!isProfileEditing ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white'}`}
                                    />
                                    <p className="mt-1 text-xs text-gray-500">
                                        {profileFormData.businessName?.length || 0}/100 characters
                                    </p>
                                </div>

                                {ownerProfile && (
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <h4 className="text-sm font-medium text-gray-700 mb-2">Account Information</h4>
                                        <div className="space-y-1 text-sm text-gray-600">
                                            <p>Account Status: <span className={`font-medium ${ownerProfile.isActive ? 'text-green-600' : 'text-red-600'}`}>
                                                {ownerProfile.isActive ? 'Active' : 'Inactive'}
                                            </span></p>
                                            <p>Member Since: {new Date(ownerProfile.createdAt).toLocaleDateString()}</p>
                                            <p>Last Login: {ownerProfile.lastLogin ? new Date(ownerProfile.lastLogin).toLocaleString() : 'Never'}</p>
                                            <p>Login Count: {ownerProfile.loginCount || 0}</p>
                                        </div>
                                    </div>
                                )}

                                <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                                    <button
                                        onClick={handleDeleteAccount}
                                        className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-md font-medium flex items-center transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Delete Account
                                    </button>

                                    {!isProfileEditing ? (
                                        <button
                                            onClick={handleStartProfileEdit}
                                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium flex items-center transition-colors"
                                        >
                                            <Edit className="w-4 h-4 mr-2" />
                                            Edit Profile
                                        </button>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={handleCancelProfileEdit}
                                                className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-md font-medium flex items-center transition-colors"
                                            >
                                                <X className="w-4 h-4 mr-2" />
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleUpdateProfile}
                                                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md font-medium flex items-center transition-colors"
                                            >
                                                <Check className="w-4 h-4 mr-2" />
                                                Save
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {!loading && activeTab === 'general' && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="space-y-6"
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Restaurant Name
                                        </label>
                                        <input
                                            type="text"
                                            value={settings.general.restaurantName}
                                            onChange={(e) => handleInputChange('general', 'restaurantName', e.target.value)}
                                            disabled={!isGeneralEditing}
                                            className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${!isGeneralEditing ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white'}`}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Business Type
                                        </label>
                                        <select
                                            value={settings.general.businessType}
                                            onChange={(e) => handleInputChange('general', 'businessType', e.target.value)}
                                            disabled={!isGeneralEditing}
                                            className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${!isGeneralEditing ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white'}`}
                                        >
                                            <option value="Restaurant">Restaurant</option>
                                            <option value="Cafe">Cafe</option>
                                            <option value="Fast Food">Fast Food</option>
                                            <option value="Fine Dining">Fine Dining</option>
                                            <option value="Bar">Bar</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Address
                                    </label>
                                    <input
                                        type="text"
                                        value={settings.general.address}
                                        onChange={(e) => handleInputChange('general', 'address', e.target.value)}
                                        disabled={!isGeneralEditing}
                                        className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${!isGeneralEditing ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white'}`}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Phone
                                        </label>
                                        <input
                                            type="tel"
                                            value={settings.general.phone}
                                            onChange={(e) => handleInputChange('general', 'phone', e.target.value)}
                                            disabled={!isGeneralEditing}
                                            className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${!isGeneralEditing ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white'}`}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Email
                                        </label>
                                        <input
                                            type="email"
                                            value={settings.general.email}
                                            onChange={(e) => handleInputChange('general', 'email', e.target.value)}
                                            disabled={!isGeneralEditing}
                                            className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${!isGeneralEditing ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white'}`}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Website
                                        </label>
                                        <input
                                            type="url"
                                            value={settings.general.website}
                                            onChange={(e) => handleInputChange('general', 'website', e.target.value)}
                                            disabled={!isGeneralEditing}
                                            className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${!isGeneralEditing ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white'}`}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Description
                                    </label>
                                    <textarea
                                        value={settings.general.description}
                                        onChange={(e) => handleInputChange('general', 'description', e.target.value)}
                                        disabled={!isGeneralEditing}
                                        rows="3"
                                        className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${!isGeneralEditing ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white'}`}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Restaurant Logo
                                    </label>
                                    <div className="flex items-center space-x-4">
                                        <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                                            <Upload className="w-8 h-8 text-gray-400" />
                                        </div>
                                        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors">
                                            Upload Logo
                                        </button>
                                    </div>
                                </div>

                                <div className="flex justify-end items-center gap-2">
                                    {!isGeneralEditing ? (
                                        <button
                                            onClick={handleStartGeneralEdit}
                                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium flex items-center transition-colors"
                                        >
                                            <Edit className="w-4 h-4 mr-2" />
                                            Edit General Settings
                                        </button>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={handleCancelGeneralEdit}
                                                className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-md font-medium flex items-center transition-colors"
                                            >
                                                <X className="w-4 h-4 mr-2" />
                                                Cancel
                                            </button>
                                            <button
                                                onClick={() => handleSave('general')}
                                                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md font-medium flex items-center transition-colors"
                                            >
                                                <Check className="w-4 h-4 mr-2" />
                                                Save
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'hours' && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="space-y-6"
                            >
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Operating Hours</h3>
                                <div className="space-y-4">
                                    {Object.entries(settings.hours).map(([day, hours]) => (
                                        <div key={day} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                                            <div className="w-20">
                                                <span className="font-medium text-gray-900 capitalize">{day}</span>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <input
                                                    type="checkbox"
                                                    checked={!hours.closed}
                                                    onChange={(e) => handleHoursChange(day, 'closed', !e.target.checked)}
                                                    className="rounded border-gray-300"
                                                />
                                                <span className="text-sm text-gray-600">Open</span>
                                            </div>
                                            {!hours.closed && (
                                                <>
                                                    <input
                                                        type="time"
                                                        value={hours.open}
                                                        onChange={(e) => handleHoursChange(day, 'open', e.target.value)}
                                                        className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    />
                                                    <span className="text-gray-500">to</span>
                                                    <input
                                                        type="time"
                                                        value={hours.close}
                                                        onChange={(e) => handleHoursChange(day, 'close', e.target.value)}
                                                        className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    />
                                                </>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <div className="flex justify-end">
                                    <button
                                        onClick={() => handleSave('hours')}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium flex items-center transition-colors"
                                    >
                                        <Save className="w-4 h-4 mr-2" />
                                        Save Hours
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'payment' && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="space-y-6"
                            >
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Gateway Settings</h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Stripe Public Key
                                        </label>
                                        <input
                                            type="text"
                                            value={settings.payment.stripePublicKey}
                                            onChange={(e) => handleInputChange('payment', 'stripePublicKey', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Stripe Secret Key
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                value={settings.payment.stripeSecretKey}
                                                onChange={(e) => handleInputChange('payment', 'stripeSecretKey', e.target.value)}
                                                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 transform -translate-y-1/2"
                                            >
                                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        PayPal Client ID
                                    </label>
                                    <input
                                        type="text"
                                        value={settings.payment.paypalClientId}
                                        onChange={(e) => handleInputChange('payment', 'paypalClientId', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Tax Rate (%)
                                        </label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={settings.payment.taxRate}
                                            onChange={(e) => handleInputChange('payment', 'taxRate', parseFloat(e.target.value))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Service Charge (%)
                                        </label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={settings.payment.serviceCharge}
                                            onChange={(e) => handleInputChange('payment', 'serviceCharge', parseFloat(e.target.value))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Currency
                                        </label>
                                        <select
                                            value={settings.payment.currency}
                                            onChange={(e) => handleInputChange('payment', 'currency', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="USD">USD ($)</option>
                                            <option value="EUR">EUR (€)</option>
                                            <option value="GBP">GBP (£)</option>
                                            <option value="CAD">CAD (C$)</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="flex justify-end">
                                    <button
                                        onClick={() => handleSave('payment')}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium flex items-center transition-colors"
                                    >
                                        <Save className="w-4 h-4 mr-2" />
                                        Save Payment Settings
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'notifications' && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="space-y-6"
                            >
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Preferences</h3>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                        <div>
                                            <h4 className="font-medium text-gray-900">Email Notifications</h4>
                                            <p className="text-sm text-gray-600">Receive notifications via email</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={settings.notifications.emailNotifications}
                                                onChange={(e) => handleInputChange('notifications', 'emailNotifications', e.target.checked)}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                        </label>
                                    </div>

                                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                        <div>
                                            <h4 className="font-medium text-gray-900">SMS Notifications</h4>
                                            <p className="text-sm text-gray-600">Receive notifications via SMS</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={settings.notifications.smsNotifications}
                                                onChange={(e) => handleInputChange('notifications', 'smsNotifications', e.target.checked)}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                        </label>
                                    </div>

                                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                        <div>
                                            <h4 className="font-medium text-gray-900">Order Alerts</h4>
                                            <p className="text-sm text-gray-600">Get notified when new orders arrive</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={settings.notifications.orderAlerts}
                                                onChange={(e) => handleInputChange('notifications', 'orderAlerts', e.target.checked)}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                        </label>
                                    </div>

                                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                        <div>
                                            <h4 className="font-medium text-gray-900">Low Inventory Alerts</h4>
                                            <p className="text-sm text-gray-600">Get notified when inventory is low</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={settings.notifications.lowInventoryAlerts}
                                                onChange={(e) => handleInputChange('notifications', 'lowInventoryAlerts', e.target.checked)}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                        </label>
                                    </div>

                                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                        <div>
                                            <h4 className="font-medium text-gray-900">Daily Reports</h4>
                                            <p className="text-sm text-gray-600">Receive daily sales reports</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={settings.notifications.dailyReports}
                                                onChange={(e) => handleInputChange('notifications', 'dailyReports', e.target.checked)}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                        </label>
                                    </div>

                                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                        <div>
                                            <h4 className="font-medium text-gray-900">Weekly Reports</h4>
                                            <p className="text-sm text-gray-600">Receive weekly sales reports</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={settings.notifications.weeklyReports}
                                                onChange={(e) => handleInputChange('notifications', 'weeklyReports', e.target.checked)}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                        </label>
                                    </div>

                                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                        <div>
                                            <h4 className="font-medium text-gray-900">Monthly Reports</h4>
                                            <p className="text-sm text-gray-600">Receive monthly sales reports</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={settings.notifications.monthlyReports}
                                                onChange={(e) => handleInputChange('notifications', 'monthlyReports', e.target.checked)}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                        </label>
                                    </div>
                                </div>

                                <div className="flex justify-end">
                                    <button
                                        onClick={() => handleSave('notifications')}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium flex items-center transition-colors"
                                    >
                                        <Save className="w-4 h-4 mr-2" />
                                        Save Notification Settings
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RestaurantSettings;
