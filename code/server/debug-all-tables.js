const AWS = require('aws-sdk');
require('dotenv').config();

// Configure AWS from environment variables
AWS.config.update({
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const docClient = new AWS.DynamoDB.DocumentClient();
const dynamodb = new AWS.DynamoDB();

async function debugAllTables() {
    console.log('🔍 Comprehensive DynamoDB Debug...\n');

    // 1. Try to scan ALL possible table names
    const possibleTableNames = [
        'pos-employees',
        'pos_employees',
        'employees',
        'pos-employee',
        'posemployee',
        'pos_employee'
    ];

    console.log('🔍 Checking all possible table names:');

    for (const tableName of possibleTableNames) {
        try {
            console.log(`\n📋 Checking table: ${tableName}`);

            // Try to scan the table
            const scanParams = {
                TableName: tableName,
                Limit: 5
            };

            const scanResult = await docClient.scan(scanParams).promise();
            console.log(`✅ Table ${tableName} exists!`);
            console.log(`   Item count: ${scanResult.Count}`);
            console.log(`   Scanned count: ${scanResult.ScannedCount}`);

            if (scanResult.Items.length > 0) {
                console.log(`   Sample items:`);
                scanResult.Items.forEach((item, index) => {
                    console.log(`     Item ${index + 1}:`, {
                        businessId: item.businessId,
                        employeeId: item.employeeId,
                        firstName: item.firstName,
                        lastName: item.lastName,
                        email: item.email
                    });
                });
            }

        } catch (error) {
            if (error.code === 'ResourceNotFoundException') {
                console.log(`❌ Table ${tableName} does not exist`);
            } else {
                console.log(`⚠️  Error accessing ${tableName}:`, error.message);
            }
        }
    }

    // 2. Try to describe the specific table we're looking for
    console.log('\n🔍 Describing pos-employees table specifically:');
    try {
        const describeParams = {
            TableName: 'pos-employees'
        };

        const tableInfo = await dynamodb.describeTable(describeParams).promise();
        console.log('✅ pos-employees table found!');
        console.log('   Table status:', tableInfo.Table.TableStatus);
        console.log('   Item count:', tableInfo.Table.ItemCount);
        console.log('   Table size (bytes):', tableInfo.Table.TableSizeBytes);
        console.log('   Creation date:', tableInfo.Table.CreationDateTime);
        console.log('   ARN:', tableInfo.Table.TableArn);

        // Check if it's on-demand or provisioned
        if (tableInfo.Table.BillingModeSummary) {
            console.log('   Billing mode:', tableInfo.Table.BillingModeSummary.BillingMode);
        } else {
            console.log('   Provisioned throughput:', tableInfo.Table.ProvisionedThroughput);
        }

    } catch (error) {
        console.log('❌ Error describing pos-employees:', error.message);
    }

    // 3. Try to query with different business IDs
    console.log('\n🔍 Querying with different business IDs:');
    const businessIds = [
        'biz_fg27sj9ld_1760831311628',
        'biz_fg27sj9ld_1760831311629',
        'default',
        'test'
    ];

    for (const businessId of businessIds) {
        try {
            const queryParams = {
                TableName: 'pos-employees',
                KeyConditionExpression: 'businessId = :businessId',
                ExpressionAttributeValues: {
                    ':businessId': businessId
                }
            };

            const queryResult = await docClient.query(queryParams).promise();
            console.log(`   Business ID ${businessId}: ${queryResult.Count} items`);

        } catch (error) {
            console.log(`   Business ID ${businessId}: Error - ${error.message}`);
        }
    }
}

debugAllTables().catch(console.error);
