# Gmail SMTP Setup for Schedule Emails

## ✅ Required .env Configuration

Update your `code/server/.env` file with these Gmail settings:

```env
# Gmail SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_gmail@gmail.com
SMTP_PASS=your_gmail_app_password
```

## 🔑 How to Get Gmail App Password

1. **Go to your Google Account**: https://myaccount.google.com/
2. **Security** → **2-Step Verification** (must be enabled)
3. **App passwords** (at the bottom)
4. **Select app**: "Mail"
5. **Select device**: "Other (Custom name)" → enter "POS System"
6. **Generate** → Copy the 16-character password
7. **Use this password** as `SMTP_PASS` in your `.env`

## ⚠️ Important Notes

- **SMTP_USER**: Your Gmail address (e.g., `yourname@gmail.com`)
- **SMTP_PASS**: The 16-character App Password (NOT your regular Gmail password)
- **SMTP_HOST**: Must be `smtp.gmail.com` (not `smtp-mail.outlook.com`)
- **SMTP_PORT**: `587` (for TLS)
- **SMTP_SECURE**: `false` (for port 587)

## 🧪 Testing

After updating `.env`:
1. **Restart backend server**
2. **Try sending a schedule email**
3. **Check backend logs** for:
   - `📧 Using Gmail SMTP configuration`
   - `✅ Schedule email sent successfully!`

## 🔍 Troubleshooting

### Error: "Authentication unsuccessful"
- **Solution**: Make sure you're using an App Password, not your regular Gmail password
- **Solution**: Ensure 2-Step Verification is enabled

### Error: "Invalid login"
- **Solution**: Double-check SMTP_USER is your full Gmail address
- **Solution**: Verify SMTP_PASS is the 16-character App Password (no spaces)

### Still connecting to Outlook?
- **Solution**: Make sure `SMTP_HOST=smtp.gmail.com` in `.env`
- **Solution**: Restart backend server after changing `.env`

