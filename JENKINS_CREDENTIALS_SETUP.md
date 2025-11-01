# Jenkins Credentials Setup for PostgreSQL RDS

## Overview
You need to configure Jenkins credentials for your PostgreSQL database connection. The Jenkinsfile expects three credentials:

1. `db_key_id` - Database host (RDS endpoint)
2. `db_user` - Database username
3. `db_password` - Database password

## Your Database Details

Based on the information provided:

- **Endpoint**: `pos-postgres-db.cktksi2yc05z.us-east-1.rds.amazonaws.com`
- **Username**: `pos-postgres-db`
- **Password**: `Lavanya03`
- **Port**: `5432`
- **Database Name**: `posdb`

## Steps to Configure Jenkins Credentials

### Step 1: Access Jenkins Credentials

1. Log in to your Jenkins dashboard
2. Click on **"Manage Jenkins"** (left sidebar)
3. Click on **"Manage Credentials"**
4. Under **"Stores scoped to Jenkins"**, click on **"(global)"**
5. Click **"Add Credentials"**

### Step 2: Create Database Host Credential

1. **Kind**: Select **"Secret text"**
2. **Secret**: Enter your RDS endpoint:
   ```
   pos-postgres-db.cktksi2yc05z.us-east-1.rds.amazonaws.com
   ```
3. **ID**: Enter: `db_key_id`
4. **Description**: `PostgreSQL RDS Endpoint`
5. Click **"OK"**

### Step 3: Create Database Username Credential

1. Click **"Add Credentials"** again
2. **Kind**: Select **"Secret text"**
3. **Secret**: Enter your database username:
   ```
   pos-postgres-db
   ```
4. **ID**: Enter: `db_user`
5. **Description**: `PostgreSQL Database Username`
6. Click **"OK"**

### Step 4: Create Database Password Credential

1. Click **"Add Credentials"** again
2. **Kind**: Select **"Secret text"**
3. **Secret**: Enter your database password:
   ```
   Lavanya03
   ```
4. **ID**: Enter: `db_password`
5. **Description**: `PostgreSQL Database Password`
6. Click **"OK"**

## Verification

After creating all three credentials, verify they exist:

1. Go back to **"Manage Credentials"**
2. Under **"(global)"**, you should see:
   - `db_key_id` (PostgreSQL RDS Endpoint)
   - `db_user` (PostgreSQL Database Username)
   - `db_password` (PostgreSQL Database Password)

## Important Security Notes

⚠️ **Security Recommendations:**

1. **Change Password**: Consider changing your database password to something stronger
2. **Restrict Access**: Ensure your RDS security group only allows connections from your EC2 instance
3. **Rotation**: Plan to rotate credentials periodically
4. **Secrets Manager**: For production, consider using AWS Secrets Manager instead of Jenkins credentials

## Testing the Connection

After deploying via Jenkins, you can test the connection by:

1. **SSH into your EC2 instance**:
   ```bash
   ssh -i your-key.pem ec2-user@3.85.243.29
   ```

2. **Check the .env file**:
   ```bash
   cd /home/ec2-user/pos_system/server
   cat .env
   ```
   Verify that `DB_HOST`, `DB_USER`, and `DB_PASSWORD` are set correctly.

3. **Check application logs**:
   ```bash
   pm2 logs pos-backend
   ```
   Look for: `✅ PostgreSQL connected successfully`

4. **Test database connection manually** (if PostgreSQL client is installed):
   ```bash
   psql -h pos-postgres-db.cktksi2yc05z.us-east-1.rds.amazonaws.com -U pos-postgres-db -d posdb
   ```
   Enter password when prompted: `Lavanya03`

## Troubleshooting

### Issue: "Credential not found"
- **Solution**: Double-check the credential IDs match exactly: `db_key_id`, `db_user`, `db_password`
- Ensure credentials are in the global scope

### Issue: "Authentication failed"
- **Solution**: Verify the username and password are correct
- Check if the password has special characters that need escaping
- Verify the database user exists in RDS

### Issue: "Connection timeout"
- **Solution**: Check RDS security group allows connections from EC2 instance
- Verify the endpoint is correct
- Check VPC and subnet configurations

## Additional Configuration

### If you need to update credentials later:

1. Go to **"Manage Credentials"** → **"(global)"**
2. Click on the credential you want to update
3. Click **"Update"** or **"Delete"** and recreate
4. The next Jenkins build will use the updated credentials

### Alternative: Manual .env file on EC2

If you prefer to set credentials manually on EC2 instead of using Jenkins:

1. SSH into EC2:
   ```bash
   ssh -i your-key.pem ec2-user@3.85.243.29
   ```

2. Create/update `.env` file:
   ```bash
   cd /home/ec2-user/pos_system/server
   nano .env
   ```

3. Add:
   ```env
   DB_HOST=pos-postgres-db.cktksi2yc05z.us-east-1.rds.amazonaws.com
   DB_PORT=5432
   DB_USER=pos-postgres-db
   DB_PASSWORD=Lavanya03
   DB_NAME=posdb
   ```

4. Restart the application:
   ```bash
   pm2 restart pos-backend
   ```

## Next Steps

After setting up credentials:

1. ✅ Verify all three credentials are created in Jenkins
2. ✅ Run a Jenkins build to deploy
3. ✅ Check application logs for successful database connection
4. ✅ Test API endpoints to ensure they work with PostgreSQL

