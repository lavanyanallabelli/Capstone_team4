require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { sequelize } = require('../models');

async function testKeys() {
    try {
        await sequelize.authenticate();
        
        const tableName = 'employees';
        
        // Get primary keys
        const [primaryKeys] = await sequelize.query(`
            SELECT a.attname as column_name
            FROM pg_index i
            JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
            WHERE i.indrelid = (SELECT oid FROM pg_class WHERE relname = :tableName)
            AND i.indisprimary = true
        `, { replacements: { tableName } });
        
        // Get foreign keys
        const [foreignKeys] = await sequelize.query(`
            SELECT
                kcu.column_name,
                ccu.table_name AS foreign_table_name,
                ccu.column_name AS foreign_column_name
            FROM information_schema.table_constraints AS tc
            JOIN information_schema.key_column_usage AS kcu
                ON tc.constraint_name = kcu.constraint_name
                AND tc.table_schema = kcu.table_schema
            JOIN information_schema.constraint_column_usage AS ccu
                ON ccu.constraint_name = tc.constraint_name
                AND ccu.table_schema = tc.table_schema
            WHERE tc.constraint_type = 'FOREIGN KEY'
            AND tc.table_name = :tableName
            AND tc.table_schema = 'public'
        `, { replacements: { tableName } });
        
        console.log('\n=== TESTING KEYS FOR EMPLOYEES TABLE ===\n');
        
        console.log('PRIMARY KEYS:');
        if (primaryKeys.length > 0) {
            primaryKeys.forEach(pk => {
                console.log(`  ✓ ${pk.column_name} is a PRIMARY KEY (PK)`);
            });
        } else {
            console.log('  ✗ No primary keys found');
        }
        
        console.log('\nFOREIGN KEYS:');
        if (foreignKeys.length > 0) {
            foreignKeys.forEach(fk => {
                console.log(`  ✓ ${fk.column_name} is a FOREIGN KEY (FK) → ${fk.foreign_table_name}.${fk.foreign_column_name}`);
            });
        } else {
            console.log('  ✗ No foreign keys found');
        }
        
        console.log('\n=== COLUMN LIST WITH KEYS ===\n');
        console.log('Column Name'.padEnd(30) + ' | Keys');
        console.log('-'.repeat(40));
        
        const [columns] = await sequelize.query(`
            SELECT column_name
            FROM information_schema.columns
            WHERE table_schema = 'public' 
            AND table_name = :tableName
            ORDER BY ordinal_position
        `, { replacements: { tableName } });
        
        const pkSet = new Set(primaryKeys.map(pk => pk.column_name));
        const fkMap = {};
        foreignKeys.forEach(fk => {
            fkMap[fk.column_name] = fk;
        });
        
        columns.forEach(col => {
            let keys = '';
            if (pkSet.has(col.column_name)) keys += 'PK';
            if (fkMap[col.column_name]) {
                if (keys) keys += ',';
                keys += 'FK';
            }
            if (!keys) keys = '-';
            
            console.log((col.column_name || '').padEnd(30) + ' | ' + keys);
        });
        
        await sequelize.close();
        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

testKeys();
