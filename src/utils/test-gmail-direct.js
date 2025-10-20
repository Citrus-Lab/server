import dotenv from 'dotenv';
import emailService from '../services/email.service.js';

// Force reload environment
dotenv.config({ override: true });

async function testGmailDirect() {
    console.log('🔄 Reloading email service...');
    
    // Reinitialize email service
    emailService.initialized = false;
    emailService.transporter = null;
    emailService.initializeSync();
    
    console.log('\n📧 Testing Gmail after reload...');
    
    const result = await emailService.sendInvitationEmail({
        to: 'damur3211@gmail.com',
        inviterName: 'Gmail Test User',
        chatTitle: 'Gmail Test Chat',
        invitationLink: 'http://localhost:3000/invitation/gmail-test-123',
        role: 'viewer'
    });
    
    console.log('\n📊 Gmail Test Results:');
    console.log('   Success:', result.success);
    console.log('   Provider:', emailService.currentProvider);
    console.log('   Message ID:', result.messageId);
    console.log('   Error:', result.error);
    
    if (result.success) {
        console.log('\n🎉 CHECK YOUR GMAIL INBOX!');
        console.log('   Subject: "Gmail Test User invited you to collaborate on Gmail Test Chat"');
        console.log('   Also check spam folder');
    } else {
        console.log('\n❌ Gmail test failed:', result.error);
    }
}

testGmailDirect().catch(console.error);
