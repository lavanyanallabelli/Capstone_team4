const { Sequelize, DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const POSBlocks = sequelize.define('POSBlocks', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    ownerId: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
        references: {
            model: 'owners',
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    blocks: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {
            proteinTop: Array(3).fill(null),
            protein: Array(3).fill(null),
            toppings: Array(5).fill(null),
            extraProtein: Array(5).fill(null),
            snacks: Array(5).fill(null),
            drinks: Array(5).fill(null),
            categories: Array(9).fill(null)
        }
    }
}, {
    tableName: 'pos_blocks',
    timestamps: true
});

module.exports = POSBlocks;

