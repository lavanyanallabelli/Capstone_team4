/**
 * Migration Script: Add Size Options to Menu Items
 * 
 * This script adds the hasSizes and sizes columns to the menu_items table.
 * Run this script to ensure the database schema is updated globally.
 * 
 * Usage:
 *   node scripts/migrate-menu-item-sizes.js
 */

const { sequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');

async function migrateMenuItemSizes() {
    try {
        console.log('🔄 Starting menu item sizes migration...');

        // First check if table exists
        const [tables] = await sequelize.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'menu_items'
        `, { type: QueryTypes.SELECT });

        if (!tables || tables.length === 0) {
            console.log('ℹ️  menu_items table does not exist yet. Sequelize sync will create it with the new columns.');
            return; // Table will be created by Sequelize sync with all columns
        }

        // Check if columns already exist
        const columns = await sequelize.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'menu_items' 
            AND column_name IN ('hasSizes', 'sizes')
        `, { type: QueryTypes.SELECT });

        const existingColumns = Array.isArray(columns) ? columns.map(col => col.column_name) : [];

        // Add hasSizes column if it doesn't exist
        if (!existingColumns.includes('hasSizes')) {
            console.log('📝 Adding hasSizes column...');
            await sequelize.query(`
                ALTER TABLE menu_items 
                ADD COLUMN "hasSizes" BOOLEAN NOT NULL DEFAULT false
            `);
            console.log('✅ hasSizes column added');
        } else {
            console.log('ℹ️  hasSizes column already exists');
        }

        // Add sizes column if it doesn't exist
        if (!existingColumns.includes('sizes')) {
            console.log('📝 Adding sizes column...');
            await sequelize.query(`
                ALTER TABLE menu_items 
                ADD COLUMN sizes JSONB DEFAULT NULL
            `);
            console.log('✅ sizes column added');
        } else {
            console.log('ℹ️  sizes column already exists');
        }

        // Add comment to sizes column
        try {
            await sequelize.query(`
                COMMENT ON COLUMN menu_items.sizes IS 
                'Size configuration: { "small": { "name": "Small", "price": 10.00 }, "medium": { "name": "Medium", "price": 12.00 }, "large": { "name": "Large", "price": 15.00 } }'
            `);
            console.log('✅ Column comments added');
        } catch (commentError) {
            // Comment might not be supported or already exists
            console.log('ℹ️  Could not add column comment (this is okay)');
        }

        console.log('✅ Migration completed successfully!');
        console.log('\n📊 Summary:');
        console.log('   - hasSizes: Boolean field to enable/disable size options');
        console.log('   - sizes: JSONB field to store size configurations');
        console.log('\n💡 Owners can now configure size options for any menu item in Menu Management.');
        console.log('💡 Managers and employees can use size options when adding items to orders.');

    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    }
}

// Run migration if script is executed directly
if (require.main === module) {
    migrateMenuItemSizes()
        .then(() => {
            console.log('\n✅ Migration script completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ Migration script failed:', error);
            process.exit(1);
        });
}

module.exports = { migrateMenuItemSizes };

