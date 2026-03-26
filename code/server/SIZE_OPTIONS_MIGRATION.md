# Menu Item Size Options - Database Migration Guide

## Overview
This migration adds size configuration support to menu items, allowing owners to configure size options (Small, Medium, Large) for any menu item, and enabling managers/employees to use these size options when adding items to orders.

## What Changed

### Database Schema
- **`hasSizes`** (BOOLEAN): Flag to enable/disable size options for a menu item
- **`sizes`** (JSONB): Stores size configurations with names and prices
  ```json
  {
    "small": { "name": "Small", "price": 10.00 },
    "medium": { "name": "Medium", "price": 12.00 },
    "large": { "name": "Large", "price": 15.00 }
  }
  ```

### Features
1. **Owner**: Can enable size options and configure sizes in Menu Management
2. **Manager**: Can use size options when adding items to orders in POS
3. **Employee**: Can use size options when adding items to orders in POS

## Automatic Migration

The migration runs automatically when the server starts. The `server.js` file includes the migration script that:
- Checks if columns exist
- Adds columns if they don't exist
- Handles errors gracefully

## Manual Migration

If you need to run the migration manually:

```bash
cd code/server
npm run migrate:sizes
```

Or directly:
```bash
node scripts/migrate-menu-item-sizes.js
```

## Verification

After migration, verify the columns exist:

```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'menu_items'
AND column_name IN ('hasSizes', 'sizes');
```

Expected output:
- `hasSizes`: BOOLEAN, NOT NULL, DEFAULT false
- `sizes`: JSONB, NULLABLE, DEFAULT NULL

## Usage

### For Owners (Menu Management)
1. Go to Menu Management
2. Create or edit a menu item
3. Check "Enable Size Options"
4. Configure size names and prices
5. Leave price empty to exclude a size option

### For Managers/Employees (POS System)
1. When adding an item with size options enabled, a size selection UI appears
2. Select the desired size
3. Item is added to order with the selected size and price

## Rollback (if needed)

To remove the size options feature:

```sql
ALTER TABLE menu_items DROP COLUMN IF EXISTS "hasSizes";
ALTER TABLE menu_items DROP COLUMN IF EXISTS sizes;
```

**Note**: This will remove all size configurations. Only do this if you're sure you want to remove the feature.

## Global Deployment

This migration is designed to work globally across all environments:
- ✅ Runs automatically on server startup
- ✅ Can be run manually if needed
- ✅ Idempotent (safe to run multiple times)
- ✅ Works with Sequelize's `alter: true` sync

## Support

If you encounter any issues:
1. Check server logs for migration errors
2. Verify database connection
3. Ensure PostgreSQL version supports JSONB (9.4+)
4. Run manual migration if automatic migration fails

