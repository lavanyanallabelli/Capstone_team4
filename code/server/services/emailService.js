const nodemailer = require('nodemailer');

// Create email transporter with support for multiple providers
const createTransporter = () => {
    const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
    const smtpPort = parseInt(process.env.SMTP_PORT) || 587;
    const smtpSecure = process.env.SMTP_SECURE === 'true' || smtpPort === 465;

    // Default config
    const config = {
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure, // true for 465, false for other ports
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        },
        // Add timeout and connection pool settings
        connectionTimeout: 10000, // 10 seconds
        greetingTimeout: 10000,
        socketTimeout: 10000,
        // Ignore TLS errors for some providers
        tls: {
            rejectUnauthorized: false
        }
    };

    // Provider-specific configurations
    // Check SMTP_USER email domain to determine provider (if SMTP_HOST is generic)
    const smtpUser = process.env.SMTP_USER || '';
    const isGmailUser = smtpUser.toLowerCase().includes('@gmail.com');
    const isOutlookUser = smtpUser.toLowerCase().includes('@outlook.com') ||
        smtpUser.toLowerCase().includes('@hotmail.com') ||
        smtpUser.toLowerCase().includes('@live.com');

    // Prioritize Gmail if user email is Gmail
    if (isGmailUser || smtpHost.includes('gmail.com')) {
        // Gmail configuration
        config.host = 'smtp.gmail.com';
        config.port = 587;
        config.secure = false;
        config.requireTLS = true; // Gmail requires TLS
        console.log('📧 Using Gmail SMTP configuration');
        console.log('   User email:', smtpUser ? `${smtpUser.substring(0, 3)}***` : 'NOT SET');
    } else if (isOutlookUser || smtpHost.includes('outlook.com') || smtpHost.includes('hotmail.com') || smtpHost.includes('live.com')) {
        // Outlook/Hotmail configuration
        config.host = 'smtp-mail.outlook.com';
        config.port = 587;
        config.secure = false;
        config.requireTLS = true;
        console.log('📧 Using Outlook/Hotmail SMTP configuration');
        console.log('   User email:', smtpUser ? `${smtpUser.substring(0, 3)}***` : 'NOT SET');
    } else if (smtpHost.includes('yahoo.com')) {
        // Yahoo configuration
        config.host = 'smtp.mail.yahoo.com';
        config.port = 587;
        config.secure = false;
        console.log('📧 Using Yahoo SMTP configuration');
    } else {
        // Generic SMTP configuration
        console.log('📧 Using generic SMTP configuration');
    }

    console.log('📧 Creating email transporter with config:', {
        host: config.host,
        port: config.port,
        secure: config.secure,
        user: config.auth.user ? `${config.auth.user.substring(0, 3)}***` : 'NOT SET'
    });

    return nodemailer.createTransport(config);
};

