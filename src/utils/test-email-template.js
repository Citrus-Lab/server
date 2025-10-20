import emailService from '../services/email.service.js';

// Test the email template
async function testEmailTemplate() {
  console.log('🧪 Testing Email Template...');
  
  try {
    // Test template generation
    const template = emailService.getInvitationTemplate({
      inviterName: 'Test User',
      chatTitle: 'Test Chat',
      invitationLink: 'http://localhost:3000/invitation/test123',
      role: 'editor'
    });
    
    console.log('✅ Template generated successfully');
    console.log('📄 Template length:', template.length, 'characters');
    
    // Check if template contains our logo reference
    if (template.includes('cid:citruslab-logo')) {
      console.log('✅ Logo reference found in template');
    } else {
      console.log('❌ Logo reference NOT found in template');
    }
    
    // Check if template contains SVG icons
    if (template.includes('<svg')) {
      console.log('✅ SVG icons found in template');
    } else {
      console.log('❌ SVG icons NOT found in template');
    }
    
    // Check if template uses citrus color
    if (template.includes('#c9d900')) {
      console.log('✅ Citrus color theme found in template');
    } else {
      console.log('❌ Citrus color theme NOT found in template');
    }
    
    console.log('\n📧 Email Service Status:');
    console.log('   Initialized:', emailService.initialized);
    console.log('   Provider:', emailService.currentProvider);
    
    // Test connection if possible
    if (emailService.initialized) {
      try {
        await emailService.verifyConnection();
        console.log('✅ Email service connection verified');
      } catch (error) {
        console.log('⚠️  Email service connection failed:', error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Template test failed:', error);
  }
}

// Run the test
testEmailTemplate();
