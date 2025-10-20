import emailService from '../services/email.service.js';

async function sendTestEmail() {
  console.log('📧 Sending test invitation email...');
  
  try {
    const result = await emailService.sendInvitationEmail({
      to: 'test@example.com', // Change this to your email to test
      inviterName: 'Test User',
      chatTitle: 'Sample Collaboration Chat',
      invitationLink: 'http://localhost:3000/invitation/test123',
      role: 'editor'
    });
    
    console.log('📤 Email send result:', result);
    
    if (result.success) {
      console.log('✅ Test email sent successfully!');
      console.log('   Message ID:', result.messageId);
    } else {
      console.log('❌ Test email failed:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Test email error:', error.message);
  }
}

// Uncomment the line below and change the email address to test
// sendTestEmail();

console.log('💡 To test the email:');
console.log('1. Change the email address in this file to your email');
console.log('2. Uncomment the sendTestEmail() call');
console.log('3. Run: node src/utils/send-test-email.js');