// Send employee login credentials
const sendEmployeeCredentials = async (employeeEmail, employeeName, tempPassword, businessName, employeeId) => {
    // If SMTP not configured, attempt AWS SES fallback
    const hasSmtp = !!(process.env.SMTP_USER && process.env.SMTP_PASS);
    if (!hasSmtp && (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY)) {
        try {
            const { sendEmail } = require('./sesEmailService');
            const fromEmail = process.env.SES_FROM || process.env.SMTP_USER || 'no-reply@example.com';
            const subject = `Welcome to ${businessName} - Your POS System Login Credentials`;
            const html = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                        <h1 style="color: white; margin: 0; font-size: 24px;">Welcome to ${businessName}!</h1>
                        <p style="color: #e0e0e0; margin: 10px 0 0 0;">Your POS System Access</p>
                    </div>
                    <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                        <h2 style="color: #333; margin-top: 0;">Hello ${employeeName}!</h2>
                        <p style="color: #666; line-height: 1.6;">Your account has been created. Below are your credentials:</p>
                        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
                            <p><strong>Employee ID:</strong> ${employeeId || 'N/A'}</p>
                            <p><strong>Email:</strong> ${employeeEmail}</p>
                            <p><strong>Temporary Password:</strong> ${tempPassword}</p>
                            <p><strong>Login URL:</strong> ${(process.env.FRONTEND_URL || 'http://localhost:3000') + '/employee-login'}</p>
                        </div>
                    </div>
                </div>`;
            await sendEmail(employeeEmail, fromEmail, subject, html);
            return true;
        } catch (sesErr) {
            console.error('❌ SES fallback failed for credentials email:', sesErr.message);
            // Continue to try SMTP below if possible
        }
    }

    if (!hasSmtp) {
        const error = new Error('SMTP configuration missing and SES fallback unavailable. Set SMTP_USER/SMTP_PASS or AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY.');
        console.error('❌ Email configuration error:', error.message);
        throw error;
    }

    try {
        const transporter = createTransporter();

        // Verify connection before sending
        await transporter.verify();
        console.log('✅ SMTP server connection verified');

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

        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Employee credentials email sent successfully!');
        console.log('   📧 To:', employeeEmail);
        console.log('   📨 Message ID:', info.messageId);
        return true;
    } catch (error) {
        console.error('❌ Error sending employee credentials email:');
        console.error('   📧 To:', employeeEmail);
        console.error('   🔴 Error:', error.message);
        if (error.code) {
            console.error('   🔴 Error Code:', error.code);
        }
        if (error.response) {
            console.error('   🔴 SMTP Response:', error.response);
        }
        // Re-throw the error so calling code can handle it
        throw error;
    }
};

// Send employee schedule email
const sendScheduleEmail = async (employeeEmail, employeeName, scheduleData, weekStartDate, businessName, isUpdate = false, notes = null) => {
    const hasSmtp = !!(process.env.SMTP_USER && process.env.SMTP_PASS);
    // If SMTP not configured, attempt AWS SES fallback
    if (!hasSmtp && (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY)) {
        try {
            const { sendEmail } = require('./sesEmailService');
            // Build the same HTML as below by briefly constructing table
            const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
            const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
            const weekStart = new Date(weekStartDate);
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 6);
            const fmt = (d) => d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
            let rows = '';
            days.forEach((day, i) => {
                const entry = scheduleData[day];
                const dd = new Date(weekStart);
                dd.setDate(dd.getDate() + i);
                const dynName = dd.toLocaleDateString('en-US', { weekday: 'long' });
                if (entry && entry.isWorking && entry.start && entry.end) {
                    rows += `<tr><td>${dynName}</td><td>${fmt(dd)}</td><td><strong>${entry.start} - ${entry.end}</strong></td></tr>`;
                } else {
                    rows += `<tr><td>${dynName}</td><td>${fmt(dd)}</td><td><em>Day Off</em></td></tr>`;
                }
            });
            const subject = isUpdate ? `${businessName} - Your Updated Work Schedule` : `${businessName} - Your Work Schedule`;
            const html = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                        <h1 style="color: white; margin: 0; font-size: 24px;">${businessName}</h1>
                        <p style="color: #e0e0e0; margin: 10px 0 0 0;">${isUpdate ? 'Updated Work Schedule' : 'Your Work Schedule'}</p>
                    </div>
                    <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                        <h2 style="color: #333; margin-top: 0;">Hello ${employeeName}!</h2>
                        <p style="color: #666; line-height: 1.6;">Your work schedule for <strong>${fmt(weekStart)} - ${fmt(weekEnd)}</strong>:</p>
                        <table style="width:100%; border-collapse: collapse;">
                            <thead><tr><th align="left">Day</th><th align="left">Date</th><th align="left">Shift</th></tr></thead>
                            <tbody>${rows}</tbody>
                        </table>
                        ${notes ? `<p style="margin-top:10px;"><strong>Notes:</strong> ${notes}</p>` : ''}
                    </div>
                </div>`;
            const fromEmail = process.env.SES_FROM || process.env.SMTP_USER || 'no-reply@example.com';
            await sendEmail(employeeEmail, fromEmail, subject, html);
            return true;
        } catch (sesErr) {
            console.error('❌ SES fallback failed for schedule email:', sesErr.message);
            // Continue to try SMTP below if possible
        }
    }

    if (!hasSmtp) {
        const error = new Error('SMTP configuration missing and SES fallback unavailable. Set SMTP_USER/SMTP_PASS or AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY.');
        console.error('❌ Email configuration error:', error.message);
        throw error;
    }

    try {
        const transporter = createTransporter();

        // Verify connection before sending
        await transporter.verify();
        console.log('✅ SMTP server connection verified');

        // Format week dates
        const weekStart = new Date(weekStartDate);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);

        const formatDate = (date) => {
            return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        };

        // Format schedule table based on selected start date
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        let scheduleTable = '';

        days.forEach((day, index) => {
            const daySchedule = scheduleData[day];
            const dayDate = new Date(weekStart);
            dayDate.setDate(dayDate.getDate() + index);
            const dynamicDayName = dayDate.toLocaleDateString('en-US', { weekday: 'long' });

            if (daySchedule && daySchedule.isWorking && daySchedule.start && daySchedule.end) {
                scheduleTable += `
                    <tr style="background: #e8f5e9; border-bottom: 1px solid #c8e6c9;">
                        <td style="padding: 12px; font-weight: bold; color: #2e7d32;">${dynamicDayName}</td>
                        <td style="padding: 12px; color: #1b5e20;">${formatDate(dayDate)}</td>
                        <td style="padding: 12px; color: #1b5e20;">
                            <strong>${daySchedule.start} - ${daySchedule.end}</strong>
                        </td>
                    </tr>
                `;
            } else {
                scheduleTable += `
                    <tr style="background: #fafafa; border-bottom: 1px solid #e0e0e0;">
                        <td style="padding: 12px; color: #757575;">${dynamicDayName}</td>
                        <td style="padding: 12px; color: #9e9e9e;">${formatDate(dayDate)}</td>
                        <td style="padding: 12px; color: #9e9e9e; font-style: italic;">Day Off</td>
                    </tr>
                `;
            }
        });

        const subject = isUpdate
            ? `${businessName} - Your Updated Work Schedule`
            : `${businessName} - Your Work Schedule`;

        const mailOptions = {
            from: process.env.SMTP_USER,
            to: employeeEmail,
            subject: subject,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                        <h1 style="color: white; margin: 0; font-size: 24px;">${businessName}</h1>
                        <p style="color: #e0e0e0; margin: 10px 0 0 0;">${isUpdate ? 'Updated Work Schedule' : 'Your Work Schedule'}</p>
                    </div>
                    
                    <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                        <h2 style="color: #333; margin-top: 0;">Hello ${employeeName}!</h2>
                        
                        <p style="color: #666; line-height: 1.6;">
                            ${isUpdate
                    ? `Your work schedule for the week of <strong>${formatDate(weekStart)} - ${formatDate(weekEnd)}</strong> has been updated. Please review your new schedule below.`
                    : `Your work schedule for the week of <strong>${formatDate(weekStart)} - ${formatDate(weekEnd)}</strong> has been set. Please review your schedule below.`
                }
                        </p>
                        
                        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
                            <h3 style="color: #333; margin-top: 0; margin-bottom: 15px;">Your Weekly Schedule</h3>
                            <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                                <thead>
                                    <tr style="background: #667eea; color: white;">
                                        <th style="padding: 12px; text-align: left;">Day</th>
                                        <th style="padding: 12px; text-align: left;">Date</th>
                                        <th style="padding: 12px; text-align: left;">Shift</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${scheduleTable}
                                </tbody>
                            </table>
                        </div>

                        ${notes ? `
                            <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2196f3;">
                                <h4 style="color: #1565c0; margin-top: 0;">Additional Notes:</h4>
                                <p style="color: #1565c0; margin: 0; white-space: pre-wrap;">${notes}</p>
                            </div>
                        ` : ''}
                        
                        <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
                            <h4 style="color: #856404; margin-top: 0;">Important Reminders:</h4>
                            <ul style="color: #856404; margin: 0; padding-left: 20px;">
                                <li>Please arrive on time for your scheduled shifts</li>
                                <li>Contact your manager if you need to make any changes</li>
                                <li>If you have any questions, please reach out to management</li>
                            </ul>
                        </div>
                        
                        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                        
                        <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
                            This is an automated message from ${businessName} POS System.<br>
                            Please do not reply to this email. Contact your manager directly for any questions.
                        </p>
                    </div>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Schedule email sent successfully!');
        console.log('   📧 To:', employeeEmail);
        console.log('   📨 Message ID:', info.messageId);
        return true;
    } catch (error) {
        console.error('❌ Error sending schedule email:');
        console.error('   📧 To:', employeeEmail);
        console.error('   🔴 Error:', error.message);
        if (error.code) {
            console.error('   🔴 Error Code:', error.code);
        }
        if (error.response) {
            console.error('   🔴 SMTP Response:', error.response);
        }
        // Re-throw the error so calling code can handle it
        throw error;
    }
};

