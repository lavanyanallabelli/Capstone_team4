# AWS RDS PostgreSQL Setup Guide

This guide walks you through setting up PostgreSQL on Amazon RDS and connecting your POS backend application.

## Prerequisites
- AWS account with appropriate permissions
- Access to AWS Console
- Basic knowledge of AWS networking (VPC, Security Groups)

## Step 1: Create RDS PostgreSQL Instance

1. **Navigate to RDS Console**
   - Go to AWS Console → Search "RDS" → Open Amazon RDS

2. **Create Database**
   - Click "Create database" button
   - Select "Standard create" (not Easy create for more control)

3. **Engine Options**
   - **Engine type**: PostgreSQL
   - **Version**: Select latest stable version (e.g., PostgreSQL 15.x or 16.x)
   - **Templates**: 
     - Choose **"Free tier"** for development/testing
     - Or **"Production"** for production workloads

4. **Settings**
   - **DB instance identifier**: `pos-database` (or your preferred name)
   - **Master username**: `postgres` (or your preferred admin username)
   - **Master password**: Create a strong password and **SAVE IT SECURELY**
     - Must be at least 8 characters
     - Include uppercase, lowercase, numbers, and special characters
   - **Confirm password**: Re-enter the password

5. **Instance Configuration**
   - **DB instance class**: 
     - Free tier: `db.t3.micro` or `db.t4g.micro`
     - Production: `db.t3.small`, `db.t3.medium`, or higher based on needs
   - **Storage type**: General Purpose SSD (gp3)
   - **Allocated storage**: 
     - Free tier: 20 GB
     - Production: Adjust based on needs (minimum 20 GB)
   - **Enable storage autoscaling**: Recommended (adjust based on needs)

6. **Connectivity**
   - **Virtual Private Cloud (VPC)**: Select your default VPC or create new
   - **Subnet group**: Use default or create new
   - **Publicly accessible**: 
     - **For development/testing**: Select **Yes** (if your EC2/server needs external access)
     - **For production**: Select **No** (use private subnet for better security)
   - **VPC security group**: 
     - Choose **Create new** security group
     - Name: `pos-rds-security-group`
   - **Availability Zone**: Use default or select specific zone
   - **Database port**: `5432` (default PostgreSQL port)

7. **Database Authentication**
   - **Password authentication**: Select this option
   - (Note: You can enable IAM database authentication later if needed)

8. **Additional Configuration**
   - **Initial database name**: `posdb` (must match `DB_NAME` in your .env)
   - **DB parameter group**: Use default
   - **Backup retention period**: 
     - Free tier: 7 days
     - Production: 7-35 days based on requirements
   - **Backup window**: Use default or set preferred time
   - **Enable encryption**: Recommended for production
   - **Performance Insights**: Optional (useful for monitoring)
   - **Enable Enhanced monitoring**: Optional

9. **Monitoring**
   - **Enable auto minor version upgrade**: Recommended
   - **Enable deletion protection**: Recommended for production

10. **Review and Create**
    - Review all settings
    - Click "Create database"
    - Wait 5-10 minutes for instance to be available

## Step 2: Configure Security Group

After the database is created, configure the security group to allow connections:

1. **Navigate to RDS Instance**
   - In RDS console, click on your database instance
   - Scroll to "Connectivity & security" section
   - Click on the **Security group** link (e.g., `sg-xxxxx`)

2. **Edit Inbound Rules**
   - In Security Group page, click "Edit inbound rules"
   - Click "Add rule"
   - Configure:
     - **Type**: PostgreSQL
     - **Protocol**: TCP
     - **Port**: 5432
     - **Source**: 
       - **For EC2 deployment**: Select "Custom" → Enter your EC2 security group ID
       - **For local development**: Select "My IP" or "0.0.0.0/0" (⚠️ only for testing, not recommended for production)
   - Click "Save rules"

## Step 3: Get Connection Details

1. **Get Endpoint**
   - In RDS console, select your database
   - Find **"Endpoint & port"** in "Connectivity & security"
   - Copy the endpoint (e.g., `pos-database.xxxxx.us-east-1.rds.amazonaws.com`)
   - Port should be `5432`

2. **Note Your Credentials**
   - Username: The master username you set (e.g., `postgres`)
   - Password: The master password you created
   - Database name: `posdb` (or what you set)

