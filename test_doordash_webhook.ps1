# Test DoorDash Webhook - Send Online Order
# This script sends a test POST request to the DoorDash webhook endpoint

# Webhook URL - Try localhost first, then ngrok
# Option 1: Local development (if server is running locally)
$webhookUrl = "http://localhost:5000/api/doordash/webhook"

# Option 2: If using ngrok, uncomment and update this URL
# $webhookUrl = "https://clamatorial-nonmaturely-lakeshia.ngrok-free.dev/api/doordash/webhook"

# Option 3: If server is on a different port, update accordingly
# $webhookUrl = "http://localhost:5001/api/doordash/webhook"

# Test order payload (mimics DoorDash webhook format)
$orderPayload = @{
    id = "test-order-$(Get-Date -Format 'yyyyMMddHHmmss')"
    store_id = "test-store-123"
    status = "created"
    event_type = "order.created"
    created_at = (Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ")
    items = @(
        @{
            name = "pepparoni pizza"
            price = 1299
            quantity = 2
            item_id = "item-001"
        },
        @{
            name = "diet coke"
            price = 899
            quantity = 1
            item_id = "item-002"
        }
    )
    subtotal = 3497
    tax = 280
    total = 3777
    delivery_fee = 299
    customer = @{
        first_name = "John"
        last_name = "Doe"
        phone = "+12015551234"
        email = "john.doe@example.com"
    }
    delivery_address = @{
        street = "123 Main St"
        city = "New York"
        state = "NY"
        zip_code = "10001"
        country = "US"
    }
} | ConvertTo-Json -Depth 10

# Headers
$headers = @{
    "Content-Type" = "application/json"
    "x-doordash-event" = "order.created"
    "User-Agent" = "DoorDash-Webhook/1.0"
}

Write-Host "🚀 Sending test DoorDash webhook request..." -ForegroundColor Cyan
Write-Host "📡 URL: $webhookUrl" -ForegroundColor Yellow
Write-Host "📦 Payload:" -ForegroundColor Yellow
Write-Host $orderPayload -ForegroundColor Gray
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri $webhookUrl -Method Post -Body $orderPayload -Headers $headers -ErrorAction Stop
    
    Write-Host "✅ Success! Response:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 10 | Write-Host -ForegroundColor Green
    
} catch {
    Write-Host "❌ Error occurred:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response Body: $responseBody" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "💡 Tips:" -ForegroundColor Yellow
    Write-Host "  - Make sure your backend server is running on port 5001" -ForegroundColor Yellow
    Write-Host "  - If using ngrok, make sure ngrok is running and update the URL above" -ForegroundColor Yellow
    Write-Host "  - Check server logs for detailed error messages" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✨ Test completed!" -ForegroundColor Cyan

