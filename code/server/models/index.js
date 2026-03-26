const { sequelize } = require('../config/database');

// Import all models
const Owner = require('./Owner');
const Employee = require('./Employee');
const MenuItem = require('./MenuItem');
const Order = require('./Order');
const Payment = require('./Payment');
const Setting = require('./Setting');
const Schedule = require('./Schedule');
const BusinessType = require('./BusinessType');
const POSBlocks = require('./POSBlocks');

// Define associations
Owner.hasMany(Employee, { foreignKey: 'ownerId', as: 'employees' });
Employee.belongsTo(Owner, { foreignKey: 'ownerId', as: 'owner' });

Owner.hasMany(MenuItem, { foreignKey: 'ownerId', as: 'menuItems' });
MenuItem.belongsTo(Owner, { foreignKey: 'ownerId', as: 'owner' });

Owner.hasMany(Order, { foreignKey: 'ownerId', as: 'orders' });
Order.belongsTo(Owner, { foreignKey: 'ownerId', as: 'owner' });

Owner.hasMany(Setting, { foreignKey: 'ownerId', as: 'settings' });
Setting.belongsTo(Owner, { foreignKey: 'ownerId', as: 'owner' });

Employee.hasMany(Order, { foreignKey: 'employeeId', as: 'orders' });
Order.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee' });

Employee.hasMany(Schedule, { foreignKey: 'employeeId', as: 'schedules' });
Schedule.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee' });

Owner.hasMany(Schedule, { foreignKey: 'ownerId', as: 'schedules' });
Schedule.belongsTo(Owner, { foreignKey: 'ownerId', as: 'owner' });

Order.hasMany(Payment, { foreignKey: 'orderId', as: 'payments' });
Payment.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });

Owner.hasOne(POSBlocks, { foreignKey: 'ownerId', as: 'posBlocks' });
POSBlocks.belongsTo(Owner, { foreignKey: 'ownerId', as: 'owner' });

module.exports = {
    sequelize,
    Owner,
    Employee,
    MenuItem,
    Order,
    Payment,
    Setting,
    Schedule,
    BusinessType,
    POSBlocks
};
