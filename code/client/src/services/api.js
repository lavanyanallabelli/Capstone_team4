const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class ApiService {
    constructor() {
        this.baseURL = API_BASE_URL;
    }

    // Get auth token from AWS Cognito
    async getAuthToken() {
        try {
            // Import Auth from aws-amplify
            const { Auth } = await import('aws-amplify');

            // Get current session
            const session = await Auth.currentSession();
            if (session && session.isValid()) {
                return session.getIdToken().getJwtToken();
            }
            return null;
        } catch (error) {
            console.error('Error getting Cognito token:', error);
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

        // Temporarily disabled auth for testing - no token required
        if (false && includeAuth) {
            const token = await this.getAuthToken();
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            } else {
                throw new Error('Please provide a valid access token');
            }
        }

        return headers;
    }

    // Generic request method
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
            },
            ...options,
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `HTTP error! status: ${response.status}`);
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

    async deleteOrder(orderId) {
        return this.delete(`/orders/${orderId}`);
    }

    async getOrderStats(period = 'today') {
        return this.get(`/orders/stats/overview?period=${period}`);
    }

    // Employee management API methods
    async resendEmployeeCredentials(employeeId) {
        return this.post(`/employees/${employeeId}/resend-credentials`);
    }

    async deleteEmployee(employeeId) {
        return this.delete(`/employees/${employeeId}`);
    }
}

// Create and export a singleton instance
const apiService = new ApiService();
export default apiService;
