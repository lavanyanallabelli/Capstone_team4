import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Clock, CreditCard, Bell, MapPin, Phone, Mail, Globe, Camera } from 'lucide-react';
import apiService from '../services/api';

const RestaurantSettings = () => {
    const [settings, setSettings] = useState({
        general: {
            restaurantName: '',
            address: '',
            city: '',
            state: '',
            zipCode: '',
            phone: '',
            email: '',
            website: '',
            description: ''
        },
        operatingHours: {
            monday: { open: '09:00', close: '22:00', isOpen: true },
            tuesday: { open: '09:00', close: '22:00', isOpen: true },
            wednesday: { open: '09:00', close: '22:00', isOpen: true },
            thursday: { open: '09:00', close: '22:00', isOpen: true },
            friday: { open: '09:00', close: '23:00', isOpen: true },
            saturday: { open: '10:00', close: '23:00', isOpen: true },
            sunday: { open: '10:00', close: '21:00', isOpen: true }
        },
        payment: {
            acceptCash: true,
            acceptCard: true,
            acceptDigital: true,
            taxRate: 8.5,
            serviceCharge: 0,
            minimumOrder: 0
        },
        notifications: {
            emailNotifications: true,
            smsNotifications: false,
            orderAlerts: true,
            lowStockAlerts: true,
            dailyReports: true
        }
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            setLoading(true);
            const response = await apiService.getRestaurantSettings();
            if (response.success) {
                setSettings(response.data);
            } else {
                setError('Failed to load settings');
            }
        } catch (error) {
            console.error('Error loading settings:', error);
            setError('Failed to load settings');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            setError('');
            setSuccess('');

            const response = await apiService.updateRestaurantSettings(settings);
            if (response.success) {
                setSuccess('Settings saved successfully!');
                setTimeout(() => setSuccess(''), 3000);
            } else {
                setError('Failed to save settings');
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            setError('Failed to save settings');
        } finally {
            setSaving(false);
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

    const handleOperatingHoursChange = (day, field, value) => {
        setSettings(prev => ({
            ...prev,
            operatingHours: {
                ...prev.operatingHours,
                [day]: {
                    ...prev.operatingHours[day],
                    [field]: value
                }
            }
        }));
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
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Restaurant Settings</h1>
                <p className="text-gray-600">Configure your restaurant information and preferences</p>
            </div>

            {/* Success/Error Messages */}
            {success && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                    <p className="text-green-600">{success}</p>
                </div>
            )}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                    <p className="text-red-600">{error}</p>
                </div>
            )}

            <div className="space-y-8">
                {/* General Information */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center mb-6">
                        <MapPin className="h-6 w-6 text-primary-600 mr-3" />
                        <h2 className="text-xl font-semibold text-gray-900">General Information</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Restaurant Name *
                            </label>
                            <input
                                type="text"
                                value={settings.general.restaurantName}
                                onChange={(e) => handleInputChange('general', 'restaurantName', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Phone Number
                            </label>
                            <input
                                type="tel"
                                value={settings.general.phone}
                                onChange={(e) => handleInputChange('general', 'phone', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Address
                            </label>
                            <input
                                type="text"
                                value={settings.general.address}
                                onChange={(e) => handleInputChange('general', 'address', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                City
                            </label>
                            <input
                                type="text"
                                value={settings.general.city}
                                onChange={(e) => handleInputChange('general', 'city', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                State
                            </label>
                            <input
                                type="text"
                                value={settings.general.state}
                                onChange={(e) => handleInputChange('general', 'state', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                ZIP Code
                            </label>
                            <input
                                type="text"
                                value={settings.general.zipCode}
                                onChange={(e) => handleInputChange('general', 'zipCode', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Description
                            </label>
                            <textarea
                                value={settings.general.description}
                                onChange={(e) => handleInputChange('general', 'description', e.target.value)}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                        </div>
                    </div>
                </div>

                {/* Operating Hours */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center mb-6">
                        <Clock className="h-6 w-6 text-primary-600 mr-3" />
                        <h2 className="text-xl font-semibold text-gray-900">Operating Hours</h2>
                    </div>
                    <div className="space-y-4">
                        {Object.entries(settings.operatingHours).map(([day, hours]) => (
                            <div key={day} className="flex items-center space-x-4">
                                <div className="w-24">
                                    <label className="block text-sm font-medium text-gray-700 capitalize">
                                        {day}
                                    </label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        checked={hours.isOpen}
                                        onChange={(e) => handleOperatingHoursChange(day, 'isOpen', e.target.checked)}
                                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                    />
                                    <span className="text-sm text-gray-600">Open</span>
                                </div>
                                {hours.isOpen && (
                                    <>
                                        <input
                                            type="time"
                                            value={hours.open}
                                            onChange={(e) => handleOperatingHoursChange(day, 'open', e.target.value)}
                                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                        />
                                        <span className="text-gray-500">to</span>
                                        <input
                                            type="time"
                                            value={hours.close}
                                            onChange={(e) => handleOperatingHoursChange(day, 'close', e.target.value)}
                                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                        />
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Payment Settings */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center mb-6">
                        <CreditCard className="h-6 w-6 text-primary-600 mr-3" />
                        <h2 className="text-xl font-semibold text-gray-900">Payment Settings</h2>
                    </div>
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Accepted Payment Methods</h3>
                            <div className="space-y-3">
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={settings.payment.acceptCash}
                                        onChange={(e) => handleInputChange('payment', 'acceptCash', e.target.checked)}
                                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                    />
                                    <span className="ml-2 text-sm text-gray-700">Cash</span>
                                </label>
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={settings.payment.acceptCard}
                                        onChange={(e) => handleInputChange('payment', 'acceptCard', e.target.checked)}
                                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                    />
                                    <span className="ml-2 text-sm text-gray-700">Credit/Debit Cards</span>
                                </label>
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={settings.payment.acceptDigital}
                                        onChange={(e) => handleInputChange('payment', 'acceptDigital', e.target.checked)}
                                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                    />
                                    <span className="ml-2 text-sm text-gray-700">Digital Payments (Apple Pay, Google Pay)</span>
                                </label>
                            </div>
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
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Minimum Order ($)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={settings.payment.minimumOrder}
                                    onChange={(e) => handleInputChange('payment', 'minimumOrder', parseFloat(e.target.value))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Notification Settings */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center mb-6">
                        <Bell className="h-6 w-6 text-primary-600 mr-3" />
                        <h2 className="text-xl font-semibold text-gray-900">Notification Settings</h2>
                    </div>
                    <div className="space-y-4">
                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                checked={settings.notifications.emailNotifications}
                                onChange={(e) => handleInputChange('notifications', 'emailNotifications', e.target.checked)}
                                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                            />
                            <span className="ml-2 text-sm text-gray-700">Email Notifications</span>
                        </label>
                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                checked={settings.notifications.smsNotifications}
                                onChange={(e) => handleInputChange('notifications', 'smsNotifications', e.target.checked)}
                                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                            />
                            <span className="ml-2 text-sm text-gray-700">SMS Notifications</span>
                        </label>
                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                checked={settings.notifications.orderAlerts}
                                onChange={(e) => handleInputChange('notifications', 'orderAlerts', e.target.checked)}
                                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                            />
                            <span className="ml-2 text-sm text-gray-700">Order Alerts</span>
                        </label>
                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                checked={settings.notifications.lowStockAlerts}
                                onChange={(e) => handleInputChange('notifications', 'lowStockAlerts', e.target.checked)}
                                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                            />
                            <span className="ml-2 text-sm text-gray-700">Low Stock Alerts</span>
                        </label>
                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                checked={settings.notifications.dailyReports}
                                onChange={(e) => handleInputChange('notifications', 'dailyReports', e.target.checked)}
                                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                            />
                            <span className="ml-2 text-sm text-gray-700">Daily Reports</span>
                        </label>
                    </div>
                </div>
            </div>

            {/* Save Button */}
            <div className="mt-8 flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-primary-500 text-white px-6 py-3 rounded-lg hover:bg-primary-600 disabled:opacity-50 flex items-center gap-2"
                >
                    <Save className="h-5 w-5" />
                    {saving ? 'Saving...' : 'Save Settings'}
                </button>
            </div>
        </div>
    );
};

export default RestaurantSettings;
