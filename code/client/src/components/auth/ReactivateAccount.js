import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import apiService from '../../services/api';
// import { useAuth } from '../../contexts/AuthContext'; // Commented out - unused import

const ReactivateAccount = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    // const { login } = useAuth(); // Commented out - unused variable
    const [status, setStatus] = useState('loading'); // loading, success, error
    const [message, setMessage] = useState('');
    const token = searchParams.get('token');

    useEffect(() => {
        const reactivate = async () => {
            if (!token) {
                setStatus('error');
                setMessage('Invalid reactivation link. No token provided.');
                return;
            }

            try {
                const response = await apiService.reactivateAccount(token);

                if (response.success) {
                    setStatus('success');
                    setMessage('Account reactivated successfully! Redirecting to dashboard...');

                    // Store token and user data
                    if (response.data.token) {
                        localStorage.setItem('token', response.data.token);
                        if (response.data.user) {
                            localStorage.setItem('user', JSON.stringify(response.data.user));
                        }
                    }

                    // Redirect to dashboard after 2 seconds
                    setTimeout(() => {
                        navigate('/dashboard');
                    }, 2000);
                } else {
                    setStatus('error');
                    setMessage(response.message || 'Failed to reactivate account. The link may have expired.');
                }
            } catch (error) {
                console.error('Reactivation error:', error);
                setStatus('error');
                setMessage(error.message || 'An error occurred while reactivating your account.');
            }
        };

        reactivate();
    }, [token, navigate]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full"
            >
                <div className="text-center">
                    {status === 'loading' && (
                        <>
                            <Loader2 className="w-16 h-16 text-blue-500 mx-auto mb-4 animate-spin" />
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                Reactivating Your Account
                            </h2>
                            <p className="text-gray-600">
                                Please wait while we verify and reactivate your account...
                            </p>
                        </>
                    )}

                    {status === 'success' && (
                        <>
                            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                Account Reactivated!
                            </h2>
                            <p className="text-gray-600 mb-6">
                                {message}
                            </p>
                            <div className="animate-spin">
                                <Loader2 className="w-6 h-6 text-blue-500 mx-auto" />
                            </div>
                        </>
                    )}

                    {status === 'error' && (
                        <>
                            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                Reactivation Failed
                            </h2>
                            <p className="text-gray-600 mb-6">
                                {message}
                            </p>
                            <div className="space-y-3">
                                <button
                                    onClick={() => navigate('/login')}
                                    className="w-full btn btn-primary"
                                >
                                    Go to Login
                                </button>
                                <button
                                    onClick={() => navigate('/')}
                                    className="w-full px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                                >
                                    Go to Home
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default ReactivateAccount;

