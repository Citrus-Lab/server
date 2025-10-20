import emailService from '../services/email.service.js';
import dotenv from 'dotenv';

dotenv.config();

async function testServerEmail() {
    console.log('🧪 Testing Server Email Service Directly...\n');
    
    console.log('📋 Email Service Status:');
    console.log('   Initialized:', emailService.initialized);
    console.log('   Current Provider:', emailService.currentProvider);
    console.log('   Has Transporter:', !!emailService.transporter);
    console.log('');
    
    try {
        // Test sending invitation email
        console.log('📧 Sending test invitation email...');
        const result = await emailService.sendInvitationEmail({
            to: 'damur3211@gmail.com',
            inviterName: 'Server Test User',
            chatTitle: 'Server Email Test Chat',
            invitationLink: 'http://localhost:3000/invitation/server-test-456',
            role: 'editor'
        });
        
        console.log('\n📊 Email Service Result:');
        console.log('   Success:', result.success);
        console.log('   Provider Used:', emailService.currentProvider);
        console.log('   Message ID:', result.messageId);
        console.log('   Response:', result.response);
        console.log('   Accepted:', result.accepted);
        console.log('   Rejected:', result.rejected);
        console.log('   Error:', result.error);
        
        if (result.success) {
            console.log('\n🎉 EMAIL SENT SUCCESSFULLY VIA', emailService.currentProvider.toUpperCase() + '!');
            console.log('📬 CHECK YOUR GMAIL INBOX NOW!');
            console.log('   Subject: "Server Test User invited you to collaborate on Server Email Test Chat"');
            console.log('   From: damur3211@gmail.com');
            console.log('   Also check spam/promotions folder');
        } else {
            console.log('\n❌ Email sending failed');
            console.log('   Error:', result.error);
            console.log('   Code:', result.code);
            console.log('   Response Code:', result.responseCode);
        }
        
    } catch (error) {
        console.error('\n❌ Email service error:', error.message);
        console.error('   Stack:', error.stack);
    }
}

testServerEmail().catch(console.error);
