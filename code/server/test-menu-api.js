const axios = require('axios');

async function testMenuAPI() {
    try {
        console.log('🧪 Testing Menu API...\n');

        // Test 1: Get all menu items
        console.log('1. Testing GET /api/menu');
        const response = await axios.get('http://localhost:5000/api/menu');
        console.log('✅ Status:', response.status);
        console.log('📊 Response:', JSON.stringify(response.data, null, 2));

        // Test 2: Get menu categories
        console.log('\n2. Testing GET /api/menu/categories/list');
        const categoriesResponse = await axios.get('http://localhost:5000/api/menu/categories/list');
        console.log('✅ Status:', categoriesResponse.status);
        console.log('📊 Response:', JSON.stringify(categoriesResponse.data, null, 2));

        // Test 3: Get analytics overview
        console.log('\n3. Testing GET /api/analytics/overview');
        const analyticsResponse = await axios.get('http://localhost:5000/api/analytics/overview');
        console.log('✅ Status:', analyticsResponse.status);
        console.log('📊 Response:', JSON.stringify(analyticsResponse.data, null, 2));

    } catch (error) {
        console.error('❌ Error testing API:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }
}

testMenuAPI();
