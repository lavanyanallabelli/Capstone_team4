import { Amplify } from 'aws-amplify';

// AWS Cognito Configuration
// Replace these values with your actual AWS Cognito User Pool configuration
const awsConfig = {
    Auth: {
        region: process.env.REACT_APP_AWS_REGION || 'us-east-1',
        userPoolId: process.env.REACT_APP_USER_POOL_ID || 'us-east-1_XXXXXXXXX',
        userPoolWebClientId: process.env.REACT_APP_USER_POOL_WEB_CLIENT_ID || 'your-client-id',
        ...(process.env.REACT_APP_USER_POOL_WEB_CLIENT_SECRET && {
            userPoolWebClientSecret: process.env.REACT_APP_USER_POOL_WEB_CLIENT_SECRET
        }),
        mandatorySignIn: true,
        authenticationFlowType: 'USER_SRP_AUTH',
        oauth: {
            domain: process.env.REACT_APP_OAUTH_DOMAIN || 'your-domain.auth.us-east-1.amazoncognito.com',
            scope: ['email', 'openid', 'profile'],
            redirectSignIn: process.env.REACT_APP_REDIRECT_SIGN_IN || 'http://localhost:3000/',
            redirectSignOut: process.env.REACT_APP_REDIRECT_SIGN_OUT || 'http://localhost:3000/',
            responseType: 'code'
        }
    },
    API: {
        endpoints: [
            {
                name: 'pos-api',
                endpoint: process.env.REACT_APP_API_ENDPOINT || 'https://your-api-gateway-url.amazonaws.com/prod',
                region: process.env.REACT_APP_AWS_REGION || 'us-east-1'
            }
        ]
    }
};

// Configure Amplify
console.log('🔧 AWS Amplify Configuration:', {
    region: awsConfig.Auth.region,
    userPoolId: awsConfig.Auth.userPoolId,
    userPoolWebClientId: awsConfig.Auth.userPoolWebClientId,
    oauthDomain: awsConfig.Auth.oauth.domain,
    apiEndpoint: awsConfig.API.endpoints[0].endpoint
});

// Check for missing environment variables
const missingVars = [];
if (!process.env.REACT_APP_AWS_REGION) missingVars.push('REACT_APP_AWS_REGION');
if (!process.env.REACT_APP_USER_POOL_ID) missingVars.push('REACT_APP_USER_POOL_ID');
if (!process.env.REACT_APP_USER_POOL_WEB_CLIENT_ID) missingVars.push('REACT_APP_USER_POOL_WEB_CLIENT_ID');

if (missingVars.length > 0) {
    console.error('❌ Missing environment variables:', missingVars);
    console.error('Please check your .env file or environment configuration');
} else {
    console.log('✅ All required environment variables are present');
}

Amplify.configure(awsConfig);
console.log('✅ AWS Amplify configured successfully');

export default awsConfig;
