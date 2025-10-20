import dotenv from 'dotenv';
import emailService from '../services/email.service.js';

dotenv.config();

async function testRealEmail() {
    console.log('🔧 Testing Real Email Delivery...\n');
    
    // Test with a real invitation
    const testResult = await emailService.sendInvitationEmail({
        to: 'damur3211@gmail.com', // Your email
        inviterName: 'Test User',
        chatTitle: 'Email Test Chat',
        invitationLink: 'http://localhost:3000/invitation/test-123',
        role: 'viewer'
    });
    
    console.log('📊 Real Test Results:');
    console.log('   Success:', testResult.success);
    console.log('   Message ID:', testResult.messageId);
    console.log('   Error:', testResult.error);
    console.log('   Response Code:', testResult.responseCode);
    console.log('   Accepted:', testResult.accepted);
    console.log('   Rejected:', testResult.rejected);
    
    if (testResult.success) {
        console.log('\n✅ Check your email inbox for the invitation!');
        console.log('   Also check spam/junk folder');
    } else {
        console.log('\n❌ Email failed to send');
        console.log('   Reason:', testResult.error);
        
        // Provide specific solutions
        if (testResult.responseCode === 401) {
            console.log('\n🔧 Solution: Invalid API Key');
            console.log('   1. Check your SendGrid API key');
            console.log('   2. Make sure it has "Mail Send" permissions');
        } else if (testResult.responseCode === 403) {
            console.log('\n🔧 Solution: Account Access Issues');
            console.log('   1. Verify your SendGrid account is active');
            console.log('   2. Check if account is suspended');
            console.log('   3. Verify sender email in SendGrid dashboard');
        } else {
            console.log('\n🔧 Alternative Solution: Use Gmail');
            console.log('   1. Generate Gmail App Password: https://myaccount.google.com/apppasswords');
            console.log('   2. Update .env with EMAIL_SERVICE=gmail');
            console.log('   3. Set EMAIL_USER and EMAIL_PASSWORD');
        }
    }
}

testRealEmail().catch(console.error);
