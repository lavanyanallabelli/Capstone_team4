require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { sequelize } = require('../models');

async function showRelations() {
    try {
        await sequelize.authenticate();
        console.log('✅ Connected to database successfully\n');

        // Get all tables
        const [tables] = await sequelize.query(`
            SELECT tablename
            FROM pg_tables 
            WHERE schemaname = 'public'
            ORDER BY tablename;
        `);

        console.log('🔗 Database Relationships\n');
        console.log('='.repeat(80));

        // Get all foreign key relationships
        const [allForeignKeys] = await sequelize.query(`
            SELECT
                tc.table_name AS from_table,
                kcu.column_name AS from_column,
                ccu.table_name AS to_table,
                ccu.column_name AS to_column,
                tc.constraint_name
            FROM information_schema.table_constraints AS tc
            JOIN information_schema.key_column_usage AS kcu
                ON tc.constraint_name = kcu.constraint_name
                AND tc.table_schema = kcu.table_schema
            JOIN information_schema.constraint_column_usage AS ccu
                ON ccu.constraint_name = tc.constraint_name
                AND ccu.table_schema = tc.table_schema
            WHERE tc.constraint_type = 'FOREIGN KEY'
            AND tc.table_schema = 'public'
            ORDER BY tc.table_name, kcu.column_name;
        `);

        // Group by table
        const relationsByTable = {};
        allForeignKeys.forEach(fk => {
            if (!relationsByTable[fk.from_table]) {
                relationsByTable[fk.from_table] = [];
            }
            relationsByTable[fk.from_table].push(fk);
        });

        // Display relationships for each table
        tables.forEach(table => {
            const tableName = table.tablename;
            const relations = relationsByTable[tableName] || [];

            console.log(`\n📊 Table: ${tableName.toUpperCase()}`);
            console.log('-'.repeat(80));

            if (relations.length === 0) {
                console.log('  No outgoing foreign keys (this table is not referenced by others)');
            } else {
                console.log('  Foreign Keys (outgoing):');
                relations.forEach(rel => {
                    console.log(`    ${rel.from_column} → ${rel.to_table}.${rel.to_column}`);
                });
            }

            // Find tables that reference this table
            const incomingRelations = allForeignKeys.filter(fk => fk.to_table === tableName);
            if (incomingRelations.length > 0) {
                console.log('  Referenced by (incoming):');
                incomingRelations.forEach(rel => {
                    console.log(`    ${rel.from_table}.${rel.from_column} → ${rel.to_column}`);
                });
            }
        });

        // Create a visual diagram
        console.log('\n\n📈 Visual Relationship Diagram:\n');
        console.log('='.repeat(80));

        // Build relationship map
        const relationshipMap = {};
        
        // Add all tables
        tables.forEach(table => {
            relationshipMap[table.tablename] = {
                outgoing: [],
                incoming: []
            };
        });

        // Add relationships
        allForeignKeys.forEach(fk => {
            relationshipMap[fk.from_table].outgoing.push({
                column: fk.from_column,
                toTable: fk.to_table,
                toColumn: fk.to_column
            });
            relationshipMap[fk.to_table].incoming.push({
                fromTable: fk.from_table,
                fromColumn: fk.from_column,
                column: fk.to_column
            });
        });

        // Display diagram
        Object.entries(relationshipMap).forEach(([tableName, relations]) => {
            console.log(`\n${tableName.toUpperCase()}`);
            console.log('  ├─ Primary Key: id');
            
            if (relations.outgoing.length > 0) {
                console.log('  ├─ Foreign Keys (references):');
                relations.outgoing.forEach(rel => {
                    console.log(`  │  └─ ${rel.column} → ${rel.toTable}.${rel.toColumn}`);
                });
            }
            
            if (relations.incoming.length > 0) {
                console.log('  └─ Referenced by:');
                relations.incoming.forEach((rel, index) => {
                    const isLast = index === relations.incoming.length - 1;
                    const prefix = isLast ? '     └─' : '     ├─';
                    console.log(`${prefix} ${rel.fromTable}.${rel.fromColumn}`);
                });
            } else {
                console.log('  └─ (No incoming references)');
            }
        });

        // Summary statistics
        console.log('\n\n📊 Relationship Summary:\n');
        console.log('='.repeat(80));
        console.log(`Total Tables: ${tables.length}`);
        console.log(`Total Foreign Keys: ${allForeignKeys.length}`);
        console.log(`\nTables with foreign keys: ${Object.keys(relationsByTable).length}`);
        console.log(`Tables without foreign keys: ${tables.length - Object.keys(relationsByTable).length}`);

        // Find root tables (tables that are not referenced by others)
        const referencedTables = new Set(allForeignKeys.map(fk => fk.to_table));
        const rootTables = tables.filter(t => !referencedTables.has(t.tablename));
        
        if (rootTables.length > 0) {
            console.log(`\nRoot Tables (not referenced by others): ${rootTables.map(t => t.tablename).join(', ')}`);
        }

        // Find leaf tables (tables that don't reference others)
        const leafTables = tables.filter(t => !relationsByTable[t.tablename] || relationsByTable[t.tablename].length === 0);
        if (leafTables.length > 0) {
            console.log(`Leaf Tables (don't reference others): ${leafTables.map(t => t.tablename).join(', ')}`);
        }

        await sequelize.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

showRelations();
