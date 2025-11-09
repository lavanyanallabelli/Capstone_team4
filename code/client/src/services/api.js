const API_BASE_URL = process.env.REACT_APP_API_URL || (typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? 'http://localhost:5000/api'
    : 'http://3.87.100.22:5000/api');

class ApiService {
    constructor() {
        this.baseURL = API_BASE_URL;
    }

    // Helper function to decode JWT and check expiry
    isTokenExpired(token) {
        try {
            if (!token) return true;
            const payload = JSON.parse(atob(token.split('.')[1]));
            const expiry = payload.exp * 1000; // Convert to milliseconds
            const now = Date.now();
            return now >= expiry;
        } catch (error) {
            console.error('Error checking token expiry:', error);
            return true; // If we can't decode, assume expired
        }
    }

    // Get auth token from AWS Cognito or employee JWT
    async getAuthToken() {
        try {
            // PRIORITY 1: Try to get Cognito token first (for owners)
            // This is important because owners use Cognito, employees use JWT
            const { Auth } = await import('aws-amplify');
            try {
                const session = await Auth.currentSession();
                if (session && session.isValid()) {
                    // Cognito session exists - this is an owner login
                    const cognitoToken = session.getIdToken().getJwtToken();
                    console.log('✅ Using Cognito token (Owner)');
                    return cognitoToken;
                }
            } catch (cognitoError) {
                // No active Cognito session - this is expected for employees
                console.log('ℹ️ No Cognito session (employee login expected)');
            }

            // PRIORITY 2: Only if no Cognito session, check for employee JWT token
            const employeeToken = localStorage.getItem('employeeToken');
            if (employeeToken) {
                // Check if token is expired
                if (this.isTokenExpired(employeeToken)) {
                    console.warn('⚠️ Employee token expired, clearing from storage');
                    localStorage.removeItem('employeeToken');
                    localStorage.removeItem('employeeUser');
                    return null;
                }
                console.log('✅ Using employee JWT token');
                return employeeToken;
            }

            return null;
        } catch (error) {
            // Fallback: check for employee token
            const employeeToken = localStorage.getItem('employeeToken');
            if (employeeToken) {
                // Check expiry in fallback too
                if (this.isTokenExpired(employeeToken)) {
                    localStorage.removeItem('employeeToken');
                    localStorage.removeItem('employeeUser');
                    return null;
                }
                console.log('✅ Using employee JWT token (fallback)');
                return employeeToken;
            }
            return null;
        }
    }

    // Set auth token (not needed for Cognito, but keeping for compatibility)
    setAuthToken(token) {
        // Cognito handles token storage automatically
        console.log('Token set via Cognito');
    }

    // Remove auth token (not needed for Cognito, but keeping for compatibility)
    removeAuthToken() {
        // Cognito handles token removal automatically
        console.log('Token removed via Cognito');
    }

    // Get headers with auth token
    async getHeaders(includeAuth = true) {
        const headers = {
            'Content-Type': 'application/json',
        };

        // Send Cognito token if available
        if (includeAuth) {
            try {
                const token = await this.getAuthToken();
                if (token) {
                    headers['Authorization'] = `Bearer ${token}`;
                }
            } catch (error) {
                // If token fetch fails, continue without auth (for testing)
                console.warn('Could not get auth token:', error.message);
            }
        }

        return headers;
    }

    // Generic request method
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;

        // Get auth headers (includes Cognito token if available)
        const authHeaders = await this.getHeaders(options.includeAuth !== false);

        const config = {
            ...options,
            headers: {
                ...authHeaders,
                ...(options.headers || {}), // Allow overriding headers if needed
            },
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                // Handle 403 (Forbidden) - likely expired token
                if (response.status === 403) {
                    const errorMessage = data.message || data.error || '';
                    if (errorMessage.includes('Token verification failed') ||
                        errorMessage.includes('expired') ||
                        errorMessage.includes('Invalid token')) {
                        console.warn('⚠️ Token expired or invalid, clearing from storage');
                        // Clear expired employee token
                        localStorage.removeItem('employeeToken');
                        localStorage.removeItem('employeeUser');
                        // Redirect to login if not already there
                        if (window.location.pathname !== '/employee-login' &&
                            window.location.pathname !== '/') {
                            window.location.href = '/';
                        }
                    }
                }

                // Create error with response data attached
                const error = new Error(data.message || data.error || `HTTP error! status: ${response.status}`);
                error.response = { data, status: response.status };
                throw error;
            }

