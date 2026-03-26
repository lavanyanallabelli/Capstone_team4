const { sequelize } = require('../config/database');
const { Employee } = require('../models');

/**
 * Script to assign employeeIds to existing employees that don't have one
 * Run this after adding the employeeId field to the Employee model
 */
async function assignEmployeeIds() {
    try {
        await sequelize.authenticate();
        console.log('✅ Connected to database');

        // Find all employees without employeeId
        const employeesWithoutId = await Employee.findAll({
            where: {
                employeeId: null
            },
            order: [['createdAt', 'ASC']]
        });

        console.log(`\n📋 Found ${employeesWithoutId.length} employees without employeeId`);

        if (employeesWithoutId.length === 0) {
            console.log('✅ All employees already have employeeIds assigned!');
            process.exit(0);
        }

        // Group by ownerId
        const employeesByOwner = {};
        employeesWithoutId.forEach(emp => {
            if (!employeesByOwner[emp.ownerId]) {
                employeesByOwner[emp.ownerId] = [];
            }
            employeesByOwner[emp.ownerId].push(emp);
        });

        console.log(`\n📊 Employees grouped by ${Object.keys(employeesByOwner).length} owners\n`);

        // Assign employeeIds
        let totalAssigned = 0;
        for (const [ownerId, employees] of Object.entries(employeesByOwner)) {
            console.log(`\n👤 Owner: ${ownerId}`);

            // Find the highest employeeId for this owner
            const { Op } = require('sequelize');
            const lastEmployee = await Employee.findOne({
                where: {
                    ownerId: ownerId,
                    employeeId: {
                        [Op.like]: '100200%'
                    }
                },
                order: [['employeeId', 'DESC']]
            });

            let nextNumber = 1;
            if (lastEmployee && lastEmployee.employeeId) {
                const lastNumber = parseInt(lastEmployee.employeeId.replace('100200', ''), 10);
                if (!isNaN(lastNumber)) {
                    nextNumber = lastNumber + 1;
                }
            }

            console.log(`   Starting from employeeId: 100200${nextNumber}`);

            // Assign IDs to each employee
            for (const employee of employees) {
                const employeeId = `100200${nextNumber}`;
                employee.employeeId = employeeId;
                await employee.save();

                console.log(`   ✅ Assigned ${employeeId} to ${employee.firstName} ${employee.lastName} (${employee.email})`);
                totalAssigned++;
                nextNumber++;
            }
        }

        console.log(`\n✅ Successfully assigned ${totalAssigned} employeeIds!`);
        process.exit(0);
    } catch (error) {
        console.error('❌ Error assigning employeeIds:', error);
        process.exit(1);
    }
}

// Run the script
assignEmployeeIds();

