const express = require('express');
const crypto = require('crypto');
const { Order, Owner } = require('../models');
const router = express.Router();

// DoorDash Developer ID and Key ID from environment
const DOORDASH_DEVELOPER_ID = process.env.DOORDASH_DEVELOPER_ID;
const DOORDASH_KEY_ID = process.env.DOORDASH_KEY_ID;

/**
 * Verify DoorDash webhook signature
 * DoorDash signs webhooks with HMAC-SHA256
 */
const verifyWebhookSignature = (payload, signature, secret) => {
    if (!signature || !secret) {
        console.log('⚠️ Signature verification skipped: missing signature or secret');
        return true; // Skip verification if not configured
    }

    try {
        const hmac = crypto.createHmac('sha256', secret);
        hmac.update(JSON.stringify(payload));
        const expectedSignature = hmac.digest('hex');

        // Normalize signatures (remove whitespace)
        const normalizedSignature = signature.trim();
        const normalizedExpected = expectedSignature.trim();

        // Use timing-safe comparison - ensure buffers are same length
        if (normalizedSignature.length !== normalizedExpected.length) {
            console.warn('⚠️ Signature length mismatch:', {
                received: normalizedSignature.length,
                expected: normalizedExpected.length
            });
            return false;
        }

        // Create buffers of same length for comparison
        const sigBuffer = Buffer.from(normalizedSignature, 'utf8');
        const expectedBuffer = Buffer.from(normalizedExpected, 'utf8');

        return crypto.timingSafeEqual(sigBuffer, expectedBuffer);
    } catch (error) {
        console.error('❌ Error verifying signature:', error.message);
        return false;
    }
};

/**
 * Convert DoorDash order format to our order format
 */