// Send refund notification to owner when manager processes refund
const sendRefundNotification = async (ownerEmail, ownerName, businessName, refundData) => {
    const { orderNumber, refundAmount, reason, managerName, orderDate, paymentMethod } = refundData;

    const hasSmtp = !!(process.env.SMTP_USER && process.env.SMTP_PASS);
    // If SMTP not configured, attempt AWS SES fallback
    if (!hasSmtp && (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY)) {
        try {
            const { sendEmail } = require('./sesEmailService');
            const fromEmail = process.env.SES_FROM || process.env.SMTP_USER || 'no-reply@example.com';
            const subject = `Refund Processed - Order ${orderNumber}`;
            const html = buildRefundEmailHTML(businessName, refundData);
            await sendEmail(ownerEmail, fromEmail, subject, html);
            return true;
        } catch (sesErr) {
            console.error('❌ SES fallback failed for refund notification email:', sesErr.message);
            // Continue to try SMTP below if possible
        }
    }

    if (!hasSmtp) {
        const error = new Error('SMTP configuration missing and SES fallback unavailable. Set SMTP_USER/SMTP_PASS or AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY.');
        console.error('❌ Email configuration error:', error.message);
        throw error;
    }

    try {
        const transporter = createTransporter();

        // Verify connection before sending
        await transporter.verify();
        console.log('✅ SMTP server connection verified');

        const mailOptions = {
            from: process.env.SMTP_USER,
            to: ownerEmail,
            subject: `Refund Processed - Order ${orderNumber}`,
            html: buildRefundEmailHTML(businessName, refundData)
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Refund notification email sent successfully!');
        console.log('   📧 To:', ownerEmail);
        console.log('   📨 Message ID:', info.messageId);
        return true;
    } catch (error) {
        console.error('❌ Error sending refund notification email:');
        console.error('   📧 To:', ownerEmail);
        console.error('   🔴 Error:', error.message);
        if (error.code) {
            console.error('   🔴 Error Code:', error.code);
        }
        if (error.response) {
            console.error('   🔴 SMTP Response:', error.response);
        }
        // Don't throw error - refund should still succeed even if email fails
        return false;
    }
};

// Helper function to build refund email HTML
const buildRefundEmailHTML = (businessName, refundData) => {
    const { orderNumber, refundAmount, reason, managerName, orderDate, paymentMethod } = refundData;
    const formattedDate = orderDate ? new Date(orderDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }) : 'N/A';
    const formattedAmount = parseFloat(refundAmount).toFixed(2);

    return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 24px;">${businessName}</h1>
                <p style="color: #e0e0e0; margin: 10px 0 0 0;">Refund Notification</p>
            </div>
            
            <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <h2 style="color: #333; margin-top: 0;">Refund Processed</h2>
                
                <p style="color: #666; line-height: 1.6;">
                    A refund has been processed by <strong>${managerName || 'a manager'}</strong> for one of your orders.
                </p>
                
                <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
                    <h3 style="color: #856404; margin-top: 0; margin-bottom: 15px;">Refund Details</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 8px 0; color: #856404; font-weight: bold;">Order Number:</td>
                            <td style="padding: 8px 0; color: #856404;">${orderNumber}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #856404; font-weight: bold;">Refund Amount:</td>
                            <td style="padding: 8px 0; color: #856404; font-size: 18px; font-weight: bold;">$${formattedAmount}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #856404; font-weight: bold;">Payment Method:</td>
                            <td style="padding: 8px 0; color: #856404;">${paymentMethod || 'N/A'}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #856404; font-weight: bold;">Order Date:</td>
                            <td style="padding: 8px 0; color: #856404;">${formattedDate}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #856404; font-weight: bold;">Processed By:</td>
                            <td style="padding: 8px 0; color: #856404;">${managerName || 'Manager'}</td>
                        </tr>
                    </table>
                </div>

                ${reason ? `
                    <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2196f3;">
                        <h4 style="color: #1565c0; margin-top: 0;">Refund Reason:</h4>
                        <p style="color: #1565c0; margin: 0; white-space: pre-wrap;">${reason}</p>
                    </div>
                ` : ''}
                
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #6c757d;">
                    <h4 style="color: #495057; margin-top: 0;">Important:</h4>
                    <ul style="color: #495057; margin: 0; padding-left: 20px;">
                        <li>This refund has been processed and recorded in your system</li>
                        <li>Please verify the refund amount and reason</li>
                        <li>Contact your manager if you have any questions</li>
                    </ul>
                </div>
                
                <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                
                <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
                    This is an automated notification from ${businessName} POS System.<br>
                    Please do not reply to this email.
                </p>
            </div>
        </div>
    `;
};

// Send account reactivation email
const sendReactivationEmail = async (ownerEmail, ownerName, reactivationToken) => {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const reactivationLink = `${frontendUrl}/reactivate-account?token=${reactivationToken}`;

    const hasSmtp = !!(process.env.SMTP_USER && process.env.SMTP_PASS);
    // If SMTP not configured, attempt AWS SES fallback
    if (!hasSmtp && (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY)) {
        try {
            const { sendEmail } = require('./sesEmailService');
            const fromEmail = process.env.SES_FROM || process.env.SMTP_USER || 'no-reply@example.com';
            const subject = 'Reactivate Your Account - POS Pro';
            const html = buildReactivationEmailHTML(ownerName, reactivationLink);
            await sendEmail(ownerEmail, fromEmail, subject, html);
            return true;
        } catch (sesErr) {
            console.error('❌ SES fallback failed for reactivation email:', sesErr.message);
        }
    }

    if (!hasSmtp) {
        const error = new Error('SMTP configuration missing and SES fallback unavailable. Set SMTP_USER/SMTP_PASS or AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY.');
        console.error('❌ Email configuration error:', error.message);
        throw error;
    }

    try {
        const transporter = createTransporter();
        await transporter.verify();
        console.log('✅ SMTP server connection verified');

        const mailOptions = {
            from: process.env.SMTP_USER,
            to: ownerEmail,
            subject: 'Reactivate Your Account - POS Pro',
            html: buildReactivationEmailHTML(ownerName, reactivationLink)
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Reactivation email sent successfully!');
        console.log('   📧 To:', ownerEmail);
        console.log('   📨 Message ID:', info.messageId);
        return true;
    } catch (error) {
        console.error('❌ Error sending reactivation email:');
        console.error('   📧 To:', ownerEmail);
        console.error('   🔴 Error:', error.message);
        throw error;
    }
};

// Helper function to build reactivation email HTML
const buildReactivationEmailHTML = (ownerName, reactivationLink) => {
    return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 24px;">Account Reactivation</h1>
                <p style="color: #e0e0e0; margin: 10px 0 0 0;">POS Pro System</p>
            </div>
            
            <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <h2 style="color: #333; margin-top: 0;">Hello ${ownerName || 'there'}!</h2>
                
                <p style="color: #666; line-height: 1.6;">
                    You requested to reactivate your account. Click the button below to verify your email and reactivate your account.
                </p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${reactivationLink}" 
                       style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                        Reactivate Account
                    </a>
                </div>
                
                <p style="color: #999; font-size: 12px; margin-top: 30px;">
                    If the button doesn't work, copy and paste this link into your browser:<br>
                    <a href="${reactivationLink}" style="color: #667eea; word-break: break-all;">${reactivationLink}</a>
                </p>
                
                <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
                    <p style="color: #856404; margin: 0; font-size: 14px;">
                        <strong>Security Note:</strong> This link will expire in 24 hours. If you didn't request this reactivation, please ignore this email.
                    </p>
                </div>
                
                <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                
                <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
                    This is an automated email from POS Pro System.<br>
                    Please do not reply to this email.
                </p>
            </div>
        </div>
    `;
};

module.exports = {
    sendEmployeeCredentials,
    sendScheduleEmail,
    sendRefundNotification,
    sendReactivationEmail
};