## Step 4: Update Environment Variables

Update your `.env` file in `code/server/`:

```env
# PostgreSQL Database Configuration (Amazon RDS)
DB_HOST=your-rds-endpoint.xxxxx.us-east-1.rds.amazonaws.com
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_secure_password_here
DB_NAME=posdb
```

**Important Security Notes:**
- Never commit `.env` file to Git
- Use AWS Secrets Manager or Parameter Store for production
- Rotate passwords regularly

## Step 5: Test Connection Locally (Optional)

Before deploying to EC2, test connection locally:

1. **Install PostgreSQL client** (if not installed):
   ```bash
   # Windows (using Chocolatey)
   choco install postgresql
   
   # Or download from: https://www.postgresql.org/download/windows/
   ```

2. **Test connection**:
   ```bash
   psql -h your-rds-endpoint.xxxxx.us-east-1.rds.amazonaws.com -U postgres -d posdb -p 5432
   ```

3. **Or use pgAdmin**: Download from https://www.pgadmin.org/

## Step 6: Deploy Application

1. **Install dependencies on EC2**:
   ```bash
   cd /path/to/your/app
   npm install
   ```

2. **Update `.env` on EC2** with RDS connection details

3. **Start your application**:
   ```bash
   npm start
   ```

4. **Verify connection**: Check logs for "✅ PostgreSQL connected successfully"

## Step 7: Verify Database Tables

After first run, verify tables are created:

1. **Connect to database**:
   ```bash
   psql -h your-endpoint -U postgres -d posdb
   ```

2. **List tables**:
   ```sql
   \dt
   ```

3. **Expected tables**:
   - owners
   - employees
   - menu_items
   - orders
   - payments
   - settings

## Security Best Practices

### Production Recommendations:

1. **Network Security**:
   - Use private subnets for RDS
   - Only allow connections from application security group
   - Use VPC peering if needed

2. **Access Control**:
   - Don't use master credentials in application
   - Create application-specific database users with limited permissions
   - Use IAM database authentication (advanced)

3. **Encryption**:
   - Enable encryption at rest
   - Enable SSL/TLS for connections (Sequelize supports this)

4. **Backup & Recovery**:
   - Enable automated backups
   - Test restore procedures
   - Consider cross-region backups

5. **Monitoring**:
   - Enable CloudWatch monitoring
   - Set up alerts for:
     - High CPU usage
     - Low storage space
     - Connection errors
     - Failed authentication attempts

## Troubleshooting

### Connection Issues:

1. **"Connection timeout"**:
   - Check security group allows connections from your source IP
   - Verify RDS is publicly accessible (if needed)
   - Check VPC routing tables

2. **"Authentication failed"**:
   - Verify username and password in `.env`
   - Check if password has special characters that need escaping
   - Verify user exists

3. **"Database does not exist"**:
   - Verify `DB_NAME` matches the initial database name
   - Create database manually if needed:
     ```sql
     CREATE DATABASE posdb;
     ```

4. **"Too many connections"**:
   - Check connection pool settings in `config/database.js`
   - Increase `max_connections` in RDS parameter group if needed

### Performance Issues:

1. **Slow queries**:
   - Enable Performance Insights
   - Check slow query log
   - Add appropriate indexes (Sequelize should handle this)

2. **High CPU/Storage**:
   - Upgrade instance class
   - Enable autoscaling
   - Optimize queries

## Connection String Format

For reference, your connection details translate to:
```
postgresql://DB_USER:DB_PASSWORD@DB_HOST:DB_PORT/DB_NAME
```

Example:
```
postgresql://postgres:yourpassword@pos-database.xxxxx.us-east-1.rds.amazonaws.com:5432/posdb
```

## Next Steps After Setup

1. ✅ Verify connection in application logs
2. ✅ Run initial data migration (if needed)
3. ✅ Test CRUD operations
4. ✅ Set up monitoring and alerts
5. ✅ Document backup procedures
6. ✅ Configure Jenkins deployment pipeline (update Jenkinsfile if needed)

## Additional Resources

- [AWS RDS PostgreSQL Documentation](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_PostgreSQL.html)
- [Sequelize Documentation](https://sequelize.org/docs/v6/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

