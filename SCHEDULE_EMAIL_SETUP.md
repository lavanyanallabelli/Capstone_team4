# Schedule Email Functionality - Setup Guide

## ✅ What Was Fixed

### 1. **Backend Route** (`/api/schedules/:scheduleId/send-email`)
   - ✅ Route exists and is registered in `server.js` (line 71)
   - ✅ Added validation for employee email
   - ✅ Added better error handling and logging
   - ✅ Updates `lastSentAt` timestamp after successful send

### 2. **Frontend Button** (`ScheduleManagement.js`)
   - ✅ Button calls `handleSendEmail` correctly
   - ✅ Added loading state (shows "Sending..." with spinner)
   - ✅ Button disabled while sending (prevents double-clicks)
   - ✅ Better error messages displayed to user

### 3. **Email Service** (`emailService.js`)
   - ✅ `sendScheduleEmail` function exists and is complete
   - ✅ Supports both SMTP and AWS SES
   - ✅ Beautiful HTML email template with schedule table

## 🔧 Requirements for Email to Work

### **SMTP Configuration** (in `.env` file)
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_SECURE=false
```

**OR** use AWS SES:
```env
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
SES_FROM=your_verified_email@example.com
```

## 📋 How It Works

1. **User clicks "Send Email" button** on a schedule
2. **Frontend** calls: `apiService.sendScheduleEmail(scheduleId)`
3. **Backend** route: `POST /api/schedules/:scheduleId/send-email`
4. **Backend**:
   - Finds the schedule
   - Gets employee email
   - Gets business name from owner
   - Calls `sendScheduleEmail()` function
   - Updates `lastSentAt` timestamp
   - Returns success/error

## ⚠️ Important Notes

### **Backend Server Must Be Restarted!**
After the merge, the backend server needs to be restarted to load the new `/api/schedules` route:

```bash
cd code/server
npm start
# or
npm run dev
```

### **Employee Must Have Email**
- The employee associated with the schedule must have an `email` field set
- If email is missing, you'll get: "Employee email missing"

### **SMTP Must Be Configured**
- If SMTP is not configured, you'll get: "Email service configuration error"
- Check your `.env` file for `SMTP_USER` and `SMTP_PASS`

## 🧪 Testing

1. **Create a schedule** for an employee
2. **Click "Send Email"** button
3. **Check backend logs** for:
   - `📧 Sending schedule email: ...`
   - `✅ Schedule email sent successfully to: ...`
4. **Check employee's email** inbox for the schedule

## 📧 Email Content

The email includes:
- Business name header
- Employee greeting
- Week date range
- Schedule table (day, date, shift times)
- Notes (if any)
- Important reminders

## 🔍 Troubleshooting

### **404 Error: Route not found**
- **Solution**: Restart backend server

### **401/403 Error: Unauthorized**
- **Solution**: Make sure you're logged in as owner
- Check token is valid (not expired)

### **500 Error: Email configuration error**
- **Solution**: Check `.env` file has SMTP credentials
- Verify SMTP settings are correct

### **Email not received**
- Check spam folder
- Verify employee email is correct
- Check backend logs for SMTP errors
- Verify SMTP credentials are valid

