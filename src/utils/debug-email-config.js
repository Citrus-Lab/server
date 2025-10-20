import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('🔍 Email Configuration Debug:\n');

console.log('Raw Environment Variables:');
console.log('EMAIL_SERVICE =', JSON.stringify(process.env.EMAIL_SERVICE));
console.log('EMAIL_USER =', JSON.stringify(process.env.EMAIL_USER));
console.log('EMAIL_PASSWORD =', process.env.EMAIL_PASSWORD ? 'SET (length: ' + process.env.EMAIL_PASSWORD.length + ')' : 'NOT SET');
console.log('SENDGRID_API_KEY =', process.env.SENDGRID_API_KEY ? 'SET (length: ' + process.env.SENDGRID_API_KEY.length + ')' : 'NOT SET');
console.log('SENDGRID_FROM_EMAIL =', JSON.stringify(process.env.SENDGRID_FROM_EMAIL));
console.log('');

console.log('Condition Checks:');
console.log('EMAIL_SERVICE === "gmail":', process.env.EMAIL_SERVICE === 'gmail');
console.log('EMAIL_USER exists:', !!process.env.EMAIL_USER);
console.log('EMAIL_PASSWORD exists:', !!process.env.EMAIL_PASSWORD);
console.log('SENDGRID_API_KEY exists:', !!process.env.SENDGRID_API_KEY);
console.log('');

const gmailCondition = process.env.EMAIL_SERVICE === 'gmail' && process.env.EMAIL_USER && process.env.EMAIL_PASSWORD;
const sendgridCondition = !!process.env.SENDGRID_API_KEY;

console.log('Final Conditions:');
console.log('Gmail condition result:', gmailCondition);
console.log('SendGrid condition result:', sendgridCondition);
console.log('');

if (gmailCondition) {
    console.log('✅ Gmail should be used');
} else if (sendgridCondition) {
    console.log('✅ SendGrid should be used');
} else {
    console.log('❌ No email service should be configured');
}

// Test the exact logic from email service
const emailProvider = process.env.EMAIL_PROVIDER || 'auto';
console.log('\nEmail Service Logic Test:');
console.log('EMAIL_PROVIDER:', emailProvider);

if ((emailProvider === 'gmail' || process.env.EMAIL_SERVICE === 'gmail') && 
    process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
    console.log('✅ Would use Gmail');
} else if ((emailProvider === 'sendgrid' || emailProvider === 'auto') && process.env.SENDGRID_API_KEY) {
    console.log('✅ Would use SendGrid');
} else if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
    console.log('✅ Would use Gmail (fallback)');
} else {
    console.log('❌ Would use console mode');
}
