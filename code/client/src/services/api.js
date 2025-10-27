import axios from 'axios';

class ApiService {
    constructor() {
        this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
    }

    async getHeaders(includeAuth = true) {
        const headers = {
            'Content-Type': 'application/json'
        };

        // Temporarily disable authentication for debugging
        if (false && includeAuth) {
            try {
                const { Auth } = await import('aws-amplify');
                const session = await Auth.currentSession();
                const token = session.getIdToken().getJwtToken();
                headers.Authorization = `Bearer ${token}`;
            } catch (error) {
                console.error('Error getting auth token:', error);
                throw new Error('User not authenticated');
            }
        }

        return headers;
    }

    async request(method, endpoint, data = null, includeAuth = true) {
        try {
            const headers = await this.getHeaders(includeAuth);
            const config = {
                method,
                url: `${this.baseURL}${endpoint}`,
                headers,
                data
            };

            const response = await axios(config);
            return {
                success: true,
                data: response.data,
                status: response.status
            };
        } catch (error) {
            console.error('API request failed:', error);
            if (error.response) {
                return {
                    success: false,
                    error: error.response.data?.message || 'API request failed',
                    status: error.response.status
                };
            } else if (error.request) {
                return {
                    success: false,
                    error: 'Network error - please check your connection',
                    status: 0
                };
            } else {
                return {
                    success: false,
                    error: error.message || 'Unknown error occurred',
                    status: 0
                };
            }
        }
    }

    // HTTP Methods
    async get(endpoint, includeAuth = true) {
        return this.request('GET', endpoint, null, includeAuth);
    }

    async post(endpoint, data, includeAuth = true) {
        return this.request('POST', endpoint, data, includeAuth);
    }

    async put(endpoint, data, includeAuth = true) {
        return this.request('PUT', endpoint, data, includeAuth);
    }

    async delete(endpoint, includeAuth = true) {
        return this.request('DELETE', endpoint, null, includeAuth);
    }

    async patch(endpoint, data, includeAuth = true) {
        return this.request('PATCH', endpoint, data, includeAuth);
    }

    // Menu API
    async getMenuItems() {
        return this.get('/menu');
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

    async toggleMenuItemAvailability(itemId, isAvailable) {
        return this.patch(`/menu/${itemId}/availability`, { isAvailable });
    }

    async getMenuCategories() {
        return this.get('/menu/categories/list');
    }

    async createMenuCategory(categoryData) {
        return this.post('/menu/categories', categoryData);
    }

    async getMenuStats() {
        return this.get('/menu/stats/overview');
    }

    // Employee API
    async getEmployees() {
        return this.get('/employees');
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

    async deleteEmployee(employeeId) {
        return this.delete(`/employees/${employeeId}`);
    }

    async toggleEmployeeStatus(employeeId, isActive) {
        return this.patch(`/employees/${employeeId}/status`, { isActive });
    }

    async resetEmployeePassword(employeeId) {
        return this.post(`/employees/${employeeId}/reset-password`);
    }

    // Analytics API
    async getAnalyticsOverview(period = '7d') {
        return this.get(`/analytics/overview?period=${period}`);
    }

    async getDailySales(period = '7d') {
        return this.get(`/analytics/daily-sales?period=${period}`);
    }

    async getTopItems(period = '7d') {
        return this.get(`/analytics/top-items?period=${period}`);
    }

    async getEmployeePerformance(period = '7d') {
        return this.get(`/analytics/employee-performance?period=${period}`);
    }

    async getRevenueBreakdown(period = '7d') {
        return this.get(`/analytics/revenue-breakdown?period=${period}`);
    }

    // Settings API
    async getRestaurantSettings() {
        return this.get('/settings');
    }

    async updateRestaurantSettings(settings) {
        return this.put('/settings', settings);
    }

    async getGeneralSettings() {
        return this.get('/settings/general');
    }

    async updateGeneralSettings(settings) {
        return this.put('/settings/general', settings);
    }

    async getOperatingHours() {
        return this.get('/settings/operating-hours');
    }

    async updateOperatingHours(hours) {
        return this.put('/settings/operating-hours', hours);
    }

    async getPaymentConfig() {
        return this.get('/settings/payment');
    }

    async updatePaymentConfig(config) {
        return this.put('/settings/payment', config);
    }

    async getNotificationSettings() {
        return this.get('/settings/notifications');
    }

    async updateNotificationSettings(settings) {
        return this.put('/settings/notifications', settings);
    }

    // Auth API
    async loginOwner(email, password) {
        return this.post('/auth/login', { email, password }, false);
    }

    async registerOwner(ownerData) {
        return this.post('/auth/register', ownerData, false);
    }

    async loginEmployee(employeeId, password) {
        return this.post('/auth/login-employee', { employeeId, password }, false);
    }

    async resetPassword(email) {
        return this.post('/auth/reset-password', { email }, false);
    }
}

const apiService = new ApiService();
export default apiService;
