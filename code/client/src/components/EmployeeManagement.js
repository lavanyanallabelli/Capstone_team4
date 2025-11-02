import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { USER_ROLES, PERMISSIONS, hasPermission } from '../aws/userRoles';
import { Users, UserPlus, Edit, Trash2, Eye, UserCheck, Mail, UserX } from 'lucide-react';
import apiService from '../services/api';

const EmployeeManagement = () => {
    const { currentUser } = useAuth();
    const [employees, setEmployees] = useState([]);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const userRole = currentUser?.userRole || USER_ROLES.EMPLOYEE;
    const canCreateEmployee = hasPermission(userRole, PERMISSIONS.CAN_CREATE_EMPLOYEE);
    const canEditEmployee = hasPermission(userRole, PERMISSIONS.CAN_EDIT_EMPLOYEE);
    const canDeactivateEmployee = hasPermission(userRole, PERMISSIONS.CAN_DEACTIVATE_EMPLOYEE);
    const canViewEmployeeActivity = hasPermission(userRole, PERMISSIONS.CAN_VIEW_EMPLOYEE_ACTIVITY);

    // Load employees on component mount
    useEffect(() => {
        loadEmployees();
    }, []);

    const loadEmployees = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await apiService.getEmployees();
            if (response.success) {
                setEmployees(response.data);
            }
        } catch (error) {
            console.error('Error loading employees:', error);
            setError('Failed to load employees');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateEmployee = async (employeeData) => {
        try {
            const response = await apiService.createEmployee(employeeData);
            if (response.success) {
                setEmployees([...employees, response.data]);
                setShowCreateForm(false);
                alert(`Employee created successfully! Temporary password: ${response.tempPassword}`);
            }
        } catch (error) {
            console.error('Error creating employee:', error);
            alert('Failed to create employee. Please try again.');
        }
    };

    const handleUpdateEmployee = async (employeeId, employeeData) => {
        try {
            console.log('📝 Updating employee:', employeeId, employeeData);
            const response = await apiService.updateEmployee(employeeId, employeeData);
            if (response.success) {
                // Use emp.id (from backend) or emp.employeeId (fallback)
                setEmployees(employees.map(emp =>
                    (emp.id === employeeId || emp.employeeId === employeeId) ? response.data : emp
                ));
                setEditingEmployee(null);
                alert('Employee updated successfully!');
                // Reload employees to ensure consistency
                loadEmployees();
            }
        } catch (error) {
            console.error('Error updating employee:', error);
            alert('Failed to update employee. Please try again.');
        }
    };

    const handleToggleEmployeeStatus = async (employeeId, isActive) => {
        try {
            console.log('🔄 Toggling employee status:', employeeId, '→', isActive);
            const response = await apiService.updateEmployeeStatus(employeeId, isActive);
            if (response.success) {
                // Use emp.id (from backend) or emp.employeeId (fallback)
                setEmployees(employees.map(emp =>
                    (emp.id === employeeId || emp.employeeId === employeeId) ? response.data : emp
                ));
                alert(`Employee ${isActive ? 'activated' : 'deactivated'} successfully!`);
            }
        } catch (error) {
            console.error('Error updating employee status:', error);
            alert('Failed to update employee status. Please try again.');
        }
    };

    const handleResendCredentials = async (employeeId, employeeName) => {
        if (window.confirm(`Resend login credentials to ${employeeName}?`)) {
            try {
                const response = await apiService.resendEmployeeCredentials(employeeId);
                if (response.success) {
                    alert(`Login credentials sent successfully!\n\nEmployee ID: ${response.loginCredentials.employeeId}\nEmail: ${response.loginCredentials.email}\nTemporary Password: ${response.loginCredentials.tempPassword}\nLogin URL: ${response.loginCredentials.loginUrl}`);
                }
            } catch (error) {
                console.error('Error resending credentials:', error);
                alert('Failed to resend credentials. Please try again.');
            }
        }
    };

    const handleViewActivity = (employee) => {
        // Show employee activity in a modal or alert for now
        const activityInfo = `
Employee: ${employee.firstName} ${employee.lastName}
Email: ${employee.email}
Position: ${employee.position || 'Employee'}
Status: ${employee.isActive ? 'Active' : 'Inactive'}
Hire Date: ${employee.hireDate ? new Date(employee.hireDate).toLocaleDateString() : 'N/A'}
Last Login: ${employee.lastLogin ? new Date(employee.lastLogin).toLocaleString() : 'Never'}
Login Count: ${employee.loginCount || 0}
Created: ${new Date(employee.createdAt).toLocaleString()}
        `;
        alert(activityInfo);
    };

    const handleDeleteEmployee = async (employeeId, employeeName) => {
        if (window.confirm(`Are you sure you want to PERMANENTLY DELETE ${employeeName}?\n\nThis action cannot be undone and will:\n- Remove the employee from the system\n- Delete their login credentials\n- Remove all associated data`)) {
            try {
                console.log('🗑️ Deleting employee:', employeeId);
                const response = await apiService.deleteEmployee(employeeId);
                if (response.success) {
                    // Use emp.id (from backend) or emp.employeeId (fallback)
                    setEmployees(employees.filter(emp => 
                        emp.id !== employeeId && emp.employeeId !== employeeId
                    ));
                    alert('Employee deleted successfully!');
                    // Reload employees to ensure consistency
                    loadEmployees();
                }
            } catch (error) {
                console.error('Error deleting employee:', error);
                alert('Failed to delete employee. Please try again.');
            }
        }
    };

    // const handleResetPassword = async (employeeId) => { // Commented out for future use
    //     if (window.confirm('Are you sure you want to reset this employee\'s password?')) {
    //         try {
    //             const response = await apiService.resetEmployeePassword(employeeId);
    //             if (response.success) {
    //                 alert(`Password reset successfully! New temporary password: ${response.tempPassword}`);
    //             }
    //         } catch (error) {
    //             console.error('Error resetting password:', error);
    //             alert('Failed to reset password. Please try again.');
    //         }
    //     }
    // };

    // Only show this component to owners
    if (userRole !== USER_ROLES.OWNER) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
                    <p className="text-gray-600">Only restaurant owners can manage employees.</p>
                </div>
            </div>
        );
    }


    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                Employee Management
                            </h1>
                            <p className="text-gray-600">
                                Manage your restaurant staff and their access
                            </p>
                        </div>
                        {canCreateEmployee && (
                            <button
                                onClick={() => setShowCreateForm(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium flex items-center transition-colors"
                            >
                                <UserPlus className="w-5 h-5 mr-2" />
                                Add Employee
                            </button>
                        )}
                    </div>
                </motion.div>

                {/* Stats Cards */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
                >
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center">
                            <Users className="w-8 h-8 text-blue-600 mr-3" />
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Employees</p>
                                <p className="text-2xl font-bold text-gray-900">{employees.length}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center">
                            <UserCheck className="w-8 h-8 text-green-600 mr-3" />
                            <div>
                                <p className="text-sm font-medium text-gray-600">Active</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {employees.filter(emp => emp.isActive).length}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center">
                            <Users className="w-8 h-8 text-orange-600 mr-3" />
                            <div>
                                <p className="text-sm font-medium text-gray-600">Inactive</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {employees.filter(emp => !emp.isActive).length}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center">
                            <Users className="w-8 h-8 text-purple-600 mr-3" />
                            <div>
                                <p className="text-sm font-medium text-gray-600">New This Month</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {employees.filter(emp => {
                                        const hireDate = new Date(emp.hireDate || emp.createdAt);
                                        const thisMonth = new Date();
                                        thisMonth.setDate(1);
                                        return hireDate >= thisMonth;
                                    }).length}
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Loading State */}
                {loading && (
                    <div className="flex justify-center items-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
                        {error}
                    </div>
                )}

                {/* Employees Table */}
                {!loading && !error && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-lg shadow-md overflow-hidden"
                    >
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900">Employee List</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Employee
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Contact
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Join Date
                                        </th>
                                        {canViewEmployeeActivity && (
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Position
                                            </th>
                                        )}
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {employees.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                                                No employees found. Create your first employee to get started.
                                            </td>
                                        </tr>
                                    ) : (
                                        employees.map((employee) => {
                                            // Backend returns 'id' (UUID), frontend might use 'employeeId' - use both for compatibility
                                            const employeeId = employee.id || employee.employeeId;
                                            return (
                                            <tr key={employeeId} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="flex-shrink-0 h-10 w-10">
                                                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                                                <span className="text-sm font-medium text-blue-600">
                                                                    {`${employee.firstName} ${employee.lastName}`.split(' ').map(n => n[0]).join('')}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="ml-4">
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {`${employee.firstName} ${employee.lastName}`}
                                                            </div>
                                                            <div className="text-sm text-gray-500 font-mono">
                                                                Employee ID: {employee.employeeId || employeeId}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">{employee.email}</div>
                                                    <div className="text-sm text-gray-500">{employee.phone || 'No phone'}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${employee.isActive
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-red-100 text-red-800'
                                                        }`}>
                                                        {employee.isActive ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {employee.hireDate ? new Date(employee.hireDate).toLocaleDateString() : 'N/A'}
                                                </td>
                                                {canViewEmployeeActivity && (
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {employee.position || 'Employee'}
                                                    </td>
                                                )}
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    <div className="flex space-x-2">
                                                        {canViewEmployeeActivity && (
                                                            <button
                                                                onClick={() => handleViewActivity(employee)}
                                                                className="text-blue-600 hover:text-blue-900"
                                                                title="View employee activity"
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                        {canEditEmployee && (
                                                            <button
                                                                onClick={() => setEditingEmployee(employee)}
                                                                className="text-green-600 hover:text-green-900"
                                                                title="Edit employee"
                                                            >
                                                                <Edit className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => handleResendCredentials(employeeId, `${employee.firstName} ${employee.lastName}`)}
                                                            className="text-blue-600 hover:text-blue-900"
                                                            title="Resend login credentials"
                                                        >
                                                            <Mail className="w-4 h-4" />
                                                        </button>
                                                        {canDeactivateEmployee && (
                                                            <button
                                                                onClick={() => handleToggleEmployeeStatus(employeeId, !employee.isActive)}
                                                                className={`${employee.isActive ? 'text-orange-600 hover:text-orange-900' : 'text-green-600 hover:text-green-900'}`}
                                                                title={employee.isActive ? 'Deactivate employee' : 'Activate employee'}
                                                            >
                                                                {employee.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => handleDeleteEmployee(employeeId, `${employee.firstName} ${employee.lastName}`)}
                                                            className="text-red-600 hover:text-red-900"
                                                            title="Permanently delete employee"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}

                {/* Create Employee Form Modal */}
                {showCreateForm && (
                    <CreateEmployeeForm
                        onSubmit={handleCreateEmployee}
                        onCancel={() => setShowCreateForm(false)}
                    />
                )}

                {/* Edit Employee Form Modal */}
                {editingEmployee && (
                    <EditEmployeeForm
                        employee={editingEmployee}
                        onSubmit={(data) => handleUpdateEmployee(editingEmployee.id || editingEmployee.employeeId, data)}
                        onCancel={() => setEditingEmployee(null)}
                    />
                )}
            </div>
        </div>
    );
};

// Create Employee Form Component
const CreateEmployeeForm = ({ onSubmit, onCancel }) => {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        position: ''
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-lg p-6 w-full max-w-md"
            >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Employee</h3>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            First Name
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.firstName}
                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Last Name
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.lastName}
                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email
                        </label>
                        <input
                            type="email"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Phone
                        </label>
                        <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Position
                        </label>
                        <input
                            type="text"
                            value={formData.position}
                            onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-4 py-2 text-gray-600 hover:text-gray-800"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                            Create Employee
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

// Edit Employee Form Component
const EditEmployeeForm = ({ employee, onSubmit, onCancel }) => {
    const [formData, setFormData] = useState({
        firstName: employee.firstName || '',
        lastName: employee.lastName || '',
        email: employee.email || '',
        phone: employee.phone || ''
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        // Only pass the fields that the backend expects
        onSubmit({
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-lg p-6 w-full max-w-md"
            >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Employee</h3>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            First Name
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.firstName}
                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Last Name
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.lastName}
                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email
                        </label>
                        <input
                            type="email"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Phone
                        </label>
                        <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-4 py-2 text-gray-600 hover:text-gray-800"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                        >
                            Update Employee
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default EmployeeManagement;
