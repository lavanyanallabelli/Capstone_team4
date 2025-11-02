# How to Get Microsoft Outlook App Password

Microsoft has disabled basic authentication (regular password login) for SMTP. You need an App Password to send emails.

## Step-by-Step Guide

### Step 1: Enable 2-Step Verification
1. Go to [Microsoft Account Security](https://account.microsoft.com/security)
2. Sign in with your Outlook account
3. Click **"2-Step Verification"** (or **"Security" → **"Two-step verification"**)
4. Follow the prompts to enable it
   - You'll need access to your phone or email for verification

### Step 2: Create App Password
1. After enabling 2-Step Verification, go back to [Security Settings](https://account.microsoft.com/security)
2. Click **"Advanced security options"** (or look for "App passwords" directly)
3. Under **"App passwords"**, click **"Create a new app password"**
4. Select:
   - **App**: Mail
   - **Device**: Other (Custom name)
   - **Name**: Enter "POS System" or "Email Service"
5. Click **"Generate"**
6. **Copy the 16-character password immediately** (you won't see it again!)
   - Format: `XXXX-XXXX-XXXX-XXXX` (spaces or dashes don't matter)

### Step 3: Update Your .env File
Update `code/server/.env`:

```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your_outlook_email@outlook.com
SMTP_PASS=your_16_character_app_password
SMTP_SECURE=false
```

**Important**: 
- Use your **App Password**, NOT your regular Outlook password
- The App Password is the one you just generated (16 characters)
- Remove any spaces or dashes if present

### Step 4: Restart Backend Server
After updating `.env`, restart your backend server:

```bash
# Stop server (Ctrl+C)
# Restart:
cd code/server
node server.js
```

## Troubleshooting

### "App passwords" option not showing?
- Make sure 2-Step Verification is fully enabled
- Wait a few minutes after enabling 2-Step Verification
- Try refreshing the page
- Some Microsoft accounts don't support App Passwords (work/school accounts managed by organization)

### Still getting authentication errors?
1. Double-check you're using the App Password (16 characters), not regular password
2. Make sure `SMTP_USER` matches your Outlook email exactly
3. Verify there are no extra spaces in `.env` file
4. Try removing dashes/spaces from App Password

### Can't create App Password?
**Alternative: Use Gmail instead**
- Gmail App Password setup is often more reliable
- Follow the Gmail setup guide in `EMAIL_SETUP_GUIDE.md`

## Email Sender Information

Even with App Password authentication:
- **SMTP Auth**: Uses your Outlook email + App Password
- **From Address**: Will show your registered company email (from Owner registration)
- **Reply-To**: Set to your registered company email

The App Password is only for SMTP authentication. The email will still appear to come from your registered company email address.

