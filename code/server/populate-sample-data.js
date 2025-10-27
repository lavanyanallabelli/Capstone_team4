const AWS = require('aws-sdk');
require('dotenv').config();

// Configure AWS from environment variables
AWS.config.update({
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const docClient = new AWS.DynamoDB.DocumentClient();

const businessId = 'biz_fg27sj9ld_1760831311628';

// Sample menu items
const sampleMenuItems = [
    {
        businessId,
        itemId: 'item_001',
        name: 'Margherita Pizza',
        description: 'Classic pizza with tomato sauce, mozzarella, and fresh basil',
        price: 12.99,
        category: 'Pizza',
        prepTime: 15,
        isAvailable: true,
        tags: ['vegetarian', 'popular'],
        imageUrl: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=400',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        businessId,
        itemId: 'item_002',
        name: 'Pepperoni Pizza',
        description: 'Traditional pizza topped with pepperoni and mozzarella cheese',
        price: 14.99,
        category: 'Pizza',
        prepTime: 15,
        isAvailable: true,
        tags: ['meat', 'popular'],
        imageUrl: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        businessId,
        itemId: 'item_003',
        name: 'Caesar Salad',
        description: 'Fresh romaine lettuce with caesar dressing, croutons, and parmesan',
        price: 8.99,
        category: 'Salads',
        prepTime: 8,
        isAvailable: true,
        tags: ['vegetarian', 'healthy'],
        imageUrl: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        businessId,
        itemId: 'item_004',
        name: 'Chicken Wings',
        description: 'Crispy chicken wings with your choice of sauce',
        price: 10.99,
        category: 'Appetizers',
        prepTime: 12,
        isAvailable: true,
        tags: ['meat', 'spicy'],
        imageUrl: 'https://images.unsplash.com/photo-1567620832904-9fe5cf23db13?w=400',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        businessId,
        itemId: 'item_005',
        name: 'Chocolate Cake',
        description: 'Rich chocolate cake with chocolate frosting',
        price: 6.99,
        category: 'Desserts',
        prepTime: 5,
        isAvailable: true,
        tags: ['sweet', 'chocolate'],
        imageUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        businessId,
        itemId: 'item_006',
        name: 'Coca Cola',
        description: 'Classic Coca Cola soft drink',
        price: 2.99,
        category: 'Beverages',
        prepTime: 1,
        isAvailable: true,
        tags: ['drink', 'cold'],
        imageUrl: 'https://images.unsplash.com/photo-1581636625402-29b2a704ef13?w=400',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    }
];

// Sample analytics data
const sampleAnalyticsData = {
    businessId,
    date: new Date().toISOString().split('T')[0], // Today's date as YYYY-MM-DD
    analyticsId: 'analytics_overview',
    period: '7d',
    sales: {
        totalRevenue: 2847.50,
        totalOrders: 156,
        averageOrderValue: 18.25,
        revenueGrowth: 12.5,
        orderGrowth: 8.3
    },
    customers: {
        totalCustomers: 89,
        newCustomers: 12,
        returningCustomers: 77,
        customerGrowth: 15.2
    },
    salesData: [
        { date: '2025-10-20', revenue: 245.50, orders: 18 },
        { date: '2025-10-21', revenue: 312.75, orders: 22 },
        { date: '2025-10-22', revenue: 298.25, orders: 19 },
        { date: '2025-10-23', revenue: 356.80, orders: 24 },
        { date: '2025-10-24', revenue: 289.40, orders: 20 },
        { date: '2025-10-25', revenue: 445.60, orders: 28 },
        { date: '2025-10-26', revenue: 399.20, orders: 25 }
    ],
    topItems: [
        { itemId: 'item_001', name: 'Margherita Pizza', sales: 45, revenue: 584.55 },
        { itemId: 'item_002', name: 'Pepperoni Pizza', sales: 38, revenue: 569.62 },
        { itemId: 'item_003', name: 'Caesar Salad', sales: 28, revenue: 251.72 },
        { itemId: 'item_004', name: 'Chicken Wings', sales: 22, revenue: 241.78 },
        { itemId: 'item_005', name: 'Chocolate Cake', sales: 18, revenue: 125.82 }
    ],
    employeePerformance: [
        { employeeId: 'emp_001', name: 'John Doe', orders: 45, revenue: 1250.75, rating: 4.8 },
        { employeeId: 'emp_002', name: 'Jane Smith', orders: 38, revenue: 1089.50, rating: 4.6 },
        { employeeId: 'emp_003', name: 'Mike Johnson', orders: 32, revenue: 987.25, rating: 4.4 }
    ],
    revenueBreakdown: {
        dineIn: { revenue: 1898.30, percentage: 66.7 },
        online: { revenue: 949.20, percentage: 33.3 }
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
};

// Sample orders data
const sampleOrdersData = [
    {
        businessId,
        orderId: 'order_001',
        customerName: 'John Smith',
        customerPhone: '+1234567890',
        orderType: 'dine-in',
        tableNumber: 5,
        items: [
            { itemId: 'item_001', name: 'Margherita Pizza', quantity: 1, price: 12.99 },
            { itemId: 'item_003', name: 'Caesar Salad', quantity: 1, price: 8.99 }
        ],
        subtotal: 21.98,
        tax: 1.76,
        tip: 3.30,
        total: 27.04,
        status: 'completed',
        paymentMethod: 'card',
        employeeId: 'emp_001',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        completedAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString()
    },
    {
        businessId,
        orderId: 'order_002',
        customerName: 'Sarah Johnson',
        customerPhone: '+1987654321',
        orderType: 'online',
        deliveryAddress: '123 Main St, City, State 12345',
        items: [
            { itemId: 'item_002', name: 'Pepperoni Pizza', quantity: 2, price: 14.99 },
            { itemId: 'item_004', name: 'Chicken Wings', quantity: 1, price: 10.99 }
        ],
        subtotal: 40.97,
        tax: 3.28,
        deliveryFee: 3.99,
        total: 48.24,
        status: 'completed',
        paymentMethod: 'online',
        employeeId: 'emp_002',
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        completedAt: new Date(Date.now() - 3.5 * 60 * 60 * 1000).toISOString()
    }
];

async function populateSampleData() {
    console.log('🚀 Starting to populate sample data...\n');

    try {
        // 1. Populate menu items
        console.log('📋 Adding menu items...');
        for (const item of sampleMenuItems) {
            const params = {
                TableName: 'pos-menu-items',
                Item: item
            };
            await docClient.put(params).promise();
            console.log(`✅ Added: ${item.name}`);
        }

        // 2. Populate analytics data
        console.log('\n📊 Adding analytics data...');
        const analyticsParams = {
            TableName: 'pos-analytics',
            Item: sampleAnalyticsData
        };
        await docClient.put(analyticsParams).promise();
        console.log('✅ Added analytics overview data');

        // 3. Populate orders data
        console.log('\n🛒 Adding sample orders...');
        for (const order of sampleOrdersData) {
            const params = {
                TableName: 'pos-orders',
                Item: order
            };
            await docClient.put(params).promise();
            console.log(`✅ Added order: ${order.orderId}`);
        }

        console.log('\n🎉 Sample data population completed successfully!');
        console.log('\n📊 Summary:');
        console.log(`   - Menu items: ${sampleMenuItems.length}`);
        console.log(`   - Analytics data: 1 overview`);
        console.log(`   - Sample orders: ${sampleOrdersData.length}`);

    } catch (error) {
        console.error('❌ Error populating sample data:', error);
    }
}

populateSampleData();
