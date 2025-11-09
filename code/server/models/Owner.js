const { Sequelize, DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Owner = sequelize.define('Owner', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true
        }
    },
    password: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    phone: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    businessName: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    businessType: {
        type: DataTypes.ENUM('Italian Restaurant', 'Chinese Restaurant', 'Indian Restaurant', 'Mexican Restaurant', 'Cafe'),
        allowNull: true,
        defaultValue: 'Italian Restaurant'
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    lastLogin: {
        type: DataTypes.DATE,
        allowNull: true
    },
    loginCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    subscriptionPlan: {
        type: DataTypes.ENUM('Free Trial', 'Basic', 'Pro', 'Enterprise'),
        defaultValue: 'Free Trial',
        allowNull: false
    },
    subscriptionStatus: {
        type: DataTypes.ENUM('active', 'trial', 'expired', 'cancelled'),
        defaultValue: 'trial',
        allowNull: false
    },
    trialEndDate: {
        type: DataTypes.DATE,
        allowNull: true
    },
    subscriptionStartDate: {
        type: DataTypes.DATE,
        allowNull: true
    },
    subscriptionEndDate: {
        type: DataTypes.DATE,
        allowNull: true
    },
    autoPayment: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false
    },
    paymentMethod: {
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
    tableName: 'owners',
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ['email']
        }
    ]
});

module.exports = Owner;
