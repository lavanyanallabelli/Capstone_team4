const AWS = require('aws-sdk');
require('dotenv').config();

// Configure AWS from environment variables
AWS.config.update({
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const docClient = new AWS.DynamoDB.DocumentClient();

async function checkMenuData() {
    console.log('🔍 Checking Menu Data in DynamoDB...\n');

    const businessId = 'biz_fg27sj9ld_1760831311628';

    try {
        // Check menu items
        console.log('📋 Checking Menu Items:');
        const menuParams = {
            TableName: 'pos-menu-items',
            KeyConditionExpression: 'businessId = :businessId',
            ExpressionAttributeValues: {
                ':businessId': businessId
            }
        };

        const menuResult = await docClient.query(menuParams).promise();
        console.log(`✅ Found ${menuResult.Count} menu items`);

        if (menuResult.Items.length > 0) {
            console.log('\n📝 Menu Items:');
            menuResult.Items.forEach((item, index) => {
                console.log(`${index + 1}. ${item.name} - $${item.price} (${item.category})`);
                console.log(`   ID: ${item.itemId}`);
                console.log(`   Available: ${item.isAvailable}`);
                console.log(`   Created: ${item.createdAt}`);
                console.log('');
            });
        } else {
            console.log('❌ No menu items found');
        }

        // Check categories
        console.log('🏷️  Checking Categories:');
        const categoriesParams = {
            TableName: 'pos-menu-items',
            KeyConditionExpression: 'businessId = :businessId',
            ProjectionExpression: 'category',
            ExpressionAttributeValues: {
                ':businessId': businessId
            }
        };

        const categoriesResult = await docClient.query(categoriesParams).promise();
        const uniqueCategories = [...new Set(categoriesResult.Items.map(item => item.category))];
        console.log(`✅ Found ${uniqueCategories.length} unique categories:`, uniqueCategories);

        // Check if data is being saved in real-time
        console.log('\n🔄 Testing Real-time Save:');
        const testItem = {
            businessId,
            itemId: `test_${Date.now()}`,
            name: 'Test Item',
            category: 'Test',
            description: 'This is a test item',
            price: 9.99,
            isAvailable: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const testParams = {
            TableName: 'pos-menu-items',
            Item: testItem
        };

        await docClient.put(testParams).promise();
        console.log('✅ Test item saved successfully');

        // Verify the test item was saved
        const verifyParams = {
            TableName: 'pos-menu-items',
            Key: {
                businessId,
                itemId: testItem.itemId
            }
        };

        const verifyResult = await docClient.get(verifyParams).promise();
        if (verifyResult.Item) {
            console.log('✅ Test item verified in DynamoDB');
            console.log('   Name:', verifyResult.Item.name);
            console.log('   Price:', verifyResult.Item.price);
        } else {
            console.log('❌ Test item not found in DynamoDB');
        }

        // Clean up test item
        await docClient.delete(verifyParams).promise();
        console.log('🧹 Test item cleaned up');

    } catch (error) {
        console.error('❌ Error checking menu data:', error);
    }
}

checkMenuData();
