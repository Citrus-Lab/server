import emailService from '../services/email.service.js';
import dotenv from 'dotenv';

dotenv.config();

async function forceEmailReinit() {
    console.log('🔄 Force Reinitializing Email Service...\n');
    
    console.log('Current State:');
    console.log('   Provider:', emailService.currentProvider);
    console.log('   Initialized:', emailService.initialized);
    console.log('');
    
    // Force reinitialize
    console.log('🔧 Forcing reinitialization...');
    emailService.initialized = false;
    emailService.transporter = null;
    emailService.currentProvider = null;
    
    // Reinitialize
    emailService.initializeSync();
    
    console.log('\nNew State:');
    console.log('   Provider:', emailService.currentProvider);
    console.log('   Initialized:', emailService.initialized);
    console.log('   Has Transporter:', !!emailService.transporter);
    console.log('');
    
    // Test email sending
    console.log('📧 Testing email with new configuration...');
    const result = await emailService.sendInvitationEmail({
        to: 'damur3211@gmail.com',
        inviterName: 'Reinitialized Test',
        chatTitle: 'Gmail Reinit Test',
        invitationLink: 'http://localhost:3000/invitation/reinit-test-789',
        role: 'viewer'
    });
    
    console.log('\n📊 Test Result:');
    console.log('   Success:', result.success);
    console.log('   Provider:', emailService.currentProvider);
    console.log('   Message ID:', result.messageId);
    console.log('   Response:', result.response);
    console.log('   Accepted:', result.accepted);
    console.log('   Rejected:', result.rejected);
    console.log('   Error:', result.error);
    
    if (result.success && emailService.currentProvider === 'gmail') {
        console.log('\n🎉 SUCCESS! Gmail is now working!');
        console.log('📬 Check your Gmail inbox for the test email');
    } else if (result.success && emailService.currentProvider !== 'gmail') {
        console.log('\n⚠️  Email sent but not via Gmail');
        console.log('   Provider used:', emailService.currentProvider);
    } else {
        console.log('\n❌ Email sending failed');
        console.log('   Error:', result.error);
    }
}

forceEmailReinit().catch(console.error);
