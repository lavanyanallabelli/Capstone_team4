# AWS Environment Variables Setup Guide

## Required Environment Variables

Your React app needs these environment variables to work with AWS Cognito:

### 1. Create `.env` file in `code/client/` directory:

```bash
# AWS Cognito Configuration
REACT_APP_AWS_REGION=us-east-1
REACT_APP_USER_POOL_ID=us-east-1_XXXXXXXXX
REACT_APP_USER_POOL_WEB_CLIENT_ID=your-client-id
REACT_APP_USER_POOL_WEB_CLIENT_SECRET=your-client-secret
REACT_APP_OAUTH_DOMAIN=your-domain.auth.us-east-1.amazoncognito.com

# API Configuration
REACT_APP_API_ENDPOINT=http://localhost:5000/api
REACT_APP_API_URL=http://localhost:5000

# Redirect URLs (update these for production)
REACT_APP_REDIRECT_SIGN_IN=http://localhost:3000/
REACT_APP_REDIRECT_SIGN_OUT=http://localhost:3000/
```

## How to Add Environment Variables in AWS

### Option 1: AWS Amplify Console (Recommended)

1. **Go to AWS Amplify Console**
   - Navigate to your app in AWS Amplify
   - Go to "Environment variables" section

2. **Add Variables**
   - Click "Manage variables"
   - Add each environment variable:
     - `REACT_APP_AWS_REGION` = `us-east-1`
     - `REACT_APP_USER_POOL_ID` = `your-actual-user-pool-id`
     - `REACT_APP_USER_POOL_WEB_CLIENT_ID` = `your-actual-client-id`
     - `REACT_APP_OAUTH_DOMAIN` = `your-domain.auth.us-east-1.amazoncognito.com`
     - `REACT_APP_API_ENDPOINT` = `https://your-api-gateway-url.amazonaws.com/prod`

3. **Save and Redeploy**
   - Save the variables
   - Trigger a new deployment

### Option 2: AWS EC2 Instance

1. **SSH into your EC2 instance**
2. **Create .env file**:
   ```bash
   cd /var/www/html
   sudo nano .env
   ```

3. **Add the environment variables**:
   ```bash
   REACT_APP_AWS_REGION=us-east-1
   REACT_APP_USER_POOL_ID=your-actual-user-pool-id
   REACT_APP_USER_POOL_WEB_CLIENT_ID=your-actual-client-id
   REACT_APP_OAUTH_DOMAIN=your-domain.auth.us-east-1.amazoncognito.com
   REACT_APP_API_ENDPOINT=https://your-api-gateway-url.amazonaws.com/prod
   ```

4. **Restart your application**

### Option 3: Jenkins Pipeline

1. **Add to Jenkinsfile.qa.ec2**:
   ```groovy
   environment {
       REACT_APP_AWS_REGION = 'us-east-1'
       REACT_APP_USER_POOL_ID = 'your-actual-user-pool-id'
       REACT_APP_USER_POOL_WEB_CLIENT_ID = 'your-actual-client-id'
       REACT_APP_OAUTH_DOMAIN = 'your-domain.auth.us-east-1.amazoncognito.com'
       REACT_APP_API_ENDPOINT = 'https://your-api-gateway-url.amazonaws.com/prod'
   }
   ```

2. **Or use Jenkins Credentials**:
   - Store sensitive values in Jenkins Credentials
   - Reference them in the pipeline

## Getting Your AWS Cognito Values

1. **Go to AWS Cognito Console**
2. **Select your User Pool**
3. **Copy the values**:
   - User Pool ID: `us-east-1_XXXXXXXXX`
   - App Client ID: `your-client-id`
   - Domain: `your-domain.auth.us-east-1.amazoncognito.com`

## Production URLs

For production, update these URLs:
- `REACT_APP_REDIRECT_SIGN_IN` = `https://your-domain.com/`
- `REACT_APP_REDIRECT_SIGN_OUT` = `https://your-domain.com/`
- `REACT_APP_API_ENDPOINT` = `https://your-api-gateway-url.amazonaws.com/prod`

## Testing

After setting up the environment variables:
1. Restart your development server
2. Check browser console for "✅ All required environment variables are present"
3. Test authentication flow
