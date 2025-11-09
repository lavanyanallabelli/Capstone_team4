import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/api';
import {
    Calendar,
    ArrowLeft,
    Save
} from 'lucide-react';

const MenuItemAvailabilitySchedule = () => {
    const navigate = useNavigate();
    console.log('MenuItemAvailabilitySchedule: useNavigate initialized', { navigate });
    const [menuItems, setMenuItems] = useState([]);
    const [selectedItem, setSelectedItem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Schedule structure
    const [schedule, setSchedule] = useState({
        weekdays: {
            breakfast: { enabled: false, start: '07:00', end: '11:00' },
            lunch: { enabled: false, start: '11:00', end: '15:00' },
            dinner: { enabled: false, start: '17:00', end: '22:00' }
        },
        weekends: {
            breakfast: { enabled: false, start: '08:00', end: '12:00' },
            lunch: { enabled: false, start: '12:00', end: '16:00' },
            dinner: { enabled: false, start: '18:00', end: '23:00' },
            specials: { enabled: false, start: '12:00', end: '20:00' }
        }
    });

    useEffect(() => {
        loadMenuItems();
    }, []);

    useEffect(() => {
        if (selectedItem) {
            loadItemSchedule(selectedItem.id);
        }
    }, [selectedItem]);

    const loadMenuItems = async () => {
        try {
            setLoading(true);
            const response = await apiService.getMenuItems();
            if (response.success) {
                setMenuItems(response.data);
            }
        } catch (error) {
            console.error('Error loading menu items:', error);
            setError('Failed to load menu items');
        } finally {
            setLoading(false);
        }
    };

    const loadItemSchedule = async (itemId) => {
        try {
            const response = await apiService.getMenuItemAvailabilitySchedule(itemId);
            if (response.success && response.data.availabilitySchedule) {
                setSchedule(response.data.availabilitySchedule);
            } else {
                // Reset to default if no schedule exists
                setSchedule({
                    weekdays: {
                        breakfast: { enabled: false, start: '07:00', end: '11:00' },
                        lunch: { enabled: false, start: '11:00', end: '15:00' },
                        dinner: { enabled: false, start: '17:00', end: '22:00' }
                    },
                    weekends: {
                        breakfast: { enabled: false, start: '08:00', end: '12:00' },
                        lunch: { enabled: false, start: '12:00', end: '16:00' },
                        dinner: { enabled: false, start: '18:00', end: '23:00' },
                        specials: { enabled: false, start: '12:00', end: '20:00' }
                    }
                });
            }
        } catch (error) {
            console.error('Error loading schedule:', error);
            setError('Failed to load availability schedule');
        }
    };

    const handleTimeSlotChange = (dayType, mealType, field, value) => {
        setSchedule(prev => ({
            ...prev,
            [dayType]: {
                ...prev[dayType],
                [mealType]: {
                    ...prev[dayType][mealType],
                    [field]: value
                }
            }
        }));
    };

    const handleToggleMeal = (dayType, mealType) => {
        setSchedule(prev => ({
            ...prev,
            [dayType]: {
                ...prev[dayType],
                [mealType]: {
                    ...prev[dayType][mealType],
                    enabled: !prev[dayType][mealType].enabled
                }
            }
        }));
    };

    const handleSave = async () => {
        if (!selectedItem) {
            setError('Please select a menu item');
            return;
        }

        try {
            setSaving(true);
            setError(null);
            setSuccess(null);

            const response = await apiService.updateMenuItemAvailabilitySchedule(selectedItem.id, schedule);
            if (response.success) {
                setSuccess('Availability schedule saved successfully!');
                setTimeout(() => setSuccess(null), 3000);
            } else {
                setError('Failed to save schedule');
            }
        } catch (error) {
            console.error('Error saving schedule:', error);
            setError(error.response?.data?.message || 'Failed to save availability schedule');
        } finally {
            setSaving(false);
        }
    };

    const renderTimeSlot = (dayType, mealType, label) => {
        const timeSlot = schedule[dayType][mealType];
        return (
            <div key={`${dayType}-${mealType}`} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                    <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={timeSlot.enabled}
                            onChange={() => handleToggleMeal(dayType, mealType)}
                            className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                        />
                        <span className="font-semibold text-gray-900">{label}</span>
                    </label>
                </div>
                {timeSlot.enabled && (
                    <div className="grid grid-cols-2 gap-3 mt-2">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Start Time
                            </label>
                            <input
                                type="time"
                                value={timeSlot.start}
                                onChange={(e) => handleTimeSlotChange(dayType, mealType, 'start', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                End Time
                            </label>
                            <input
                                type="time"
                                value={timeSlot.end}
                                onChange={(e) => handleTimeSlotChange(dayType, mealType, 'end', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                        </div>
                    </div>
                )}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading menu items...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="container mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => {
                                    console.log('Navigating to dashboard from MenuItemAvailabilitySchedule');
                                    navigate('/dashboard');
                                }}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5 text-gray-600" />
                            </button>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Schedule Availability</h1>
                                <p className="text-sm text-gray-600">Set time-based availability for menu items</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-6 py-8">
                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Left Side - Menu Items List */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Menu Items</h2>
                            <div className="space-y-2 max-h-[600px] overflow-y-auto">
                                {menuItems.length === 0 ? (
                                    <p className="text-gray-500 text-center py-8">No menu items found</p>
                                ) : (
                                    menuItems.map((item) => (
                                        <button
                                            key={item.id}
                                            onClick={() => setSelectedItem(item)}
                                            className={`w-full text-left p-3 rounded-lg transition-colors ${selectedItem?.id === item.id
                                                ? 'bg-primary-100 border-2 border-primary-500'
                                                : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                                                }`}
                                        >
                                            <div className="font-medium text-gray-900">{item.name}</div>
                                            <div className="text-sm text-gray-600">{item.category}</div>
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Side - Schedule Editor */}
                    <div className="lg:col-span-2">
                        {selectedItem ? (
                            <div className="bg-white rounded-lg shadow-sm p-6">
                                <div className="mb-6">
                                    <h2 className="text-xl font-bold text-gray-900 mb-2">
                                        {selectedItem.name}
                                    </h2>
                                    <p className="text-gray-600">{selectedItem.category}</p>
                                </div>

                                {error && (
                                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
                                        {error}
                                    </div>
                                )}

                                {success && (
                                    <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
                                        {success}
                                    </div>
                                )}

                                {/* Weekdays Schedule */}
                                <div className="mb-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                        <Calendar className="w-5 h-5 mr-2 text-primary-600" />
                                        Weekdays (Monday - Friday)
                                    </h3>
                                    <div className="space-y-3">
                                        {renderTimeSlot('weekdays', 'breakfast', 'Breakfast')}
                                        {renderTimeSlot('weekdays', 'lunch', 'Lunch')}
                                        {renderTimeSlot('weekdays', 'dinner', 'Dinner')}
                                    </div>
                                </div>

                                {/* Weekends Schedule */}
                                <div className="mb-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                        <Calendar className="w-5 h-5 mr-2 text-primary-600" />
                                        Weekends (Saturday - Sunday)
                                    </h3>
                                    <div className="space-y-3">
                                        {renderTimeSlot('weekends', 'breakfast', 'Breakfast')}
                                        {renderTimeSlot('weekends', 'lunch', 'Lunch')}
                                        {renderTimeSlot('weekends', 'dinner', 'Dinner')}
                                        {renderTimeSlot('weekends', 'specials', 'Weekend Specials')}
                                    </div>
                                </div>

                                {/* Save Button */}
                                <div className="flex justify-end space-x-3">
                                    <button
                                        onClick={() => setSelectedItem(null)}
                                        className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
                                    >
                                        <Save className="w-4 h-4" />
                                        <span>{saving ? 'Saving...' : 'Save Schedule'}</span>
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                                <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                    Select a Menu Item
                                </h3>
                                <p className="text-gray-600">
                                    Choose a menu item from the list to set its availability schedule
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MenuItemAvailabilitySchedule;

