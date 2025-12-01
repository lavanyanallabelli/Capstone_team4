# DoorDash Integration Setup Guide

## Overview
This guide will help you set up DoorDash webhook integration to receive orders directly into your POS system.

## Webhook Endpoint

**Your webhook URL (using ngrok for public access):**
```
https://clamatorial-nonmaturely-lakeshia.ngrok-free.dev/api/doordash/webhook
```

**For local development (direct):**
```
http://localhost:5000/api/doordash/webhook
```

**Note:** The ngrok URL above is your public webhook endpoint. Use this URL when configuring the webhook in DoorDash Developer Portal.

## Step 1: Environment Variables

Add the following to your `.env` file in the `code/server/` directory:

```env
# DoorDash Integration Configuration
DOORDASH_DEVELOPER_ID=449f7347-fd37-4ed9-87e5-686cb29c797b
DOORDASH_KEY_ID=801edfcc-e14e-43c3-8543-252fbef07cce
DOORDASH_WEBHOOK_SECRET=jCTtrGPrxMrkUil4_7AJ_smnu46slA5tUJX84IZuZaQ
```

**Note:** The `DOORDASH_WEBHOOK_SECRET` will be provided by DoorDash when you configure the webhook in their developer portal.

## Step 2: Database Migration

The Order model has been updated with DoorDash-specific fields. Run the following to update your database:

```bash
# The model will automatically sync on server restart
# Or manually sync:
npm run db:sync
```

New fields added:
- `customerPhone` - Customer phone number
- `deliveryAddress` - JSONB field for delivery address
- `deliveryFee` - Delivery fee amount
- `doordashOrderId` - Unique DoorDash order ID
- `doordashStoreId` - DoorDash store ID
- `doordashMetadata` - Additional DoorDash order metadata

## Step 3: Configure Webhook in DoorDash Developer Portal

1. Log in to [DoorDash Developer Portal](https://developer.doordash.com/)
2. Navigate to your application settings
3. Go to "Webhooks" section
4. Add a new webhook with the following:
   - **Webhook URL:** `https://clamatorial-nonmaturely-lakeshia.ngrok-free.dev/api/doordash/webhook`
   - **Events to subscribe:**
     - `order.created`
     - `order.updated`
     - `order.status_changed`
     - `order.cancelled`
   - **Webhook Secret:** Generate and save this - add it to your `.env` as `DOORDASH_WEBHOOK_SECRET`

**Important:** Make sure your ngrok tunnel is running before configuring the webhook. The ngrok URL will change if you restart ngrok, so you'll need to update it in DoorDash portal.

## Step 4: Store ID Mapping (Important!)

Currently, the webhook uses the first active owner in your database. **You need to implement proper mapping** between DoorDash store IDs and your owner IDs.

**To implement proper mapping:**

1. Create a mapping table or add a field to your Owner model:
   ```javascript
   // In Owner model, add:
   doordashStoreId: {
       type: DataTypes.STRING(100),
       allowNull: true
   }
   ```

2. Update `findOwnerByStoreId` function in `code/server/routes/doordash.js`:
   ```javascript
   const findOwnerByStoreId = async (storeId) => {
       const owner = await Owner.findOne({
           where: { 
               doordashStoreId: storeId,
               isActive: true 
           }
       });
       return owner?.id || null;
   };
   ```

3. Set the DoorDash store ID for each owner in your database.

## Step 5: Testing

### Test the webhook endpoint:

```bash
# Health check (local)
curl http://localhost:5000/api/doordash/health

# Health check (via ngrok)
curl https://clamatorial-nonmaturely-lakeshia.ngrok-free.dev/api/doordash/health

# Test webhook via ngrok (example payload)
curl -X POST https://clamatorial-nonmaturely-lakeshia.ngrok-free.dev/api/doordash/webhook \
  -H "Content-Type: application/json" \
  -H "x-doordash-event: order.created" \
  -d '{
    "id": "test-order-123",
    "store_id": "test-store",
    "status": "created",
    "created_at": "2025-11-15T12:00:00Z",
    "items": [
      {
        "name": "Test Item",
        "price": 1000,
        "quantity": 1
      }
    ],
    "subtotal": 1000,
    "tax": 80,
    "total": 1080,
    "customer": {
      "first_name": "John",
      "last_name": "Doe",
      "phone": "+1234567890"
    }
  }'
```

### Using ngrok for Local Development

1. **Start your backend server:**
   ```bash
   cd code/server
   npm start
   ```

2. **Start ngrok tunnel:**
   ```bash
   ngrok http 5000
   ```

3. **Copy the ngrok HTTPS URL** (e.g., `https://clamatorial-nonmaturely-lakeshia.ngrok-free.dev`)

4. **Use the full webhook URL** in DoorDash portal:
   ```
   https://clamatorial-nonmaturely-lakeshia.ngrok-free.dev/api/doordash/webhook
   ```

**Note:** 
- ngrok free tier URLs change each time you restart ngrok
- For production, use a fixed domain instead of ngrok
- Keep ngrok running while testing webhooks

## Step 6: View Orders in POS

DoorDash orders will automatically appear in the "Online Orders" tab at:
```
http://localhost:3000/pos
```

Orders are filtered by:
- `orderType: 'online-order'`
- Status: not `completed` or `cancelled`

## Webhook Events Handled

1. **order.created** / **order.confirmed**
   - Creates a new order in your system
   - Status: `pending`

2. **order.updated** / **order.status_changed**
   - Updates existing order status
   - Maps DoorDash statuses to your statuses:
     - `created` → `pending`
     - `confirmed` → `pending`
     - `assigned` → `preparing`
     - `picked_up` → `preparing`
     - `arrived` → `ready`
     - `delivered` → `completed`
     - `cancelled` → `cancelled`

3. **order.cancelled**
   - Sets order status to `cancelled`

## Status Mapping

| DoorDash Status | POS Status |
|----------------|------------|
| created        | pending    |
| confirmed      | pending    |
| assigned       | preparing  |
| picked_up      | preparing  |
| arrived        | ready      |
| delivered      | completed  |
| cancelled      | cancelled  |
| refunded       | cancelled  |

## Troubleshooting

### Orders not appearing:
1. Check server logs for webhook errors
2. Verify webhook URL is accessible from internet (test via ngrok URL)
3. **Ensure ngrok is running** - if ngrok stops, webhooks won't work
4. Check DoorDash developer portal for webhook delivery status
5. Verify owner mapping is correct
6. Test webhook manually using curl (see Step 5)

### Webhook signature verification failing:
1. Ensure `DOORDASH_WEBHOOK_SECRET` matches the secret in DoorDash portal
2. Check that the signature header is being sent correctly
3. Review DoorDash webhook documentation for signature format

### Database errors:
1. Ensure database migration has run
2. Check that all new fields are nullable (they are)
3. Verify database connection is working

## Security Notes

- Webhook endpoint does NOT require authentication (standard for webhooks)
- Webhook signature verification is recommended (set `DOORDASH_WEBHOOK_SECRET`)
- Consider rate limiting for production
- Use HTTPS in production (required by DoorDash)

## Support

For DoorDash API documentation:
- [DoorDash Developer Portal](https://developer.doordash.com/)
- [DoorDash Webhook Documentation](https://developer.doordash.com/app-integration/webhooks/)

