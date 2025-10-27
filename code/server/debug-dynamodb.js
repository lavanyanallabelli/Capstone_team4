const AWS = require('aws-sdk');
require('dotenv').config();

// Configure AWS from environment variables
AWS.config.update({
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const docClient = new AWS.DynamoDB.DocumentClient();

async function debugDynamoDB() {
    console.log('🔍 Debugging DynamoDB Configuration...\n');

    // 1. List all tables
    console.log('📋 Listing all DynamoDB tables:');
    try {
        const dynamodb = new AWS.DynamoDB();
        const tables = await dynamodb.listTables().promise();
        console.log('Available tables:', tables.TableNames);

        // Check if our table exists
        const hasPosEmployees = tables.TableNames.includes('pos-employees');
        console.log('✅ pos-employees table exists:', hasPosEmployees);

        if (hasPosEmployees) {
            // 2. Describe the table
            console.log('\n📊 Describing pos-employees table:');
            const tableInfo = await dynamodb.describeTable({ TableName: 'pos-employees' }).promise();
            console.log('Table status:', tableInfo.Table.TableStatus);
            console.log('Item count:', tableInfo.Table.ItemCount);
            console.log('Region:', tableInfo.Table.TableArn.split(':')[3]);
        }

    } catch (error) {
        console.error('❌ Error listing tables:', error.message);
    }

    // 3. Try to query the table directly
    console.log('\n🔍 Querying pos-employees table directly:');
    try {
        const params = {
            TableName: 'pos-employees',
            KeyConditionExpression: 'businessId = :businessId',
            ExpressionAttributeValues: {
                ':businessId': 'biz_fg27sj9ld_1760831311628'
            }
        };

        const result = await docClient.query(params).promise();
        console.log('Query result count:', result.Count);
        console.log('Items found:', result.Items.length);

        if (result.Items.length > 0) {
            console.log('Sample item:', JSON.stringify(result.Items[0], null, 2));
        }

    } catch (error) {
        console.error('❌ Error querying table:', error.message);
    }

    // 4. Try to scan the table
    console.log('\n🔍 Scanning pos-employees table:');
    try {
        const scanParams = {
            TableName: 'pos-employees',
            Limit: 10
        };

        const scanResult = await docClient.scan(scanParams).promise();
        console.log('Scan result count:', scanResult.Count);
        console.log('Items found:', scanResult.Items.length);

        if (scanResult.Items.length > 0) {
            console.log('Sample items:');
            scanResult.Items.forEach((item, index) => {
                console.log(`Item ${index + 1}:`, {
                    businessId: item.businessId,
                    employeeId: item.employeeId,
                    firstName: item.firstName,
                    lastName: item.lastName,
                    email: item.email
                });
            });
        }

    } catch (error) {
        console.error('❌ Error scanning table:', error.message);
    }
}

debugDynamoDB().catch(console.error);
