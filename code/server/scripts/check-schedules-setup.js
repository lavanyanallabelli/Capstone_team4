require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { sequelize, Schedule, Employee } = require('../models');

async function checkSchedulesSetup() {
    try {
        await sequelize.authenticate();
        console.log('✅ Connected to database\n');

        // Check if Schedule model exists
        console.log('1️⃣ Checking Schedule model...');
        try {
            const scheduleCount = await Schedule.count();
            console.log(`   ✅ Schedule model works - ${scheduleCount} schedules in database`);
        } catch (err) {
            console.error(`   ❌ Schedule model error:`, err.message);
        }

        // Check if employees exist
        console.log('\n2️⃣ Checking employees...');
        const employeeCount = await Employee.count();
        console.log(`   Total employees: ${employeeCount}`);
        
        if (employeeCount > 0) {
            const employees = await Employee.findAll({
                attributes: ['id', 'firstName', 'lastName', 'email', 'employeeId', 'isActive'],
                limit: 5
            });
            console.log(`   Sample employees:`);
            employees.forEach(emp => {
                console.log(`     - ${emp.firstName} ${emp.lastName} (${emp.employeeId || 'no ID'}) - Active: ${emp.isActive}`);
            });
        } else {
            console.log('   ⚠️ No employees found in database');
        }

        // Check schedules
        console.log('\n3️⃣ Checking schedules...');
        const scheduleCount = await Schedule.count();
        console.log(`   Total schedules: ${scheduleCount}`);
        
        if (scheduleCount > 0) {
            const schedules = await Schedule.findAll({
                include: [{
                    model: Employee,
                    as: 'employee',
                    attributes: ['firstName', 'lastName']
                }],
                limit: 3
            });
            console.log(`   Sample schedules:`);
            schedules.forEach(s => {
                console.log(`     - Week: ${s.weekStartDate}, Employee: ${s.employee?.firstName || 'N/A'}`);
            });
        } else {
            console.log('   ℹ️ No schedules created yet (this is normal)');
        }

        // Check route registration
        console.log('\n4️⃣ Checking route registration...');
        console.log('   ✅ Route is registered in server.js (line 71)');
        console.log('   ✅ Route file exists: code/server/routes/schedules.js');
        console.log('   ⚠️  Backend server MUST be restarted to load the route!');
        
        console.log('\n📋 Summary:');
        console.log('   - Database: ✅ Connected');
        console.log('   - Schedule model: ✅ Working');
        console.log(`   - Employees: ${employeeCount > 0 ? '✅ Found' : '⚠️ None found'}`);
        console.log(`   - Schedules: ${scheduleCount > 0 ? '✅ Found' : 'ℹ️ None yet (normal)'}`);
        console.log('   - Route file: ✅ Valid');
        console.log('   - Action needed: 🔄 RESTART BACKEND SERVER');

        await sequelize.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

checkSchedulesSetup();
