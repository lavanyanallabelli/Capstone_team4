# .env File Configuration Guide

## Quick Reference

For your EC2 server at `/home/ec2-user/pos_system/server/.env`, add this complete configuration:

```env
# Server Configuration
PORT=5000
NODE_ENV=production
FRONTEND_URL=http://3.85.243.29:3000

# PostgreSQL Database Configuration (Amazon RDS)
DB_HOST=pos-postgres-db.cktksi2yc05z.us-east-1.rds.amazonaws.com
DB_PORT=5432
DB_USER=pos-postgres-db
DB_PASSWORD=Lavanya03
DB_NAME=posdb

# AWS Configuration (for Cognito only)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key

# AWS Cognito Configuration
AWS_USER_POOL_ID=us-east-1_i2eRulYnD
AWS_USER_POOL_WEB_CLIENT_ID=3q99asqjvgb0eakf80eorms0ho
JWKS_URI=https://cognito-idp.us-east-1.amazonaws.com/us-east-1_i2eRulYnD/.well-known/jwks.json

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=24h

# Email Configuration (Optional - for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

## Required vs Optional Variables

### ✅ **REQUIRED** - Must have for application to work:

1. **Database Configuration** (PostgreSQL):
   - `DB_HOST` - Your RDS endpoint
   - `DB_PORT` - Usually 5432
   - `DB_USER` - Database username
   - `DB_PASSWORD` - Database password
   - `DB_NAME` - Database name (usually `posdb`)

2. **Server Configuration**:
   - `PORT` - Server port (default: 5000)
   - `NODE_ENV` - Environment (production/development)

3. **Cognito Configuration** (for authentication):
   - `AWS_USER_POOL_ID`
   - `AWS_USER_POOL_WEB_CLIENT_ID`
   - `JWKS_URI`

### ⚠️ **OPTIONAL** - Application will work without these:

1. **AWS Credentials** (only if you use Cognito user creation):
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `AWS_REGION`

2. **Email Configuration**:
   - `SMTP_HOST`
   - `SMTP_PORT`
   - `SMTP_USER`
   - `SMTP_PASS`
   - (Required only if you want email notifications for employee credentials)

3. **JWT Secret**:
   - `JWT_SECRET` - Should be set to a secure random string in production

## Your Specific Values (Already Filled)

Based on your setup, these are already configured:

```env
# Database (Your RDS PostgreSQL)
DB_HOST=pos-postgres-db.cktksi2yc05z.us-east-1.rds.amazonaws.com
DB_USER=pos-postgres-db
DB_PASSWORD=Lavanya03
DB_NAME=posdb
DB_PORT=5432

# Cognito (Your existing setup)
AWS_USER_POOL_ID=us-east-1_i2eRulYnD
AWS_USER_POOL_WEB_CLIENT_ID=3q99asqjvgb0eakf80eorms0ho
```

## Variables You Need to Fill In

### 1. AWS Credentials (if using Cognito for user creation)

If your application creates Cognito users, you need AWS credentials:

```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIA...  # Your AWS access key
AWS_SECRET_ACCESS_KEY=... # Your AWS secret key
```

**How to get these:**
- AWS Console → IAM → Users → Your User → Security credentials
- Create access key if you don't have one

### 2. JWT Secret

Generate a secure random string:

**On Linux/Mac:**
```bash
openssl rand -base64 32
```

**On Windows (PowerShell):**
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

Or use any long random string (at least 32 characters).

### 3. Email Configuration (Optional)

Only needed if you want to send emails:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password
```

**Note:** For Gmail, you need to create an "App Password" (not your regular password).

## Minimal Working .env File

If you just want to get started with the minimum required:

```env
# Server
PORT=5000
NODE_ENV=production
FRONTEND_URL=http://3.85.243.29:3000

# Database (REQUIRED)
DB_HOST=pos-postgres-db.cktksi2yc05z.us-east-1.rds.amazonaws.com
DB_PORT=5432
DB_USER=pos-postgres-db
DB_PASSWORD=Lavanya03
DB_NAME=posdb

# Cognito (REQUIRED)
AWS_USER_POOL_ID=us-east-1_i2eRulYnD
AWS_USER_POOL_WEB_CLIENT_ID=3q99asqjvgb0eakf80eorms0ho
JWKS_URI=https://cognito-idp.us-east-1.amazonaws.com/us-east-1_i2eRulYnD/.well-known/jwks.json

# JWT (REQUIRED - generate a secure key)
JWT_SECRET=change_this_to_random_secure_string_at_least_32_chars_long
JWT_EXPIRES_IN=24h
```

## For Local Development

If testing locally, use:

```env
NODE_ENV=development
PORT=8000
FRONTEND_URL=http://localhost:3000

# Same database credentials (or local PostgreSQL if testing)
DB_HOST=pos-postgres-db.cktksi2yc05z.us-east-1.rds.amazonaws.com
DB_PORT=5432
DB_USER=pos-postgres-db
DB_PASSWORD=Lavanya03
DB_NAME=posdb

# Rest same as production
```

## Where to Create the .env File

### Option 1: On EC2 Server (Manual)

SSH into EC2:
```bash
ssh -i your-key.pem ec2-user@3.85.243.29
```

Create/edit the file:
```bash
cd /home/ec2-user/pos_system/server
nano .env
# Paste the configuration above
# Press Ctrl+X, then Y, then Enter to save
```

### Option 2: Via Jenkins (Automatic)

The Jenkinsfile now automatically creates the `.env` file during deployment. Just make sure:

1. ✅ Jenkins credentials are set up (`db_key_id`, `db_user`, `db_password`)
2. ✅ Run a Jenkins build
3. ✅ The `.env` file will be created automatically on EC2

### Option 3: Copy from Template

On your local machine:
```bash
cd code/server
cp .env.example .env
# Edit .env with your values
```

Then upload to EC2 (but Jenkins handles this automatically).

## Verification

After creating `.env`, verify it works:

1. **Check file exists on EC2**:
   ```bash
   cat /home/ec2-user/pos_system/server/.env
   ```

2. **Restart the application**:
   ```bash
   pm2 restart pos-backend
   ```

3. **Check logs**:
   ```bash
   pm2 logs pos-backend
   ```

4. **Look for success message**:
   ```
   ✅ PostgreSQL connected successfully
   ✅ Database models synchronized
   🚀 Server running on http://0.0.0.0:5000
   ```

## Security Reminders

⚠️ **Important:**

1. **Never commit `.env` to Git** - It contains sensitive credentials
2. **Change default passwords** - Especially JWT_SECRET
3. **Use strong passwords** - Database password should be complex
4. **Restrict file permissions** on EC2:
   ```bash
   chmod 600 /home/ec2-user/pos_system/server/.env
   ```

## Troubleshooting

### "Database connection failed"
- Check `DB_HOST` is correct (no typos)
- Verify `DB_PASSWORD` is correct
- Check RDS security group allows connections from EC2

### "JWT verification failed"
- Make sure `JWT_SECRET` is set and matches between instances
- Use the same `JWT_SECRET` across all environments

### "AWS Cognito error"
- Verify `AWS_USER_POOL_ID` and `AWS_USER_POOL_WEB_CLIENT_ID` are correct
- Check AWS credentials if creating users via Cognito

