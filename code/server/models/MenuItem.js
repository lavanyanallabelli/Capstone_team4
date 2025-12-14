const { Sequelize, DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const MenuItem = sequelize.define('MenuItem', {
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
    name: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            min: 0
        }
    },
    category: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    prepTime: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    tags: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: true,
        defaultValue: []
    },
    availability: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    availabilitySchedule: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: null,
        comment: 'Time-based availability schedule: { "weekdays": { "breakfast": { "start": "07:00", "end": "11:00" }, ... }, "weekends": { ... } }'
    },
    image: {
        type: DataTypes.STRING(500),
        allowNull: true
    },
    hasSizes: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false
    },
    sizes: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: null,
        comment: 'Size configuration: { "small": { "name": "Small", "price": 10.00 }, "medium": { "name": "Medium", "price": 12.00 }, "large": { "name": "Large", "price": 15.00 } }'
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
    tableName: 'menu_items',
    timestamps: true,
    indexes: [
        {
            fields: ['ownerId']
        },
        {
            fields: ['category']
        },
        {
            fields: ['availability']
        }
    ]
});

module.exports = MenuItem;
