import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

dotenv.config();

async function testGmailDirectly() {
    console.log('📧 Testing Gmail Configuration Directly...\n');
    
    console.log('📋 Gmail Settings:');
    console.log('   EMAIL_SERVICE:', process.env.EMAIL_SERVICE);
    console.log('   EMAIL_USER:', process.env.EMAIL_USER);
    console.log('   EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? 'Set ✓' : 'Missing ✗');
    console.log('');
    
    try {
        // Create Gmail transporter directly
        const transporter = nodemailer.createTransporter({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            }
        });
        
        console.log('🔗 Testing Gmail connection...');
        await transporter.verify();
        console.log('✅ Gmail connection verified successfully!');
        
        // Send test email
        console.log('\n📤 Sending test email via Gmail...');
        const mailOptions = {
            from: {
                name: 'CitrusLab',
                address: process.env.EMAIL_USER
            },
            to: process.env.EMAIL_USER,
            subject: 'Gmail Test - CitrusLab Invitation',
            html: `
                <h2>🎉 Gmail Email Test Successful!</h2>
                <p>This email was sent via Gmail from your CitrusLab application.</p>
                <p><strong>Test User</strong> invited you to collaborate on <strong>"Test Chat"</strong>.</p>
                <a href="http://localhost:3000/invitation/test-123" style="background: #d7ff2f; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                    Accept Invitation
                </a>
                <p style="margin-top: 20px; color: #666; font-size: 14px;">
                    This is a test email from CitrusLab collaboration system.
                </p>
            `,
            text: 'Test User invited you to collaborate on "Test Chat". Click here to join: http://localhost:3000/invitation/test-123'
        };
        
        const info = await transporter.sendMail(mailOptions);
        
        console.log('✅ Gmail test email sent successfully!');
        console.log('   Message ID:', info.messageId);
        console.log('   Response:', info.response);
        console.log('   Accepted:', info.accepted);
        console.log('   Rejected:', info.rejected);
        
        console.log('\n🎯 CHECK YOUR EMAIL INBOX NOW!');
        console.log('   Look for: "Gmail Test - CitrusLab Invitation"');
        console.log('   Also check spam/junk folder if not in inbox');
        
        return true;
        
    } catch (error) {
        console.error('❌ Gmail test failed:');
        console.error('   Error:', error.message);
        console.error('   Code:', error.code);
        
        if (error.code === 'EAUTH') {
            console.log('\n🔧 Authentication Error Solutions:');
            console.log('   1. Check your Gmail app password is correct');
            console.log('   2. Make sure 2-factor authentication is enabled');
            console.log('   3. Generate new app password: https://myaccount.google.com/apppasswords');
        } else if (error.code === 'ECONNECTION') {
            console.log('\n🔧 Connection Error Solutions:');
            console.log('   1. Check your internet connection');
            console.log('   2. Try again in a few minutes');
        }
        
        return false;
    }
}

testGmailDirectly().catch(console.error);
