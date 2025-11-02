const nodemailer = require('nodemailer');

// Create email transporter
const createTransporter = () => {
    return nodemailer.createTransporter({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: process.env.SMTP_PORT || 587,
        secure: false,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });
};

// Send employee login credentials
const sendEmployeeCredentials = async (employeeEmail, employeeName, tempPassword, businessName, employeeId) => {
    try {
        const transporter = createTransporter();

        const mailOptions = {
            from: process.env.SMTP_USER,
            to: employeeEmail,
            subject: `Welcome to ${businessName} - Your POS System Login Credentials`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                        <h1 style="color: white; margin: 0; font-size: 24px;">Welcome to ${businessName}!</h1>
                        <p style="color: #e0e0e0; margin: 10px 0 0 0;">Your POS System Access</p>
                    </div>
                    
                    <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                        <h2 style="color: #333; margin-top: 0;">Hello ${employeeName}!</h2>
                        
                        <p style="color: #666; line-height: 1.6;">
                            Your account has been created for the ${businessName} POS system. 
                            You can now access the system using the credentials below:
                        </p>
                        
                        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
                            <h3 style="color: #333; margin-top: 0;">Login Credentials</h3>
                            <p style="margin: 5px 0;"><strong>Employee ID:</strong> <code style="background: #e9ecef; padding: 4px 8px; border-radius: 4px; font-family: monospace; font-size: 16px; font-weight: bold; color: #667eea;">${employeeId || 'N/A'}</code></p>
                            <p style="margin: 5px 0;"><strong>Email:</strong> ${employeeEmail}</p>
                            <p style="margin: 5px 0;"><strong>Temporary Password:</strong> <code style="background: #e9ecef; padding: 2px 6px; border-radius: 4px; font-family: monospace;">${tempPassword}</code></p>
                            <p style="margin: 5px 0;"><strong>Login URL:</strong> <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/employee-login" style="color: #667eea;">${process.env.FRONTEND_URL || 'http://localhost:3000'}/employee-login</a></p>
                        </div>
                        <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2196f3;">
                            <h4 style="color: #1565c0; margin-top: 0;">How to Login:</h4>
                            <ol style="color: #1565c0; margin: 0; padding-left: 20px;">
                                <li>Go to the Login URL above</li>
                                <li>Enter your <strong>Employee ID: ${employeeId || 'N/A'}</strong></li>
                                <li>Enter your <strong>Temporary Password</strong></li>
                                <li>Click "Login" to access the POS system</li>
                            </ol>
                        </div>
                        
                        <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
                            <h4 style="color: #856404; margin-top: 0;">Important Security Notes:</h4>
                            <ul style="color: #856404; margin: 0; padding-left: 20px;">
                                <li>Please change your password after first login</li>
                                <li>Keep your login credentials secure</li>
                                <li>Contact your manager if you have any issues</li>
                            </ul>
                        </div>
                        
                        <div style="text-align: center; margin-top: 30px;">
                            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/employee-login" 
                               style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                                Access POS System
                            </a>
                        </div>
                        
                        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                        
                        <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
                            This is an automated message from ${businessName} POS System.<br>
                            Please do not reply to this email.
                        </p>
                    </div>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log('✅ Employee credentials email sent to:', employeeEmail);
        return true;
    } catch (error) {
        console.error('❌ Error sending employee credentials email:', error);
        return false;
    }
};

module.exports = {
    sendEmployeeCredentials
};