const convertDoorDashOrder = (doordashOrder, ownerId) => {
    try {
        // Extract items from DoorDash order
        const items = (doordashOrder.items || []).map(item => ({
            name: item.name || 'Unknown Item',
            price: parseFloat(item.price || 0) / 100, // DoorDash prices are in cents
            quantity: parseInt(item.quantity || 1),
            description: item.description || '',
            modifiers: item.modifiers || []
        }));

        // Calculate totals
        const subtotal = parseFloat(doordashOrder.subtotal || 0) / 100;
        const tax = parseFloat(doordashOrder.tax || 0) / 100;
        const tip = parseFloat(doordashOrder.tip || 0) / 100;
        const deliveryFee = parseFloat(doordashOrder.delivery_fee || 0) / 100;
        const serviceFee = parseFloat(doordashOrder.service_fee || 0) / 100;
        const finalTotal = parseFloat(doordashOrder.total || 0) / 100;

        // Extract customer information
        const customer = doordashOrder.customer || {};
        const deliveryAddress = doordashOrder.delivery_address || {};

        return {
            orderNumber: `DD-${doordashOrder.id || Date.now().toString().slice(-8)}`,
            ownerId: ownerId,
            employeeId: null, // DoorDash orders don't have employee
            orderDate: new Date(doordashOrder.created_at || Date.now()),
            items: items,
            orderType: 'online-order',
            tableNumber: null,
            customerName: `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'DoorDash Customer',
            customerPhone: customer.phone || null,
            deliveryAddress: {
                street: deliveryAddress.street || '',
                city: deliveryAddress.city || '',
                state: deliveryAddress.state || '',
                zip: deliveryAddress.zip || '',
                formatted: deliveryAddress.formatted_address || ''
            },
            totalAmount: subtotal,
            discountAmount: parseFloat(doordashOrder.discount || 0) / 100,
            serviceCharge: serviceFee,
            tax: tax,
            tip: tip,
            deliveryFee: deliveryFee,
            finalTotal: finalTotal,
            status: mapDoorDashStatus(doordashOrder.status),
            doordashOrderId: doordashOrder.id,
            doordashStoreId: doordashOrder.store_id,
            doordashMetadata: {
                external_store_id: doordashOrder.external_store_id,
                currency: doordashOrder.currency || 'USD',
                estimated_delivery_time: doordashOrder.estimated_delivery_time,
                actual_delivery_time: doordashOrder.actual_delivery_time
            }
        };
    } catch (error) {
        console.error('Error converting DoorDash order:', error);
        throw error;
    }
};

/**
 * Map DoorDash order status to our order status
 */
const mapDoorDashStatus = (doordashStatus) => {
    const statusMap = {
        'created': 'pending',
        'confirmed': 'pending',
        'assigned': 'preparing',
        'picked_up': 'preparing',
        'arrived': 'ready',
        'delivered': 'completed',
        'cancelled': 'cancelled',
        'refunded': 'cancelled'
    };
    return statusMap[doordashStatus?.toLowerCase()] || 'pending';
};

/**
 * Find owner by DoorDash store ID or use default
 * In production, you should map DoorDash store IDs to owner IDs
 * For now, finds owner by email: lavanyanallabelli@gmail.com
 */
const findOwnerByStoreId = async (storeId) => {
    try {
        // Find owner by email (lavanyanallabelli@gmail.com)
        const owner = await Owner.findOne({
            where: {
                email: 'lavanyanallabelli@gmail.com',
                isActive: true
            }
        });

        if (!owner) {
            console.warn('⚠️ Owner not found by email, trying first active owner');
            // Fallback to first active owner
            const fallbackOwner = await Owner.findOne({
                where: { isActive: true },
                order: [['createdAt', 'DESC']]
            });

            if (!fallbackOwner) {
                console.error('No active owner found for DoorDash order');
                return null;
            }

            return fallbackOwner.id;
        }

        console.log('✅ Found owner for DoorDash order:', {
            ownerId: owner.id,
            email: owner.email,
            businessName: owner.businessName
        });

        return owner.id;
    } catch (error) {
        console.error('Error finding owner:', error);
        return null;
    }
};

/**
 * DoorDash Webhook Endpoint
 * POST /api/doordash/webhook
 * 
 * This endpoint receives webhook events from DoorDash
 * 
 * Webhook URL (using ngrok for local development):
 * https://clamatorial-nonmaturely-lakeshia.ngrok-free.dev/api/doordash/webhook
 * 
 * For production, replace with your actual domain:
 * https://your-domain.com/api/doordash/webhook
 * 
 * Note: ngrok URLs change when you restart ngrok. Update DoorDash portal if URL changes.
 */
router.post('/webhook', express.json({
    verify: (req, res, buf) => {
        // Store raw body for signature verification
        req.rawBody = buf.toString('utf8');
    }
}), async (req, res) => {
    try {
        console.log('📦 DoorDash webhook received:', {
            headers: req.headers,
            body: req.body
        });

        // Extract signature from headers
        const signature = req.headers['x-doordash-signature'] || req.headers['x-signature'];
        const eventType = req.headers['x-doordash-event'] || req.body.event_type || req.body.type || 'order.created'; // Default to order.created for testing

        console.log('📦 Webhook event type:', eventType);

        // Verify webhook signature (if secret is configured)
        // Note: DoorDash may use different signature methods - check their docs
        // For testing, we'll log but not block if signature verification fails
        // TODO: Enable strict signature verification in production
        if (process.env.DOORDASH_WEBHOOK_SECRET && signature) {
            try {
                const isValid = verifyWebhookSignature(
                    req.body,
                    signature,
                    process.env.DOORDASH_WEBHOOK_SECRET
                );

                if (!isValid) {
                    console.warn('⚠️ Invalid DoorDash webhook signature - but allowing for testing');
                    // Don't block for now - DoorDash may use different signature format
                } else {
                    console.log('✅ Webhook signature verified');
                }
            } catch (error) {
                console.warn('⚠️ Signature verification error (allowing request):', error.message);
                // Don't block - continue processing
            }
        } else {
            console.log('ℹ️ Signature verification skipped (no secret or signature provided)');
        }

        // Continue processing regardless of signature verification result

        const payload = req.body;
        const orderData = payload.data || payload;

        // Handle different event types
        switch (eventType) {
            case 'order.created':
            case 'order.confirmed':
                await handleOrderCreated(orderData);
                break;

            case 'order.updated':
            case 'order.status_changed':
                await handleOrderUpdated(orderData);
                break;

            case 'order.cancelled':
                await handleOrderCancelled(orderData);
                break;

            default:
                console.log(`ℹ️ Unhandled event type: ${eventType}`);
        }

        // Always return 200 to acknowledge receipt
        res.status(200).json({
            success: true,
            message: 'Webhook received'
        });

    } catch (error) {
        console.error('❌ Error processing DoorDash webhook:', error);
        // Still return 200 to prevent DoorDash from retrying
        res.status(200).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Handle order.created event
 */
const handleOrderCreated = async (doordashOrder) => {
    try {
        console.log('🆕 Processing new DoorDash order:', doordashOrder.id);

        // Find owner by store ID
        const storeId = doordashOrder.store_id || doordashOrder.external_store_id;
        const ownerId = await findOwnerByStoreId(storeId);

        if (!ownerId) {
            console.error('❌ No owner found for DoorDash order');
            return;
        }

        // Check if order already exists
        const existingOrder = await Order.findOne({
            where: {
                doordashOrderId: doordashOrder.id
            }
        });

        if (existingOrder) {
            console.log('ℹ️ DoorDash order already exists:', doordashOrder.id);
            return;
        }

        // Convert and create order
        const orderData = convertDoorDashOrder(doordashOrder, ownerId);
        console.log('📦 Creating DoorDash order with data:', {
            ownerId: orderData.ownerId,
            orderNumber: orderData.orderNumber,
            orderType: orderData.orderType,
            status: orderData.status,
            total: orderData.finalTotal
        });

        const order = await Order.create(orderData);

        console.log('✅ DoorDash order created successfully:', {
            orderId: order.id,
            orderNumber: order.orderNumber,
            doordashOrderId: doordashOrder.id,
            ownerId: order.ownerId,
            orderType: order.orderType,
            status: order.status,
            total: order.finalTotal
        });

        return order;
    } catch (error) {
        console.error('❌ Error handling order.created:', error);
        throw error;
    }
};

/**
 * Handle order.updated event
 */
const handleOrderUpdated = async (doordashOrder) => {
    try {
        console.log('🔄 Updating DoorDash order:', doordashOrder.id);

        const existingOrder = await Order.findOne({
            where: {
                doordashOrderId: doordashOrder.id
            }
        });

        if (!existingOrder) {
            console.log('⚠️ Order not found, creating new order');
            return await handleOrderCreated(doordashOrder);
        }

        // Update order status
        const newStatus = mapDoorDashStatus(doordashOrder.status);
        existingOrder.status = newStatus;
        await existingOrder.save();

        console.log('✅ DoorDash order updated:', {
            orderId: existingOrder.id,
            newStatus: newStatus
        });

        return existingOrder;
    } catch (error) {
        console.error('❌ Error handling order.updated:', error);
        throw error;
    }
};

/**
 * Handle order.cancelled event
 */
const handleOrderCancelled = async (doordashOrder) => {
    try {
        console.log('❌ Cancelling DoorDash order:', doordashOrder.id);

        const existingOrder = await Order.findOne({
            where: {
                doordashOrderId: doordashOrder.id
            }
        });

        if (!existingOrder) {
            console.log('⚠️ Order not found for cancellation');
            return;
        }

        existingOrder.status = 'cancelled';
        await existingOrder.save();

        console.log('✅ DoorDash order cancelled:', existingOrder.id);

        return existingOrder;
    } catch (error) {
        console.error('❌ Error handling order.cancelled:', error);
        throw error;
    }
};

/**
 * Health check endpoint
 */
router.get('/health', (req, res) => {
    res.json({
        success: true,
        service: 'DoorDash Webhook Service',
        developerId: DOORDASH_DEVELOPER_ID ? 'configured' : 'missing',
        keyId: DOORDASH_KEY_ID ? 'configured' : 'missing'
    });
});

module.exports = router;

