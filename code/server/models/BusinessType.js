const { Sequelize, DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const BusinessType = sequelize.define('BusinessType', {
    businesstypeid: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    typename: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    created_by: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    updated_by: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'businesstype',
    timestamps: false, // Using created_at and updated_at manually
    underscored: true
});

module.exports = BusinessType;

