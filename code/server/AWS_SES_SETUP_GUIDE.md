# AWS SES Setup Guide

This guide will help you set up AWS Simple Email Service (SES) for sending emails. **No App Passwords needed!**

## Why AWS SES?

- ✅ **No App Password required** - Uses your existing AWS credentials
- ✅ **Free tier**: 62,000 emails/month free (if sending from EC2)
- ✅ **Production-ready**: Built for enterprise use
- ✅ **Reliable**: Better deliverability than SMTP
- ✅ **You're already on AWS** - Easy integration

---

## Step 1: Access AWS SES Console

1. Go to [AWS Console](https://console.aws.amazon.com)
2. Sign in to your AWS account
3. Search for **"SES"** or **"Simple Email Service"** in the search bar
4. Click on **"Amazon SES"**

---

## Step 2: Verify Your Email Address

**Important**: AWS SES requires email verification to prevent spam.

### Option A: Verify Single Email Address (Recommended for Development)

1. In SES Console, click **"Verified identities"** in the left menu
2. Click **"Create identity"**
3. Select **"Email address"**
4. Enter your **company's registered email** (the one you use during owner registration)
5. Click **"Create identity"**
6. **Check your email** - AWS will send a verification email
7. Click the verification link in the email
8. Your email will now show as **"Verified"** ✅

### Option B: Verify Domain (For Production)

If you have your own domain:
1. Select **"Domain"** instead of "Email address"
2. Follow the DNS verification steps
3. This allows sending from any email on that domain

---

## Step 3: Request Production Access (If Needed)

**By default, AWS SES starts in "Sandbox Mode":**

- ✅ Can send to **verified email addresses only**
- ❌ Cannot send to unverified addresses
- ✅ Perfect for testing

### To Send to Any Email Address:

1. In SES Console, click **"Account dashboard"** in left menu
2. Look for **"Sending quota"** section
3. Click **"Request production access"**
4. Fill out the form:
   - **Mail type**: Transactional
   - **Use case**: Employee notifications, order confirmations
   - **Website URL**: Your application URL
   - **Additional details**: Describe your POS system
5. Submit request
6. Usually approved within 24 hours

---

## Step 4: Update Your .env File

Your AWS credentials are already configured! Just make sure these are set:

```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_existing_aws_access_key
AWS_SECRET_ACCESS_KEY=your_existing_aws_secret_key
```

**That's it!** No SMTP configuration needed.

---

## Step 5: Restart Your Backend Server

After verifying your email in SES:

```bash
cd code/server
node server.js
```

---

## Testing

1. Try sending an email through your application
2. Check AWS SES Console → **"Sending statistics"** to see sent emails
3. Check **"Account dashboard"** for any bounces or complaints

---

## Important Notes

### Email Verification Requirements

- **Development**: Only verified emails can receive emails
- **Production**: After approval, can send to any email

### From Address

- The "From" email **must be verified** in SES
- We use your owner's registered email as the sender
- Make sure that email is verified in SES!

### Pricing

- **Free tier**: 62,000 emails/month free (from EC2 in same region)
- **After free tier**: $0.10 per 1,000 emails
- **Very affordable** for most applications

---

## Troubleshooting

### "Email address not verified"
- Make sure you verified the sender email in SES Console
- Check that the email matches your owner's registered email

### "MessageRejected" error
- The recipient email might not be verified (if in Sandbox mode)
- Request production access to send to any email

### "Invalid credentials"
- Check that `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` are correct in `.env`
- Verify the IAM user has SES permissions

---

## IAM Permissions Required

Your AWS user needs these permissions:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "ses:SendEmail",
                "ses:SendRawEmail"
            ],
            "Resource": "*"
        }
    ]
}
```

If using existing AWS credentials (for Cognito), they likely already have SES permissions. If not, add the above policy.

---

## Benefits Over SMTP

✅ **No App Passwords** - Uses AWS credentials  
✅ **Better deliverability** - AWS handles reputation  
✅ **Production-ready** - Built for scale  
✅ **Easy monitoring** - See bounces, complaints in console  
✅ **Cost-effective** - Free tier covers most needs  

---

## Next Steps

1. ✅ Verify your email in SES Console
2. ✅ Restart backend server
3. ✅ Test sending an email
4. 📧 Check your inbox!

That's it! No more Outlook/Gmail authentication issues! 🎉

