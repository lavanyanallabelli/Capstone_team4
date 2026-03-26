import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Lock, Check } from 'lucide-react';

const PaymentCardForm = ({ onSubmit, onCancel, plan, loading = false }) => {
    const [formData, setFormData] = useState({
        cardNumber: '',
        cardHolderName: '',
        expiryMonth: '',
        expiryYear: '',
        cvv: '',
        enableAutoPayment: true
    });

    const [errors, setErrors] = useState({});

    const formatCardNumber = (value) => {
        // Remove all non-digits
        const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
        // Add spaces every 4 digits
        const matches = v.match(/\d{4,16}/g);
        const match = (matches && matches[0]) || '';
        const parts = [];
        for (let i = 0, len = match.length; i < len; i += 4) {
            parts.push(match.substring(i, i + 4));
        }
        if (parts.length) {
            return parts.join(' ');
        } else {
            return v;
        }
    };

    const handleCardNumberChange = (e) => {
        const formatted = formatCardNumber(e.target.value);
        setFormData({ ...formData, cardNumber: formatted });
        if (errors.cardNumber) {
            setErrors({ ...errors, cardNumber: '' });
        }
    };

    const validateForm = () => {
        const newErrors = {};

        // Remove spaces from card number for validation
        const cardNumberDigits = formData.cardNumber.replace(/\s/g, '');
        if (cardNumberDigits.length < 13 || cardNumberDigits.length > 19) {
            newErrors.cardNumber = 'Card number must be between 13 and 19 digits';
        }

        if (!formData.cardHolderName.trim()) {
            newErrors.cardHolderName = 'Card holder name is required';
        }

        if (!formData.expiryMonth) {
            newErrors.expiryMonth = 'Month is required';
        }

        const currentYear = new Date().getFullYear();
        if (!formData.expiryYear || parseInt(formData.expiryYear) < currentYear) {
            newErrors.expiryYear = 'Valid year is required';
        }

        // Check if expiry date is in the past
        if (formData.expiryMonth && formData.expiryYear) {
            const expiryDate = new Date(parseInt(formData.expiryYear), parseInt(formData.expiryMonth) - 1);
            const now = new Date();
            if (expiryDate < now) {
                newErrors.expiryMonth = 'Card has expired';
            }
        }

        if (!formData.cvv || formData.cvv.length < 3 || formData.cvv.length > 4) {
            newErrors.cvv = 'CVV must be 3 or 4 digits';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validateForm()) {
            // Remove spaces from card number before submitting
            const cardNumberDigits = formData.cardNumber.replace(/\s/g, '');
            onSubmit({
                ...formData,
                cardNumber: cardNumberDigits
            });
        }
    };

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 10 }, (_, i) => currentYear + i);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-xl p-6 md:p-8 max-w-md w-full mx-auto"
        >
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Payment Details</h2>
                <Lock className="w-6 h-6 text-gray-400" />
            </div>

            <p className="text-gray-600 mb-6">
                Subscribe to <span className="font-semibold text-primary-600">{plan}</span> plan
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Card Number */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Card Number
                    </label>
                    <div className="relative">
                        <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            value={formData.cardNumber}
                            onChange={handleCardNumberChange}
                            placeholder="1234 5678 9012 3456"
                            maxLength={19}
                            className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${errors.cardNumber ? 'border-red-500' : 'border-gray-300'
                                }`}
                        />
                    </div>
                    {errors.cardNumber && (
                        <p className="mt-1 text-sm text-red-600">{errors.cardNumber}</p>
                    )}
                </div>

                {/* Card Holder Name */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Card Holder Name
                    </label>
                    <input
                        type="text"
                        value={formData.cardHolderName}
                        onChange={(e) => {
                            setFormData({ ...formData, cardHolderName: e.target.value });
                            if (errors.cardHolderName) {
                                setErrors({ ...errors, cardHolderName: '' });
                            }
                        }}
                        placeholder="John Doe"
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${errors.cardHolderName ? 'border-red-500' : 'border-gray-300'
                            }`}
                    />
                    {errors.cardHolderName && (
                        <p className="mt-1 text-sm text-red-600">{errors.cardHolderName}</p>
                    )}
                </div>

                {/* Expiry Date and CVV */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Expiry Month
                        </label>
                        <select
                            value={formData.expiryMonth}
                            onChange={(e) => {
                                setFormData({ ...formData, expiryMonth: e.target.value });
                                if (errors.expiryMonth) {
                                    setErrors({ ...errors, expiryMonth: '' });
                                }
                            }}
                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${errors.expiryMonth ? 'border-red-500' : 'border-gray-300'
                                }`}
                        >
                            <option value="">Month</option>
                            {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                                <option key={month} value={month.toString().padStart(2, '0')}>
                                    {month.toString().padStart(2, '0')}
                                </option>
                            ))}
                        </select>
                        {errors.expiryMonth && (
                            <p className="mt-1 text-sm text-red-600">{errors.expiryMonth}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Expiry Year
                        </label>
                        <select
                            value={formData.expiryYear}
                            onChange={(e) => {
                                setFormData({ ...formData, expiryYear: e.target.value });
                                if (errors.expiryYear) {
                                    setErrors({ ...errors, expiryYear: '' });
                                }
                            }}
                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${errors.expiryYear ? 'border-red-500' : 'border-gray-300'
                                }`}
                        >
                            <option value="">Year</option>
                            {years.map((year) => (
                                <option key={year} value={year}>
                                    {year}
                                </option>
                            ))}
                        </select>
                        {errors.expiryYear && (
                            <p className="mt-1 text-sm text-red-600">{errors.expiryYear}</p>
                        )}
                    </div>
                </div>

                {/* CVV */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        CVV
                    </label>
                    <input
                        type="text"
                        value={formData.cvv}
                        onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '');
                            setFormData({ ...formData, cvv: value });
                            if (errors.cvv) {
                                setErrors({ ...errors, cvv: '' });
                            }
                        }}
                        placeholder="123"
                        maxLength={4}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${errors.cvv ? 'border-red-500' : 'border-gray-300'
                            }`}
                    />
                    {errors.cvv && (
                        <p className="mt-1 text-sm text-red-600">{errors.cvv}</p>
                    )}
                </div>

                {/* Auto Payment Toggle */}
                <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg">
                    <input
                        type="checkbox"
                        id="autoPayment"
                        checked={formData.enableAutoPayment}
                        onChange={(e) => setFormData({ ...formData, enableAutoPayment: e.target.checked })}
                        className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                    />
                    <label htmlFor="autoPayment" className="flex-1 text-sm text-gray-700">
                        <span className="font-medium">Enable Auto-Payment</span>
                        <p className="text-gray-500 text-xs mt-1">
                            Your subscription will automatically renew each month
                        </p>
                    </label>
                </div>

                {/* Buttons */}
                <div className="flex space-x-4 pt-4">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={loading}
                        className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-lg hover:shadow-lg font-medium transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
                    >
                        {loading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>Processing...</span>
                            </>
                        ) : (
                            <>
                                <Check className="w-5 h-5" />
                                <span>Subscribe</span>
                            </>
                        )}
                    </button>
                </div>
            </form>

            <p className="text-xs text-gray-500 text-center mt-4">
                🔒 Your payment information is secure and encrypted
            </p>
        </motion.div>
    );
};

export default PaymentCardForm;

