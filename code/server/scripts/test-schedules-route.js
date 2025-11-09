require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const http = require('http');

const port = process.env.PORT || 5000;
const testUrl = `http://localhost:${port}/api/schedules`;

console.log(`\n🧪 Testing schedules route...`);
console.log(`Testing URL: ${testUrl}`);
console.log(`Expected PORT: ${port}\n`);

// Test if route exists (without auth - should get 401, not 404)
const req = http.get(testUrl, (res) => {
    console.log(`Status Code: ${res.statusCode}`);
    console.log(`Status Message: ${res.statusMessage}`);

    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            console.log(`Response:`, json);

            if (res.statusCode === 404) {
                console.log('\n❌ Route not found (404)');
                console.log('   The /api/schedules route is not registered.');
                console.log('   Solution: Restart the backend server!');
            } else if (res.statusCode === 401 || res.statusCode === 403) {
                console.log('\n✅ Route exists!');
                console.log(`   Got ${res.statusCode} (expected - route requires authentication)`);
                console.log('   The route is working, just needs authentication.');
            } else {
                console.log(`\n⚠️ Unexpected status: ${res.statusCode}`);
            }
        } catch (e) {
            console.log('Response:', data);
        }
        process.exit(0);
    });
});

req.on('error', (error) => {
    console.error(`\n❌ Error connecting to server:`, error.message);
    console.log(`\nPossible issues:`);
    console.log(`1. Backend server is not running`);
    console.log(`2. Server is running on a different port (check .env PORT)`);
    console.log(`3. Server is not running on localhost`);
    console.log(`\nSolution: Start the backend server with:`);
    console.log(`   cd code/server && npm start`);
    process.exit(1);
});

req.setTimeout(5000, () => {
    console.error('\n❌ Request timeout - server not responding');
    req.destroy();
    process.exit(1);
});

