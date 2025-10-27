import { Auth } from 'aws-amplify';
import { USER_ROLES } from './userRoles';

class AuthService {
    // Sign up a new user
    async signUp(email, password, userData, userRole = USER_ROLES.OWNER) {
        try {
            console.log('🔍 SignUp Debug Info:');
            console.log('Email:', email);
            console.log('UserData:', userData);
            console.log('UserRole:', userRole);
            console.log('BusinessId:', this.generateBusinessId());

            const signUpData = {
                username: email,
                password: password,
                attributes: {
                    email: email,
                    'custom:businessName': userData.businessName,
                    'custom:businessType': userData.businessType,
                    'custom:phone': userData.phone,
                    'custom:userRole': userRole,
                    'custom:businessId': this.generateBusinessId()
                }
            };

            console.log('📤 Sending to Cognito:', signUpData);

            const { user } = await Auth.signUp(signUpData);

            console.log('✅ SignUp Success:', user);
            return user;
        } catch (error) {
            console.error('❌ SignUp Error Details:');
            console.error('Error object:', error);
            console.error('Error message:', error.message);
            console.error('Error code:', error.code);
            console.error('Error name:', error.name);
            throw new Error(this.getErrorMessage(error));
        }
    }

    // Confirm sign up with verification code
    async confirmSignUp(email, code) {
        try {
            await Auth.confirmSignUp(email, code);
        } catch (error) {
            throw new Error(this.getErrorMessage(error));
        }
    }

    // Sign in user
    async signIn(email, password) {
        try {
            console.log('🔐 Attempting to sign in with:', { email, passwordLength: password.length });
            const user = await Auth.signIn(email, password);
            console.log('✅ Sign in successful:', user);
            return user;
        } catch (error) {
            console.error('❌ Sign in error details:', {
                code: error.code,
                name: error.name,
                message: error.message,
                originalError: error
            });
            throw new Error(this.getErrorMessage(error));
        }
    }

    // Sign out user
    async signOut() {
        try {
            await Auth.signOut();
        } catch (error) {
            throw new Error(this.getErrorMessage(error));
        }
    }

    // Get current authenticated user
    async getCurrentUser() {
        try {
            const user = await Auth.currentAuthenticatedUser();
            return user;
        } catch (error) {
            return null;
        }
    }

    // Get current session
    async getCurrentSession() {
        try {
            const session = await Auth.currentSession();
            return session;
        } catch (error) {
            return null;
        }
    }

    // Get user attributes
    async getUserAttributes() {
        try {
            const user = await Auth.currentAuthenticatedUser();
            const attributes = await Auth.userAttributes(user);

            // Convert attributes array to object
            const userData = {};
            attributes.forEach(attr => {
                userData[attr.Name] = attr.Value;
            });

            return userData;
        } catch (error) {
            throw new Error(this.getErrorMessage(error));
        }
    }

    // Update user attributes
    async updateUserAttributes(attributes) {
        try {
            const user = await Auth.currentAuthenticatedUser();
            await Auth.updateUserAttributes(user, attributes);
        } catch (error) {
            throw new Error(this.getErrorMessage(error));
        }
    }

    // Update user role (admin function)
    async updateUserRole(userId, newRole) {
        try {
            // This would typically be done through an admin API endpoint
            // For now, we'll update the current user's role
            const user = await Auth.currentAuthenticatedUser();
            await Auth.updateUserAttributes(user, {
                'custom:userRole': newRole
            });
        } catch (error) {
            throw new Error(this.getErrorMessage(error));
        }
    }

    // Change password
    async changePassword(oldPassword, newPassword) {
        try {
            const user = await Auth.currentAuthenticatedUser();
            await Auth.changePassword(user, oldPassword, newPassword);
        } catch (error) {
            throw new Error(this.getErrorMessage(error));
        }
    }

    // Forgot password
    async forgotPassword(email) {
        try {
            console.log('🔍 Forgot Password - Email:', email);
            await Auth.forgotPassword(email);
            console.log('✅ Forgot Password - Success');
        } catch (error) {
            console.error('❌ Forgot Password - Error:', error);
            throw new Error(this.getErrorMessage(error));
        }
    }

    // Confirm forgot password
    async forgotPasswordSubmit(email, code, newPassword) {
        try {
            console.log('🔍 Confirm Forgot Password - Email:', email);
            await Auth.forgotPasswordSubmit(email, code, newPassword);
            console.log('✅ Confirm Forgot Password - Success');
        } catch (error) {
            console.error('❌ Confirm Forgot Password - Error:', error);
            throw new Error(this.getErrorMessage(error));
        }
    }

    // Resend confirmation code
    async resendSignUp(email) {
        try {
            await Auth.resendSignUp(email);
        } catch (error) {
            throw new Error(this.getErrorMessage(error));
        }
    }

    // Generate unique business ID
    generateBusinessId() {
        return 'biz_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    }

    // Get user role from attributes
    getUserRole(attributes) {
        return attributes['custom:userRole'] || USER_ROLES.CASHIER;
    }

    // Get business ID from attributes
    getBusinessId(attributes) {
        return attributes['custom:businessId'];
    }

    // Get business name from attributes
    getBusinessName(attributes) {
        return attributes['custom:businessName'];
    }

    // Get business type from attributes
    getBusinessType(attributes) {
        return attributes['custom:businessType'];
    }

    // Get phone from attributes
    getPhone(attributes) {
        return attributes['custom:phone'];
    }

    // Error message handler
    getErrorMessage(error) {
        switch (error.code) {
            case 'UserNotFoundException':
                return 'User not found. Please check your email address.';
            case 'NotAuthorizedException':
                return 'Incorrect email or password.';
            case 'UserNotConfirmedException':
                return 'Please confirm your email address before signing in.';
            case 'UsernameExistsException':
                return 'An account with this email already exists.';
            case 'InvalidPasswordException':
                return 'Password must be at least 8 characters long and contain uppercase, lowercase, numbers, and special characters.';
            case 'InvalidParameterException':
                return 'Invalid email format.';
            case 'CodeMismatchException':
                return 'Invalid verification code.';
            case 'ExpiredCodeException':
                return 'Verification code has expired.';
            case 'LimitExceededException':
                return 'Too many attempts. Please try again later.';
            default:
                return error.message || 'An error occurred. Please try again.';
        }
    }
}

const authServiceInstance = new AuthService();
export default authServiceInstance;
