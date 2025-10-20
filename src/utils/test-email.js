import dotenv from 'dotenv';
import emailService from '../services/email.service.js';

dotenv.config();

async function testEmailService() {
    console.log('🧪 Testing Email Service Configuration...\n');
    
    // Check environment variables
    console.log('📋 Environment Variables:');
    console.log('   SENDGRID_API_KEY:', process.env.SENDGRID_API_KEY ? 'Set ✓' : 'Missing ✗');
    console.log('   SENDGRID_FROM_EMAIL:', process.env.SENDGRID_FROM_EMAIL || 'Not set');
    console.log('   EMAIL_SERVICE:', process.env.EMAIL_SERVICE || 'Not set');
    console.log('   EMAIL_USER:', process.env.EMAIL_USER || 'Not set');
    console.log('   FRONTEND_URL:', process.env.FRONTEND_URL || 'Not set');
    console.log('');
    
    // Wait for email service to initialize
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test email sending
    const testEmail = process.env.SENDGRID_FROM_EMAIL || 'test@example.com';
    
    console.log('📧 Testing email sending...');
    const result = await emailService.sendInvitationEmail({
        to: testEmail,
        inviterName: 'Test User',
        chatTitle: 'Test Chat',
        invitationLink: 'http://localhost:3000/invitation/test-token',
        role: 'viewer'
    });
    
    console.log('\n📊 Test Results:');
    console.log('   Success:', result.success);
    console.log('   Message ID:', result.messageId);
    console.log('   Error:', result.error);
    console.log('   Response Code:', result.responseCode);
    
    if (result.success) {
        console.log('\n✅ Email service is working correctly!');
    } else {
        console.log('\n❌ Email service has issues:');
        console.log('   Error:', result.error);
        console.log('   Original Error:', result.originalError);
        
        // Provide troubleshooting tips
        console.log('\n🔧 Troubleshooting Tips:');
        if (result.code === 'EAUTH' || result.responseCode === 401) {
            console.log('   - Check your SENDGRID_API_KEY is correct');
            console.log('   - Verify the API key has sending permissions');
            console.log('   - Make sure the API key is not expired');
        }
        if (result.responseCode === 403) {
            console.log('   - Check your SendGrid account status');
            console.log('   - Verify your account is not suspended');
            console.log('   - Check if sender verification is required');
        }
        if (!process.env.SENDGRID_FROM_EMAIL) {
            console.log('   - Set SENDGRID_FROM_EMAIL in your .env file');
        }
    }
    
    process.exit(result.success ? 0 : 1);
}

testEmailService().catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
});
