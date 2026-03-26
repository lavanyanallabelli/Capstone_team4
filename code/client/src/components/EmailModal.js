import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Mail, Send } from 'lucide-react';
import apiService from '../services/api';

const EmailModal = ({ isOpen, onClose, employee }) => {
    const [formData, setFormData] = useState({
        to: employee?.email || '',
        subject: '',
        message: ''
    });
    const [sending, setSending] = useState(false);
    const [error, setError] = useState('');

    // Reset form when employee changes or modal opens
    React.useEffect(() => {
        if (isOpen && employee) {
            setFormData({
                to: employee.email || '',
                subject: employee.employeeId 
                    ? `Welcome to ${employee.businessName || 'Your Restaurant'} - Your POS System Login Credentials`
                    : '',
                message: employee.employeeId 
                    ? `Hello ${employee.firstName} ${employee.lastName},\n\nYour account has been created for the ${employee.businessName || 'Your Restaurant'} POS system.\n\nLogin Credentials:\n- Employee ID: ${employee.employeeId}\n- Email: ${employee.email}\n- Login URL: ${window.location.origin}/employee-login\n\nPlease keep your credentials secure.\n\nBest regards,\nRestaurant Management`
                    : ''
            });
            setError('');
        }
    }, [isOpen, employee]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.to || !formData.subject || !formData.message.trim()) {
            setError('Please fill in all fields');
            return;
        }

        setSending(true);
        setError('');

        try {
            const response = await apiService.sendEmployeeEmail(employee.id, {
                to: formData.to,
                subject: formData.subject,
                message: formData.message
            });

            if (response.success) {
                alert('Email sent successfully!');
                onClose();
                // Reset form
                setFormData({
                    to: employee?.email || '',
                    subject: '',
                    message: ''
                });
            } else {
                setError(response.message || 'Failed to send email');
            }
        } catch (error) {
            console.error('Error sending email:', error);
            setError(error.response?.data?.message || 'Failed to send email. Please check SMTP configuration.');
        } finally {
            setSending(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Mail className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Send Email</h2>
                            <p className="text-sm text-gray-500">
                                {employee ? `To: ${employee.firstName} ${employee.lastName}` : 'Compose email'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
                    <div className="space-y-4">
                        {/* To Field */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                To (Email Address)
                            </label>
                            <input
                                type="email"
                                value={formData.to}
                                onChange={(e) => setFormData({ ...formData, to: e.target.value })}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="employee@example.com"
                            />
                        </div>

                        {/* Subject Field */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Subject
                            </label>
                            <input
                                type="text"
                                value={formData.subject}
                                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Email subject"
                            />
                        </div>

                        {/* Message Field */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Message
                            </label>
                            <textarea
                                value={formData.message}
                                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                required
                                rows="12"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                placeholder="Enter your message here..."
                            />
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-md p-3">
                                <p className="text-sm text-red-600">{error}</p>
                            </div>
                        )}
                    </div>
                </form>

                {/* Footer */}
                <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={sending}
                        className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        onClick={handleSubmit}
                        disabled={sending}
                        className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                    >
                        {sending ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                <span>Sending...</span>
                            </>
                        ) : (
                            <>
                                <Send className="w-4 h-4" />
                                <span>Send Email</span>
                            </>
                        )}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default EmailModal;

