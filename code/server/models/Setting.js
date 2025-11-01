const { Sequelize, DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Setting = sequelize.define('Setting', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
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
    settingType: {
        type: DataTypes.ENUM('general', 'hours', 'payment', 'notifications'),
        allowNull: false
    },
    data: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {}
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
    tableName: 'settings',
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ['ownerId', 'settingType']
        }
    ]
});

module.exports = Setting;
