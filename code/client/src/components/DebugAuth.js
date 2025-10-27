import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const DebugAuth = () => {
    const [testEmail, setTestEmail] = useState('test@example.com');
    const [testPassword, setTestPassword] = useState('Test123!');
    const [result, setResult] = useState('');
    const { login, signUp } = useAuth();

    const handleTestLogin = async () => {
        try {
            setResult('Testing login...');
            await login(testEmail, testPassword);
            setResult('✅ Login successful!');
        } catch (error) {
            setResult(`❌ Login failed: ${error.message}`);
        }
    };

    const handleTestSignup = async () => {
        try {
            setResult('Testing signup...');
            const userData = {
                businessName: 'Test Business',
                businessType: 'Restaurant',
                phone: '+1234567890'
            };
            await signUp(testEmail, testPassword, userData);
            setResult('✅ Signup successful! Check your email for verification.');
        } catch (error) {
            setResult(`❌ Signup failed: ${error.message}`);
        }
    };

    return (
        <div className="p-6 bg-gray-100 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Auth Debug Tool</h3>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-2">Test Email:</label>
                    <input
                        type="email"
                        value={testEmail}
                        onChange={(e) => setTestEmail(e.target.value)}
                        className="w-full p-2 border rounded"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-2">Test Password:</label>
                    <input
                        type="password"
                        value={testPassword}
                        onChange={(e) => setTestPassword(e.target.value)}
                        className="w-full p-2 border rounded"
                    />
                </div>
                <div className="flex space-x-4">
                    <button
                        onClick={handleTestSignup}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        Test Signup
                    </button>
                    <button
                        onClick={handleTestLogin}
                        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                    >
                        Test Login
                    </button>
                </div>
                {result && (
                    <div className="p-3 bg-white rounded border">
                        <pre className="text-sm">{result}</pre>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DebugAuth;
