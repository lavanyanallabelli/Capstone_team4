require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { sequelize, Employee, Owner } = require('../models');

async function checkPrefixes() {
    try {
        await sequelize.authenticate();

        const employees = await Employee.findAll({
            attributes: ['employeeId', 'ownerId'],
            order: [['employeeId', 'ASC']]
        });

        // Get owner info separately
        const ownerIds = [...new Set(employees.map(e => e.ownerId))];
        const owners = await Owner.findAll({
            where: { id: ownerIds },
            attributes: ['id', 'businessName']
        });
        const ownerMapById = {};
        owners.forEach(owner => {
            ownerMapById[owner.id] = owner;
        });

        console.log('\n📊 Employee IDs and their Owner Prefixes:\n');
        console.log('='.repeat(80));

        employees.forEach(emp => {
            const owner = ownerMapById[emp.ownerId];
            if (emp.employeeId) {
                const prefix = emp.employeeId.substring(0, 6);
                const number = emp.employeeId.substring(6);
                console.log(`Employee ID: ${emp.employeeId}`);
                console.log(`  Prefix: ${prefix} | Number: ${number}`);
                console.log(`  Owner: ${owner?.businessName || 'N/A'} (${emp.ownerId.substring(0, 8)}...)`);
                console.log('');
            } else {
                console.log(`Employee ID: NULL`);
                console.log(`  Owner: ${owner?.businessName || 'N/A'} (${emp.ownerId.substring(0, 8)}...)`);
                console.log('');
            }
        });

        // Group by owner to see prefixes
        console.log('\n📋 Prefixes by Owner:\n');
        console.log('='.repeat(80));

        const ownerMap = {};
        employees.forEach(emp => {
            if (!ownerMap[emp.ownerId]) {
                const owner = ownerMapById[emp.ownerId];
                ownerMap[emp.ownerId] = {
                    businessName: owner?.businessName || 'N/A',
                    employees: []
                };
            }
            if (emp.employeeId) {
                ownerMap[emp.ownerId].employees.push({
                    id: emp.employeeId,
                    prefix: emp.employeeId.substring(0, 6),
                    number: emp.employeeId.substring(6)
                });
            }
        });

        Object.entries(ownerMap).forEach(([ownerId, data]) => {
            console.log(`\nOwner: ${data.businessName}`);
            console.log(`  Owner ID: ${ownerId.substring(0, 8)}...`);
            if (data.employees.length > 0) {
                const uniquePrefixes = [...new Set(data.employees.map(e => e.prefix))];
                console.log(`  Prefix(es) used: ${uniquePrefixes.join(', ')}`);
                console.log(`  Employees: ${data.employees.length}`);
                data.employees.forEach(emp => {
                    console.log(`    - ${emp.id} (prefix: ${emp.prefix}, number: ${emp.number})`);
                });
            } else {
                console.log(`  No employees with IDs yet`);
            }
        });

        await sequelize.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

checkPrefixes();
