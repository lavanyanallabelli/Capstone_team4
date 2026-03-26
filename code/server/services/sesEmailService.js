const AWS = require('aws-sdk');

// Configure AWS SES
const ses = new AWS.SES({
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

/**
 * Send email using AWS SES
 * @param {string} to - Recipient email address
 * @param {string} from - Sender email address (must be verified in SES)
 * @param {string} subject - Email subject
 * @param {string} htmlBody - HTML email body
 * @param {string} textBody - Plain text email body (optional)
 * @returns {Promise<boolean>} - Returns true if successful
 */
const sendEmail = async (to, from, subject, htmlBody, textBody = null) => {
    try {
        // Validate required fields
        if (!to || !from || !subject || !htmlBody) {
            throw new Error('Missing required email fields: to, from, subject, or htmlBody');
        }

        // Validate AWS credentials
        if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
            throw new Error('AWS credentials not configured. Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in .env file');
        }

        // Prepare email parameters
        const params = {
            Source: from,
            Destination: {
                ToAddresses: [to]
            },
            Message: {
                Subject: {
                    Data: subject,
                    Charset: 'UTF-8'
                },
                Body: {
                    Html: {
                        Data: htmlBody,
                        Charset: 'UTF-8'
                    }
                }
            }
        };

        // Add text body if provided
        if (textBody) {
            params.Message.Body.Text = {
                Data: textBody,
                Charset: 'UTF-8'
            };
        }

        // Send email via SES
        const result = await ses.sendEmail(params).promise();
        
        console.log('✅ Email sent successfully via AWS SES!');
        console.log('   📧 MessageId:', result.MessageId);
        console.log('   📨 To:', to);
        console.log('   📤 From:', from);
        
        return true;
    } catch (error) {
        console.error('❌ Error sending email via AWS SES:');
        console.error('   📧 To:', to);
        console.error('   📤 From:', from);
        console.error('   🔴 Error:', error.message);
        
        if (error.code === 'MessageRejected') {
            console.error('   ⚠️  The email address may not be verified in SES');
        }
        
        throw error;
    }
};

/**
 * Send email with reply-to address
 * @param {string} to - Recipient email address
 * @param {string} from - Sender email address
 * @param {string} replyTo - Reply-to email address
 * @param {string} subject - Email subject
 * @param {string} htmlBody - HTML email body
 * @param {string} textBody - Plain text email body (optional)
 * @returns {Promise<boolean>} - Returns true if successful
 */
const sendEmailWithReplyTo = async (to, from, replyTo, subject, htmlBody, textBody = null) => {
    try {
        const params = {
            Source: from,
            Destination: {
                ToAddresses: [to]
            },
            ReplyToAddresses: [replyTo],
            Message: {
                Subject: {
                    Data: subject,
                    Charset: 'UTF-8'
                },
                Body: {
                    Html: {
                        Data: htmlBody,
                        Charset: 'UTF-8'
                    }
                }
            }
        };

        if (textBody) {
            params.Message.Body.Text = {
                Data: textBody,
                Charset: 'UTF-8'
            };
        }

        const result = await ses.sendEmail(params).promise();
        
        console.log('✅ Email sent successfully via AWS SES!');
        console.log('   📧 MessageId:', result.MessageId);
        console.log('   📨 To:', to);
        console.log('   📤 From:', from);
        console.log('   📬 Reply-To:', replyTo);
        
        return true;
    } catch (error) {
        console.error('❌ Error sending email via AWS SES:', error.message);
        throw error;
    }
};

module.exports = {
    sendEmail,
    sendEmailWithReplyTo,
    ses // Export SES instance for direct use if needed
};

