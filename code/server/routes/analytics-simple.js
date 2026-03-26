const express = require('express');
const { Order, Payment, Employee } = require('../models');
const { Op } = require('sequelize');

// Helper to get ownerId from request
const getOwnerId = (req) => {
    // ONLY use ownerId from cognitoSync middleware - it's the PostgreSQL UUID
    if (req.user?.ownerId) {
        return req.user.ownerId;
    }
    console.warn('⚠️ ownerId not set - cognitoSync middleware may have failed');
    return null;
};

const router = express.Router();

// Get dashboard overview - simplified version
router.get('/overview', async (req, res) => {
    try {
        const ownerId = getOwnerId(req);
        if (!ownerId) {
            return res.status(401).json({
                success: false,
                error: 'Unauthorized',
                message: 'Owner ID is required'
            });
        }

        const { period = '7d', startDate: customStartDate, endDate: customEndDate } = req.query;

        // Calculate date range based on period
        const now = new Date();
        let startDate;
        let endDate;
        let previousStartDate;
        let days;

        switch (period) {
            case 'today':
                // Today only - from start of today to end of today
                startDate = new Date(now);
                startDate.setHours(0, 0, 0, 0);
                endDate = new Date(now);
                endDate.setHours(23, 59, 59, 999);
                days = 1;
                // Previous period is yesterday
                previousStartDate = new Date(startDate);
                previousStartDate.setDate(previousStartDate.getDate() - 1);
                break;
            case 'custom':
                // Custom date range
                if (customStartDate && customEndDate) {
                    startDate = new Date(customStartDate);
                    startDate.setHours(0, 0, 0, 0);
                    endDate = new Date(customEndDate);
                    endDate.setHours(23, 59, 59, 999);

                    // Calculate days between dates
                    const diffTime = Math.abs(endDate - startDate);
                    days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

                    // Previous period is same length before start date
                    const periodLength = endDate - startDate;
                    previousStartDate = new Date(startDate);
                    previousStartDate.setTime(previousStartDate.getTime() - periodLength);
                } else {
                    // Fallback to 7 days if custom dates not provided
                    days = 7;
                    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    endDate = new Date(now);
                    previousStartDate = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
                }
                break;
            case '7d':
                days = 7;
                startDate = new Date(now);
                startDate.setDate(startDate.getDate() - 7);
                startDate.setHours(0, 0, 0, 0);
                endDate = new Date(now);
                endDate.setHours(23, 59, 59, 999);
                previousStartDate = new Date(startDate);
                previousStartDate.setDate(previousStartDate.getDate() - 7);
                break;
            case '30d':
                days = 30;
                startDate = new Date(now);
                startDate.setDate(startDate.getDate() - 30);
                startDate.setHours(0, 0, 0, 0);
                endDate = new Date(now);
                endDate.setHours(23, 59, 59, 999);
                previousStartDate = new Date(startDate);
                previousStartDate.setDate(previousStartDate.getDate() - 30);
                break;
            case '90d':
                days = 90;
                startDate = new Date(now);
                startDate.setDate(startDate.getDate() - 90);
                startDate.setHours(0, 0, 0, 0);
                endDate = new Date(now);
                endDate.setHours(23, 59, 59, 999);
                previousStartDate = new Date(startDate);
                previousStartDate.setDate(previousStartDate.getDate() - 90);
                break;
            case '1y':
                days = 365;
                startDate = new Date(now);
                startDate.setDate(startDate.getDate() - 365);
                startDate.setHours(0, 0, 0, 0);
                endDate = new Date(now);
                endDate.setHours(23, 59, 59, 999);
                previousStartDate = new Date(startDate);
                previousStartDate.setDate(previousStartDate.getDate() - 365);
                break;
            default:
                days = 7;
                startDate = new Date(now);
                startDate.setDate(startDate.getDate() - 7);
                startDate.setHours(0, 0, 0, 0);
                endDate = new Date(now);
                endDate.setHours(23, 59, 59, 999);
                previousStartDate = new Date(startDate);
                previousStartDate.setDate(previousStartDate.getDate() - 7);
        }

        // Fetch current period orders
        // Include all statuses for now to see all orders, we'll filter completed/ready for revenue
        let orderDateFilter;
        if (period === 'custom' && customStartDate && customEndDate) {
            // Custom date range - use both start and end
            orderDateFilter = {
                [Op.gte]: startDate,
                [Op.lte]: endDate
            };
        } else if (period === 'today') {
            // Today - use both start and end to ensure we only get today's orders
            orderDateFilter = {
                [Op.gte]: startDate,
                [Op.lte]: endDate
            };
        } else {
            // Other periods - use start date only (endDate is effectively "now")
            orderDateFilter = {
                [Op.gte]: startDate
            };
        }

        const currentOrders = await Order.findAll({
            where: {
                ownerId,
                orderDate: orderDateFilter
            },
            order: [['orderDate', 'ASC']]
        });

        console.log(`📊 Found ${currentOrders.length} orders for period ${period} (ownerId: ${ownerId})`);
        console.log(`📅 Date range: ${startDate.toISOString()} to ${endDate ? endDate.toISOString() : 'now'}`);

        // Filter to only completed/ready orders for revenue calculation
        const completedOrders = currentOrders.filter(order =>
            order.status === 'completed' || order.status === 'ready'
        );

        console.log(`✅ Found ${completedOrders.length} completed/ready orders`);

        // Debug: Log order dates for today period
        if (period === 'today') {
            console.log(`🔍 Today's orders breakdown:`);
            currentOrders.forEach(order => {
                console.log(`  - Order ${order.orderNumber}: date=${order.orderDate}, status=${order.status}, amount=${order.finalTotal || order.totalAmount}`);
            });
        }

        // Fetch previous period orders for growth calculation
        const previousOrdersAll = await Order.findAll({
            where: {
                ownerId,
                orderDate: {
                    [Op.gte]: previousStartDate,
                    [Op.lt]: startDate
                }
            }
        });

        const previousOrders = previousOrdersAll.filter(order =>
            order.status === 'completed' || order.status === 'ready'
        );

        // Calculate sales metrics using completed orders
        const totalRevenue = completedOrders.reduce((sum, order) => {
            return sum + parseFloat(order.finalTotal || order.totalAmount || 0);
        }, 0);
        const totalOrders = completedOrders.length;
        const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

        // Calculate total tips
        const totalTips = completedOrders.reduce((sum, order) => {
            return sum + parseFloat(order.tip || 0);
        }, 0);
        const averageTip = totalOrders > 0 ? totalTips / totalOrders : 0;
        const tipPercentage = totalRevenue > 0 ? (totalTips / totalRevenue * 100) : 0;

        console.log(`💰 Revenue: $${totalRevenue}, Orders: ${totalOrders}, Avg: $${averageOrderValue}, Tips: $${totalTips}`);

        // Previous period metrics
        const previousRevenue = previousOrders.reduce((sum, order) => {
            return sum + parseFloat(order.finalTotal || order.totalAmount || 0);
        }, 0);
        const previousOrderCount = previousOrders.length;
        const previousTips = previousOrders.reduce((sum, order) => {
            return sum + parseFloat(order.tip || 0);
        }, 0);

        // Calculate growth percentages
        const revenueGrowth = previousRevenue > 0
            ? ((totalRevenue - previousRevenue) / previousRevenue * 100).toFixed(1)
            : (totalRevenue > 0 ? 100 : 0);
        const orderGrowth = previousOrderCount > 0
            ? ((totalOrders - previousOrderCount) / previousOrderCount * 100).toFixed(1)
            : (totalOrders > 0 ? 100 : 0);
        const tipGrowth = previousTips > 0
            ? ((totalTips - previousTips) / previousTips * 100).toFixed(1)
            : (totalTips > 0 ? 100 : 0);

        // Calculate customers
        // Count unique customers by name (for pickup/to-go/delivery orders)
        // and count dine-in orders as separate customer visits (each table = a customer/party)
        const uniqueCustomers = new Set();
        const dineInTables = new Set();

        completedOrders.forEach(order => {
            if (order.customerName) {
                // For orders with customer name, use the name as unique identifier
                uniqueCustomers.add(order.customerName.toLowerCase().trim());
            } else if (order.orderType === 'dine-in' && order.tableNumber) {
                // For dine-in orders, count each table as a unique customer visit
                // Format: "Table-{tableNumber}-{date}" to ensure uniqueness per day
                const dateStr = new Date(order.orderDate).toISOString().split('T')[0];
                dineInTables.add(`Table-${order.tableNumber}-${dateStr}`);
            } else {
                // For orders without customer name or table number, count as anonymous customer
                // Use order ID as unique identifier
                uniqueCustomers.add(`anonymous-${order.id}`);
            }
        });

        // Total customers = unique customer names + unique dine-in table visits
        const totalCustomers = uniqueCustomers.size + dineInTables.size;

        console.log(`👥 Customers: ${uniqueCustomers.size} named customers, ${dineInTables.size} dine-in visits, Total: ${totalCustomers}`);

        // Generate daily sales data
        const salesDataMap = new Map();
        const currentDate = new Date(startDate);
        // Reset time to start of day to avoid timezone issues
        currentDate.setHours(0, 0, 0, 0);

        // Determine the end date for the loop
        let endDateForLoop;
        if (period === 'custom' && customEndDate) {
            endDateForLoop = new Date(customEndDate);
        } else if (period === 'today') {
            endDateForLoop = new Date(endDate);
        } else {
            endDateForLoop = new Date(now);
        }
        endDateForLoop.setHours(23, 59, 59, 999);

        // Generate dates for the period (inclusive of both start and end)
        // Use a normalized date to ensure consistent day calculation
        const dateArray = [];
        const tempDate = new Date(currentDate);
        // Ensure tempDate is at midnight to avoid timezone shifts
        tempDate.setHours(0, 0, 0, 0);
        
        const endDateNormalized = new Date(endDateForLoop);
        endDateNormalized.setHours(23, 59, 59, 999);
        
        while (tempDate <= endDateNormalized) {
            // Use local date components to avoid timezone issues
            const year = tempDate.getFullYear();
            const month = String(tempDate.getMonth() + 1).padStart(2, '0');
            const day = String(tempDate.getDate()).padStart(2, '0');
            const dateStr = `${year}-${month}-${day}`;
            
            // Calculate day name using the same date object (ensure it's at local midnight)
            const dayName = tempDate.toLocaleDateString('en-US', { weekday: 'short' });
            
            // Only add if not already in map (prevent duplicates)
            if (!salesDataMap.has(dateStr)) {
                salesDataMap.set(dateStr, {
                    date: dateStr,
                    revenue: 0,
                    tips: 0,
                    orders: 0,
                    day: dayName
                });
                dateArray.push(dateStr);
                console.log(`📅 Generated date: ${dateStr} (${dayName})`);
            } else {
                console.log(`⚠️ Duplicate date detected during generation: ${dateStr} (${dayName})`);
            }
            // Move to next day at midnight
            tempDate.setDate(tempDate.getDate() + 1);
            tempDate.setHours(0, 0, 0, 0);
        }

        console.log(`📅 Generated ${salesDataMap.size} days for sales data:`, Array.from(salesDataMap.keys()));

        completedOrders.forEach(order => {
            const orderDate = new Date(order.orderDate);
            // Normalize to local midnight to match the date string format used in salesDataMap
            orderDate.setHours(0, 0, 0, 0);
            
            // Use local date components to match the date string format used in salesDataMap
            const year = orderDate.getFullYear();
            const month = String(orderDate.getMonth() + 1).padStart(2, '0');
            const day = String(orderDate.getDate()).padStart(2, '0');
            const dateStr = `${year}-${month}-${day}`;

            if (salesDataMap.has(dateStr)) {
                const dayData = salesDataMap.get(dateStr);
                dayData.revenue += parseFloat(order.finalTotal || order.totalAmount || 0);
                dayData.tips = (dayData.tips || 0) + parseFloat(order.tip || 0);
                dayData.orders += 1;
                console.log(`✅ Order ${order.orderNumber} matched to ${dateStr} (${dayData.day}) - Revenue: $${order.finalTotal || order.totalAmount}`);
            } else {
                // If order date is outside our range, log it for debugging
                console.log(`⚠️ Order ${order.orderNumber} date ${dateStr} is outside the sales data range. Order date: ${order.orderDate}`);
            }
        });

        // Convert map to array and sort by date to ensure correct order
        const salesDataArray = Array.from(salesDataMap.values())
            .sort((a, b) => new Date(a.date) - new Date(b.date));

        // Final check for duplicates and remove them
        const uniqueSalesData = [];
        const seenDates = new Set();
        salesDataArray.forEach(day => {
            if (!seenDates.has(day.date)) {
                seenDates.add(day.date);
                uniqueSalesData.push(day);
            } else {
                console.log(`⚠️ Duplicate date found and removed: ${day.date}`);
            }
        });

        console.log(`📊 Final sales data: ${uniqueSalesData.length} unique days`);

        const salesData = uniqueSalesData;

        // Calculate top selling items
        const itemSales = new Map();
        completedOrders.forEach(order => {
            if (order.items && Array.isArray(order.items)) {
                order.items.forEach(item => {
                    const itemName = item.name || 'Unknown';
                    const quantity = item.quantity || 1;
                    const price = parseFloat(item.price || 0);
                    const revenue = quantity * price;

                    if (itemSales.has(itemName)) {
                        const existing = itemSales.get(itemName);
                        existing.sales += quantity;
                        existing.revenue += revenue;
                    } else {
                        itemSales.set(itemName, { name: itemName, sales: quantity, revenue });
                    }
                });
            }
        });

        const topItems = Array.from(itemSales.values())
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 10)
            .map(item => ({
                name: item.name,
                sales: item.sales,
                revenue: parseFloat(item.revenue.toFixed(2))
            }));

        // Calculate employee performance
        const employeeStats = new Map();
        const employeeIds = new Set();
        completedOrders.forEach(order => {
            if (order.employeeId) {
                employeeIds.add(order.employeeId);
            }
        });

        if (employeeIds.size > 0) {
            const employees = await Employee.findAll({
                where: {
                    id: {
                        [Op.in]: Array.from(employeeIds)
                    },
                    ownerId
                }
            });

            employees.forEach(emp => {
                employeeStats.set(emp.id, {
                    id: emp.id,
                    name: `${emp.firstName} ${emp.lastName}`,
                    orders: 0,
                    revenue: 0
                });
            });
        }

        completedOrders.forEach(order => {
            if (order.employeeId && employeeStats.has(order.employeeId)) {
                const empStat = employeeStats.get(order.employeeId);
                empStat.orders += 1;
                empStat.revenue += parseFloat(order.finalTotal || order.totalAmount || 0);
            }
        });

        const employeePerformance = Array.from(employeeStats.values())
            .sort((a, b) => b.revenue - a.revenue)
            .map(emp => ({
                name: emp.name,
                orders: emp.orders,
                revenue: parseFloat(emp.revenue.toFixed(2)),
                rating: '4.5' // Placeholder - would need rating system
            }));

        // Calculate revenue breakdown by order type
        const revenueByType = {
            'dine-in': 0,
            'to-go': 0,
            'pickup': 0,
            'drive-thru': 0,
            'online-order': 0,
            'delivery': 0
        };

        completedOrders.forEach(order => {
            const orderType = order.orderType || 'dine-in';
            const revenue = parseFloat(order.finalTotal || order.totalAmount || 0);
            if (revenueByType.hasOwnProperty(orderType)) {
                revenueByType[orderType] += revenue;
            } else {
                revenueByType['dine-in'] += revenue; // Default to dine-in
            }
        });

        const totalRevenueByType = Object.values(revenueByType).reduce((sum, val) => sum + val, 0);
        const dineInRevenue = revenueByType['dine-in'] + revenueByType['to-go'] + revenueByType['pickup'] + revenueByType['drive-thru'];
        const onlineRevenue = revenueByType['online-order'] + revenueByType['delivery'];

        const revenueBreakdown = {
            dineIn: {
                revenue: parseFloat(dineInRevenue.toFixed(2)),
                percentage: totalRevenueByType > 0 ? parseFloat((dineInRevenue / totalRevenueByType * 100).toFixed(1)) : 0
            },
            online: {
                revenue: parseFloat(onlineRevenue.toFixed(2)),
                percentage: totalRevenueByType > 0 ? parseFloat((onlineRevenue / totalRevenueByType * 100).toFixed(1)) : 0
            }
        };

        const analyticsData = {
            sales: {
                totalRevenue: parseFloat(totalRevenue.toFixed(2)),
                totalOrders,
                averageOrderValue: parseFloat(averageOrderValue.toFixed(2)),
                revenueGrowth: parseFloat(revenueGrowth),
                orderGrowth: parseFloat(orderGrowth),
                totalTips: parseFloat(totalTips.toFixed(2)),
                averageTip: parseFloat(averageTip.toFixed(2)),
                tipPercentage: parseFloat(tipPercentage.toFixed(2)),
                tipGrowth: parseFloat(tipGrowth)
            },
            customers: {
                totalCustomers,
                newCustomers: totalCustomers, // Simplified - would need customer tracking
                returningCustomers: 0,
                customerGrowth: 0
            },
            salesData,
            topItems,
            employeePerformance,
            revenueBreakdown
        };

        return res.json({
            success: true,
            data: analyticsData
        });

    } catch (error) {
        console.error('Error fetching analytics overview:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch analytics overview',
            message: error.message
        });
    }
});

module.exports = router;