            return data;
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    // GET request
    async get(endpoint, options = {}) {
        return this.request(endpoint, {
            method: 'GET',
            ...options,
        });
    }

    // POST request
    async post(endpoint, data, options = {}) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data),
            ...options,
        });
    }

    // PUT request
    async put(endpoint, data, options = {}) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data),
            ...options,
        });
    }

    // PATCH request
    async patch(endpoint, data, options = {}) {
        return this.request(endpoint, {
            method: 'PATCH',
            body: JSON.stringify(data),
            ...options,
        });
    }

    // DELETE request
    async delete(endpoint, options = {}) {
        return this.request(endpoint, {
            method: 'DELETE',
            ...options,
        });
    }

    // Authentication methods
    async register(userData) {
        const response = await this.post('/auth/register', userData, { includeAuth: false });
        if (response.success && response.data.token) {
            this.setAuthToken(response.data.token);
        }
        return response;
    }

    async login(credentials) {
        const response = await this.post('/auth/login', credentials, { includeAuth: false });
        if (response.success && response.data.token) {
            this.setAuthToken(response.data.token);
        }
        return response;
    }

    async employeeLogin(credentials) {
        const response = await this.post('/auth/employee-login', credentials, { includeAuth: false });
        if (response.success && response.data.token) {
            this.setAuthToken(response.data.token);
        }
        return response;
    }

    async logout() {
        const response = await this.post('/auth/logout');
        this.removeAuthToken();
        return response;
    }

    async verifyToken() {
        return this.get('/auth/verify');
    }

    async changePassword(passwordData) {
        return this.post('/auth/change-password', passwordData);
    }

    // Menu methods
    async getMenuItems(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = queryString ? `/menu?${queryString}` : '/menu';
        return this.get(endpoint);
    }

    async getMenuItem(itemId) {
        return this.get(`/menu/${itemId}`);
    }

    async createMenuItem(itemData) {
        return this.post('/menu', itemData);
    }

    async updateMenuItem(itemId, itemData) {
        return this.put(`/menu/${itemId}`, itemData);
    }

    async deleteMenuItem(itemId) {
        return this.delete(`/menu/${itemId}`);
    }

    async toggleItemAvailability(itemId, availability) {
        return this.patch(`/menu/${itemId}/availability`, { availability });
    }

    async getMenuItemAvailabilitySchedule(itemId) {
        return this.get(`/menu/${itemId}/availability-schedule`);
    }

    async updateMenuItemAvailabilitySchedule(itemId, availabilitySchedule) {
        return this.patch(`/menu/${itemId}/availability-schedule`, { availabilitySchedule });
    }

    async getMenuCategories() {
        return this.get('/menu/categories/list');
    }

    async getMenuStats() {
        return this.get('/menu/stats/overview');
    }

    // Employee methods
    async getEmployees(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = queryString ? `/employees?${queryString}` : '/employees';
        return this.get(endpoint);
    }

    async getEmployee(employeeId) {
        return this.get(`/employees/${employeeId}`);
    }

    async createEmployee(employeeData) {
        return this.post('/employees', employeeData);
    }

    async updateEmployee(employeeId, employeeData) {
        return this.put(`/employees/${employeeId}`, employeeData);
    }

    async updateEmployeeStatus(employeeId, isActive) {
        return this.patch(`/employees/${employeeId}/status`, { isActive });
    }

    async resetEmployeePassword(employeeId) {
        return this.post(`/employees/${employeeId}/reset-password`);
    }

    async getEmployeePerformance(employeeId, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = queryString
            ? `/employees/${employeeId}/performance?${queryString}`
            : `/employees/${employeeId}/performance`;
        return this.get(endpoint);
    }

    async getEmployeeActivity(employeeId, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = queryString
            ? `/employees/${employeeId}/activity?${queryString}`
            : `/employees/${employeeId}/activity`;
        return this.get(endpoint);
    }

    async getEmployeeStats() {
        return this.get('/employees/stats/overview');
    }

    // Analytics methods
    async getSalesAnalytics(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = queryString ? `/analytics/sales?${queryString}` : '/analytics/sales';
        return this.get(endpoint);
    }

    async getTopItems(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = queryString ? `/analytics/top-items?${queryString}` : '/analytics/top-items';
        return this.get(endpoint);
    }

    async getEmployeePerformanceAnalytics(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = queryString ? `/analytics/employee-performance?${queryString}` : '/analytics/employee-performance';
        return this.get(endpoint);
    }

    async getRevenueBreakdown(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = queryString ? `/analytics/revenue-breakdown?${queryString}` : '/analytics/revenue-breakdown';
        return this.get(endpoint);
    }

    async getCustomerAnalytics(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = queryString ? `/analytics/customers?${queryString}` : '/analytics/customers';
        return this.get(endpoint);
    }

    async getAnalyticsOverview(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = queryString ? `/analytics/overview?${queryString}` : '/analytics/overview';
        return this.get(endpoint);
    }

    // Settings methods
    // Owner/Restaurant Profile methods
    async getOwnerProfile() {
        return this.get('/owner/profile');
    }

    async updateOwnerProfile(profileData) {
        return this.put('/owner/profile', profileData);
    }

    // Subscription methods
    async getSubscriptionStatus() {
        return this.get('/subscription/status');
    }

    async purchaseSubscription(subscriptionData) {
        return this.post('/subscription/purchase', subscriptionData);
    }

    async deleteOwnerAccount() {
        return this.delete('/owner/profile');
    }

    async getSettings() {
        return this.get('/settings');
    }

    async getSetting(settingType) {
        return this.get(`/settings/${settingType}`);
    }

    async updateGeneralSettings(settings) {
        return this.put('/settings/general', settings);
    }

    async updateHoursSettings(settings) {
        return this.put('/settings/hours', settings);
    }

    async updatePaymentSettings(settings) {
        return this.put('/settings/payment', settings);
    }

    async updateNotificationSettings(settings) {
        return this.put('/settings/notifications', settings);
    }

    async initializeSettings() {
        return this.post('/settings/initialize');
    }

    async testPaymentGateway(gateway) {
        return this.post('/settings/payment/test', { gateway });
    }

    async sendTestNotification(type, recipient) {
        return this.post('/settings/notifications/test', { type, recipient });
    }

    // POS Orders API methods
    async createOrder(orderData) {
        return this.post('/orders', orderData);
    }

    async getOrders(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.get(`/orders${queryString ? `?${queryString}` : ''}`);
    }

    async getOrder(orderId) {
        return this.get(`/orders/${orderId}`);
    }

    async updateOrderStatus(orderId, status) {
        return this.patch(`/orders/${orderId}/status`, { status });
    }

    async updateOrder(orderId, orderData) {
        return this.put(`/orders/${orderId}`, orderData);
    }

    async processPayment(orderId, paymentData) {
        return this.post(`/orders/${orderId}/payment`, paymentData);
    }

    async deleteOrder(orderId) {
        return this.delete(`/orders/${orderId}`);
    }

    async refundPayment(orderId, paymentId, refundData) {
        return this.patch(`/orders/${orderId}/payment/${paymentId}/refund`, refundData);
    }

    async getOrderStats(period = 'today') {
        return this.get(`/orders/stats/overview?period=${period}`);
    }

    // Employee management API methods
    async sendEmployeeEmail(employeeId, emailData) {
        return this.post(`/employees/${employeeId}/send-email`, emailData);
    }

    async resendEmployeeCredentials(employeeId) {
        return this.post(`/employees/${employeeId}/resend-credentials`);
    }

    async deleteEmployee(employeeId) {
        return this.delete(`/employees/${employeeId}`);
    }

    // Schedule methods
    async getSchedules(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = queryString ? `/schedules?${queryString}` : '/schedules';
        return this.get(endpoint);
    }

    async getSchedule(scheduleId) {
        return this.get(`/schedules/${scheduleId}`);
    }

    async createSchedule(scheduleData) {
        return this.post('/schedules', scheduleData);
    }

    async updateSchedule(scheduleId, scheduleData) {
        return this.put(`/schedules/${scheduleId}`, scheduleData);
    }

    async deleteSchedule(scheduleId) {
        return this.delete(`/schedules/${scheduleId}`);
    }

    async sendScheduleEmail(scheduleId) {
        return this.post(`/schedules/${scheduleId}/send-email`);
    }
}

// Create and export a singleton instance
const apiService = new ApiService();
export default apiService;
