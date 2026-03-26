const { Sequelize, DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Order = sequelize.define('Order', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    orderNumber: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
    },
    ownerId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'owners',
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    employeeId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'employees',
            key: 'id'
        },
        onDelete: 'SET NULL'
    },
    orderDate: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    items: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: []
    },
    orderType: {
        type: DataTypes.ENUM('dine-in', 'to-go', 'takeout', 'delivery', 'online-order', 'pickup', 'drive-thru'),
        allowNull: false
    },
    tableNumber: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    customerName: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    totalAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
    },
    discountAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0.00
    },
    serviceCharge: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0.00
    },
    tax: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
    },
    tip: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0.00
    },
    finalTotal: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
    },
    status: {
        type: DataTypes.ENUM('pending', 'preparing', 'ready', 'completed', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending'
    },
    customerPhone: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    deliveryAddress: {
        type: DataTypes.JSONB,
        allowNull: true
    },
    deliveryFee: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0.00
    },
    doordashOrderId: {
        type: DataTypes.STRING(100),
        allowNull: true,
        unique: true
    },
    doordashStoreId: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    doordashMetadata: {
        type: DataTypes.JSONB,
        allowNull: true
    },
    createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'orders',
    timestamps: true,
    indexes: [
        {
            fields: ['ownerId']
        },
        {
            fields: ['employeeId']
        },
        {
            fields: ['orderDate']
        },
        {
            fields: ['status']
        },
        {
            unique: true,
            fields: ['orderNumber']
        }
    ]
});

module.exports = Order;
