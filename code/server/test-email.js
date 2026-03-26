/**
 * Quick test script to verify SMTP email configuration
 * Run this with: node test-email.js
 */

require('dotenv').config();
const nodemailer = require('nodemailer');

async function testEmail() {
    console.log('\n📧 Testing Email Configuration...\n');

    // Check if variables are set
    if (!process.env.SMTP_USER) {
        console.error('❌ SMTP_USER is not set in .env file');
        return;
    }

    if (!process.env.SMTP_PASS) {
        console.error('❌ SMTP_PASS is not set in .env file');
        return;
    }

    console.log('✅ Environment variables found:');
    console.log('   Host:', process.env.SMTP_HOST || 'smtp-mail.outlook.com (default)');
    console.log('   Port:', process.env.SMTP_PORT || '587 (default)');
    console.log('   User:', process.env.SMTP_USER);
    console.log('   Password:', process.env.SMTP_PASS ? '***' : 'NOT SET');
    console.log('');

    // Create transporter
    const smtpHost = process.env.SMTP_HOST || 'smtp-mail.outlook.com';
    const smtpPort = parseInt(process.env.SMTP_PORT) || 587;
    
    let config = {
        host: smtpHost.includes('outlook') || smtpHost.includes('hotmail') || smtpHost.includes('live')
            ? 'smtp-mail.outlook.com'
            : smtpHost,
        port: smtpPort,
        secure: false,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        },
        tls: {
            rejectUnauthorized: false
        }
    };

    console.log('📧 Attempting to connect to SMTP server...');
    console.log('   Host:', config.host);
    console.log('   Port:', config.port);
    console.log('');

    try {
        const transporter = nodemailer.createTransporter(config);
        
        // Verify connection
        console.log('🔍 Verifying SMTP connection...');
        await transporter.verify();
        console.log('✅ SMTP server connection verified successfully!\n');
        
        // Send test email
        console.log('📨 Sending test email...');
        const testEmail = process.env.SMTP_USER; // Send to yourself
        const info = await transporter.sendMail({
            from: process.env.SMTP_USER,
            to: testEmail,
            subject: 'POS System - Test Email',
            text: 'This is a test email from your POS system. If you receive this, your email configuration is working correctly!',
            html: '<h2>✅ Email Configuration Test</h2><p>This is a test email from your POS system. If you receive this, your email configuration is working correctly!</p>'
        });

        console.log('✅ Test email sent successfully!');
        console.log('   📧 Sent to:', testEmail);
        console.log('   📨 Message ID:', info.messageId);
        console.log('\n🎉 Email configuration is working correctly!');
        console.log('   Check your inbox (and spam folder) for the test email.\n');
        
    } catch (error) {
        console.error('\n❌ Email test failed:');
        console.error('   Error:', error.message);
        if (error.code) {
            console.error('   Code:', error.code);
        }
        if (error.response) {
            console.error('   SMTP Response:', error.response);
        }
        console.error('\nCommon issues:');
        console.error('   - Wrong email or password');
        console.error('   - Outlook account requires password reset');
        console.error('   - Firewall blocking port 587');
        console.error('   - Check that SMTP_USER and SMTP_PASS are correct in .env file\n');
    }
}

testEmail();

