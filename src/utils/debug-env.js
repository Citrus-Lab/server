import dotenv from 'dotenv';

dotenv.config();

console.log('🔍 Environment Variables Debug:');
console.log('');
console.log('EMAIL_SERVICE:', process.env.EMAIL_SERVICE);
console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? 'Set ✓' : 'Missing ✗');
console.log('SENDGRID_API_KEY:', process.env.SENDGRID_API_KEY ? 'Set ✓' : 'Missing ✗');
console.log('SENDGRID_FROM_EMAIL:', process.env.SENDGRID_FROM_EMAIL);
console.log('');

// Test Gmail condition
const gmailCondition = process.env.EMAIL_SERVICE === 'gmail' && process.env.EMAIL_USER && process.env.EMAIL_PASSWORD;
console.log('Gmail Configuration Check:');
console.log('   EMAIL_SERVICE === "gmail":', process.env.EMAIL_SERVICE === 'gmail');
console.log('   EMAIL_USER exists:', !!process.env.EMAIL_USER);
console.log('   EMAIL_PASSWORD exists:', !!process.env.EMAIL_PASSWORD);
console.log('   Gmail condition result:', gmailCondition);
console.log('');

// Test SendGrid condition
const sendgridCondition = !!process.env.SENDGRID_API_KEY;
console.log('SendGrid Configuration Check:');
console.log('   SENDGRID_API_KEY exists:', sendgridCondition);
console.log('');

if (gmailCondition) {
    console.log('✅ Gmail should be used');
} else if (sendgridCondition) {
    console.log('✅ SendGrid should be used');
} else {
    console.log('❌ No email service configured properly');
}
