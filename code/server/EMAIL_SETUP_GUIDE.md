# Email Setup Guide

This guide explains how to configure email sending for employee login credentials.

## Quick Setup Options

### Option 1: Outlook/Hotmail (⚠️ May Require App Password)

**Best for**: If you already have Outlook account

**⚠️ IMPORTANT**: Microsoft has disabled basic authentication for many accounts. If you get error "535 5.7.139 basic authentication is disabled", you need an App Password.

#### Try Regular Password First:
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your_email@outlook.com
SMTP_PASS=your_outlook_password
SMTP_SECURE=false
```

#### If That Fails - Use App Password:
1. Go to [Microsoft Account Security](https://account.microsoft.com/security)
2. Enable **2-Step Verification**
3. Go to **Advanced security options** → **App passwords**
4. Create app password named "POS System"
5. Use that password in `.env` file

**Note**: If App Password option is unavailable, Microsoft has fully disabled basic auth. Use Gmail instead.

---

### Option 2: Gmail (Requires App Password)

**Best for**: If you already use Gmail

#### Step 1: Enable 2-Step Verification
1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Click "2-Step Verification"
3. Follow the setup process (you'll need your phone)

#### Step 2: Generate App Password
1. Go back to Security settings
2. Under "2-Step Verification", click "App passwords"
3. Select "Mail" and "Other (Custom name)"
4. Enter "POS System" as the name
5. Click "Generate"
6. Copy the 16-character password (no spaces)

#### Step 3: Add to `.env` file:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_16_character_app_password
SMTP_SECURE=false
```

---

### Option 3: Yahoo Mail

1. Enable 2-Step Verification in Yahoo Account Security
2. Generate App Password (similar to Gmail)
3. Add to `.env`:
```env
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_USER=your_email@yahoo.com
SMTP_PASS=your_app_password
SMTP_SECURE=false
```

---

### Option 4: Custom SMTP Server

If you have your own email server or use a service like SendGrid, AWS SES, etc.:

```env
SMTP_HOST=your_smtp_server.com
SMTP_PORT=587
SMTP_USER=your_email@domain.com
SMTP_PASS=your_password
SMTP_SECURE=false
```

For port 465 (SSL), use:
```env
SMTP_PORT=465
SMTP_SECURE=true
```

---

## Testing Email Configuration

After adding credentials to `.env`:

1. **Restart your backend server**
2. Try creating an employee or resending credentials
3. Check server console logs for:
   - ✅ "SMTP server connection verified" = Success!
   - ❌ Error messages = Configuration issue

---

## Troubleshooting

### "SMTP configuration missing"
- Check that `SMTP_USER` and `SMTP_PASS` are set in `.env`
- Restart server after adding credentials

### "Invalid login" or "Authentication failed"
- **Gmail**: Make sure you're using App Password, not regular password
- **Outlook**: Make sure password is correct
- Check for typos in email or password

### "Connection timeout"
- Check your internet connection
- Verify SMTP host and port are correct
- Check firewall isn't blocking port 587

### "Email sent but not received"
- Check spam/junk folder
- Verify recipient email address is correct
- Wait a few minutes (some providers delay delivery)

---

## Recommended: Use Outlook/Hotmail

If you're having trouble with Gmail App Passwords, **Outlook/Hotmail is the easiest option**:
- No 2FA required
- No App Password needed
- Just use your regular password
- Works immediately

Just use these settings:
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your_email@outlook.com
SMTP_PASS=your_password
```

