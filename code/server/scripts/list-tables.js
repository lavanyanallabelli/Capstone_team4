require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { sequelize } = require('../models');

async function listTables() {
    try {
        await sequelize.authenticate();
        console.log('✅ Connected to database successfully\n');

        // Query to list all tables in the public schema
        const [results] = await sequelize.query(`
            SELECT 
                tablename,
                schemaname
            FROM pg_tables 
            WHERE schemaname = 'public'
            ORDER BY tablename;
        `);

        console.log('📋 Tables in the database:');
        console.log('─'.repeat(50));

        if (results.length === 0) {
            console.log('No tables found in the public schema.');
        } else {
            results.forEach((row, index) => {
                console.log(`${index + 1}. ${row.tablename}`);
            });
        }

        console.log('─'.repeat(50));
        console.log(`Total: ${results.length} table(s)\n`);

        // Display column information for each table
        for (const row of results) {
            const tableName = row.tablename;

            // Get column information from information_schema
            const [columns] = await sequelize.query(`
                SELECT 
                    column_name,
                    data_type,
                    character_maximum_length,
                    character_octet_length,
                    is_nullable,
                    column_default
                FROM information_schema.columns
                WHERE table_schema = 'public' 
                AND table_name = :tableName
                ORDER BY ordinal_position;
            `, {
                replacements: { tableName: tableName }
            });

            // Get primary keys
            const [primaryKeys] = await sequelize.query(`
                SELECT 
                    a.attname as column_name
                FROM pg_index i
                JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
                WHERE i.indrelid = (
                    SELECT oid FROM pg_class WHERE relname = :tableName
                )
                AND i.indisprimary = true
            `, {
                replacements: { tableName: tableName }
            });

            const primaryKeyColumns = new Set(primaryKeys.map(pk => pk.column_name));

            // Get foreign keys
            const [foreignKeys] = await sequelize.query(`
                SELECT
                    kcu.column_name,
                    ccu.table_name AS foreign_table_name,
                    ccu.column_name AS foreign_column_name,
                    tc.constraint_name
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
            `, {
                replacements: { tableName: tableName }
            });

            // Create a map of column names to their foreign key info
            const foreignKeyMap = {};
            foreignKeys.forEach(fk => {
                foreignKeyMap[fk.column_name] = {
                    table: fk.foreign_table_name,
                    column: fk.foreign_column_name,
                    constraint: fk.constraint_name
                };
            });

            // Get CHECK constraints that might define minimum lengths
            let minLengthMap = {};
            try {
                const [checkConstraints] = await sequelize.query(`
                    SELECT 
                        conname,
                        pg_get_constraintdef(oid) as constraint_def
                    FROM pg_constraint
                    WHERE conrelid = (
                        SELECT oid FROM pg_class WHERE relname = :tableName
                    )
                    AND contype = 'c'
                    AND pg_get_constraintdef(oid) LIKE '%LENGTH%'
                `, {
                    replacements: { tableName: tableName }
                });

                // Parse CHECK constraints for minimum length patterns
                checkConstraints.forEach(constraint => {
                    // Match patterns like: LENGTH(column_name) >= N or CHAR_LENGTH(column) >= N
                    const patterns = [
                        /LENGTH\s*\(\s*"?(\w+)"?\s*\)\s*>=\s*(\d+)/i,
                        /CHAR_LENGTH\s*\(\s*"?(\w+)"?\s*\)\s*>=\s*(\d+)/i,
                        /LENGTH\s*\(\s*"?(\w+)"?\s*\)\s*>\s*(\d+)/i
                    ];

                    for (const pattern of patterns) {
                        const match = constraint.constraint_def.match(pattern);
                        if (match) {
                            const colName = match[1];
                            const minLen = match[2];
                            minLengthMap[colName] = minLen;
                            break;
                        }
                    }
                });
            } catch (err) {
                // If query fails, continue without min length info (minLengthMap will remain empty)
            }

            console.log(`\n${'='.repeat(80)}`);
            console.log(`📊 Table: ${tableName.toUpperCase()}`);
            console.log('='.repeat(80));

            if (columns.length === 0) {
                console.log('(No columns found)');
                continue;
            }

            // Print column header
            console.log('Column Name'.padEnd(30) + ' | ' +
                'Keys'.padEnd(8) + ' | ' +
                'Data Type'.padEnd(20) + ' | ' +
                'Min Length'.padEnd(12) + ' | ' +
                'Max Length'.padEnd(12) + ' | ' +
                'Nullable'.padEnd(10) + ' | ' +
                'Default');
            console.log('-'.repeat(140));

            // Print each column
            columns.forEach(col => {
                const colName = (col.column_name || '').padEnd(30);

                // Build keys indicator
                let keysIndicator = '';
                if (primaryKeyColumns.has(col.column_name)) {
                    keysIndicator += 'PK';
                }
                if (foreignKeyMap[col.column_name]) {
                    if (keysIndicator) keysIndicator += ',';
                    keysIndicator += 'FK';
                }
                if (!keysIndicator) keysIndicator = '-';
                keysIndicator = keysIndicator.padEnd(8);

                const dataType = (col.data_type || '').padEnd(20);
                const minLength = (minLengthMap[col.column_name] || '-').padEnd(12);
                const maxLength = (col.character_maximum_length ? String(col.character_maximum_length) : '-').padEnd(12);
                const nullable = (col.is_nullable === 'YES' ? 'YES' : 'NO').padEnd(10);
                const defaultValue = col.column_default || '-';

                console.log(`${colName} | ${keysIndicator} | ${dataType} | ${minLength} | ${maxLength} | ${nullable} | ${defaultValue}`);
            });

            // Display foreign key relationships
            if (foreignKeys.length > 0) {
                console.log('\n🔗 Foreign Key Relationships:');
                console.log('-'.repeat(80));
                foreignKeys.forEach(fk => {
                    console.log(`  ${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name}`);
                });
            }

            // Display primary keys summary
            if (primaryKeyColumns.size > 0) {
                console.log('\n🔑 Primary Key(s):');
                console.log('-'.repeat(80));
                primaryKeyColumns.forEach(pkCol => {
                    console.log(`  ${pkCol}`);
                });
            }
        }

        console.log(`\n${'='.repeat(80)}`);
        console.log('✅ All tables displayed successfully');

        await sequelize.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error listing tables:', error.message);
        process.exit(1);
    }
}

listTables();
