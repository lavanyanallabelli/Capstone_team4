const AWS = require('aws-sdk');

// Configure AWS
AWS.config.update({
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const dynamodb = new AWS.DynamoDB();
const docClient = new AWS.DynamoDB.DocumentClient();

// Table schemas
const tableSchemas = {
    'pos-users': {
        TableName: 'pos-users',
        KeySchema: [
            { AttributeName: 'userId', KeyType: 'HASH' }
        ],
        AttributeDefinitions: [
            { AttributeName: 'userId', AttributeType: 'S' },
            { AttributeName: 'email', AttributeType: 'S' }
        ],
        GlobalSecondaryIndexes: [
            {
                IndexName: 'email-index',
                KeySchema: [
                    { AttributeName: 'email', KeyType: 'HASH' }
                ],
                Projection: { ProjectionType: 'ALL' },
                ProvisionedThroughput: {
                    ReadCapacityUnits: 5,
                    WriteCapacityUnits: 5
                }
            }
        ],
        ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5
        }
    },
    'pos-menu-items': {
        TableName: 'pos-menu-items',
        KeySchema: [
            { AttributeName: 'businessId', KeyType: 'HASH' },
            { AttributeName: 'itemId', KeyType: 'RANGE' }
        ],
        AttributeDefinitions: [
            { AttributeName: 'businessId', AttributeType: 'S' },
            { AttributeName: 'itemId', AttributeType: 'S' },
            { AttributeName: 'category', AttributeType: 'S' }
        ],
        GlobalSecondaryIndexes: [
            {
                IndexName: 'category-index',
                KeySchema: [
                    { AttributeName: 'businessId', KeyType: 'HASH' },
                    { AttributeName: 'category', KeyType: 'RANGE' }
                ],
                Projection: { ProjectionType: 'ALL' },
                ProvisionedThroughput: {
                    ReadCapacityUnits: 5,
                    WriteCapacityUnits: 5
                }
            }
        ],
        ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5
        }
    },
    'pos-employees': {
        TableName: 'pos-employees',
        KeySchema: [
            { AttributeName: 'businessId', KeyType: 'HASH' },
            { AttributeName: 'employeeId', KeyType: 'RANGE' }
        ],
        AttributeDefinitions: [
            { AttributeName: 'businessId', AttributeType: 'S' },
            { AttributeName: 'employeeId', AttributeType: 'S' },
            { AttributeName: 'email', AttributeType: 'S' }
        ],
        GlobalSecondaryIndexes: [
            {
                IndexName: 'email-index',
                KeySchema: [
                    { AttributeName: 'email', KeyType: 'HASH' }
                ],
                Projection: { ProjectionType: 'ALL' },
                ProvisionedThroughput: {
                    ReadCapacityUnits: 5,
                    WriteCapacityUnits: 5
                }
            }
        ],
        ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5
        }
    },
    'pos-orders': {
        TableName: 'pos-orders',
        KeySchema: [
            { AttributeName: 'businessId', KeyType: 'HASH' },
            { AttributeName: 'orderId', KeyType: 'RANGE' }
        ],
        AttributeDefinitions: [
            { AttributeName: 'businessId', AttributeType: 'S' },
            { AttributeName: 'orderId', AttributeType: 'S' },
            { AttributeName: 'createdAt', AttributeType: 'S' },
            { AttributeName: 'status', AttributeType: 'S' }
        ],
        GlobalSecondaryIndexes: [
            {
                IndexName: 'status-index',
                KeySchema: [
                    { AttributeName: 'businessId', KeyType: 'HASH' },
                    { AttributeName: 'status', KeyType: 'RANGE' }
                ],
                Projection: { ProjectionType: 'ALL' },
                ProvisionedThroughput: {
                    ReadCapacityUnits: 5,
                    WriteCapacityUnits: 5
                }
            },
            {
                IndexName: 'date-index',
                KeySchema: [
                    { AttributeName: 'businessId', KeyType: 'HASH' },
                    { AttributeName: 'createdAt', KeyType: 'RANGE' }
                ],
                Projection: { ProjectionType: 'ALL' },
                ProvisionedThroughput: {
                    ReadCapacityUnits: 5,
                    WriteCapacityUnits: 5
                }
            }
        ],
        ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5
        }
    },
    'pos-analytics': {
        TableName: 'pos-analytics',
        KeySchema: [
            { AttributeName: 'businessId', KeyType: 'HASH' },
            { AttributeName: 'date', KeyType: 'RANGE' }
        ],
        AttributeDefinitions: [
            { AttributeName: 'businessId', AttributeType: 'S' },
            { AttributeName: 'date', AttributeType: 'S' }
        ],
        ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5
        }
    },
    'pos-settings': {
        TableName: 'pos-settings',
        KeySchema: [
            { AttributeName: 'businessId', KeyType: 'HASH' },
            { AttributeName: 'settingType', KeyType: 'RANGE' }
        ],
        AttributeDefinitions: [
            { AttributeName: 'businessId', AttributeType: 'S' },
            { AttributeName: 'settingType', AttributeType: 'S' }
        ],
        ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5
        }
    }
};

// Create tables if they don't exist
const createTables = async () => {
    try {
        for (const [tableName, schema] of Object.entries(tableSchemas)) {
            try {
                await dynamodb.describeTable({ TableName: tableName }).promise();
                // Table exists - no log needed
            } catch (error) {
                if (error.code === 'ResourceNotFoundException') {
                    console.log(`📝 Creating table ${tableName}...`);
                    await dynamodb.createTable(schema).promise();
                    console.log(`✅ Table ${tableName} created successfully`);
                } else {
                    // Error checking table - no log needed
                }
            }
        }
    } catch (error) {
        console.error('❌ Error creating tables:', error);
    }
};

// Initialize tables
createTables();

module.exports = {
    dynamodb,
    docClient,
    tableSchemas
};
