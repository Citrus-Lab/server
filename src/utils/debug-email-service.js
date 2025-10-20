import dotenv from 'dotenv';

dotenv.config();

console.log('🔍 Email Service Configuration Debug:\n');

console.log('Environment Variables:');
console.log('EMAIL_SERVICE:', JSON.stringify(process.env.EMAIL_SERVICE));
console.log('EMAIL_USER:', JSON.stringify(process.env.EMAIL_USER));
console.log('EMAIL_PASSWORD length:', process.env.EMAIL_PASSWORD ? process.env.EMAIL_PASSWORD.length : 'NOT SET');
console.log('SENDGRID_API_KEY length:', process.env.SENDGRID_API_KEY ? process.env.SENDGRID_API_KEY.length : 'NOT SET');
console.log('');

// Test the exact conditions from email service
const emailProvider = process.env.EMAIL_PROVIDER || 'auto';
console.log('Email Provider:', emailProvider);
console.log('');

console.log('Condition Tests:');

// Test Gmail condition
const gmailCondition1 = emailProvider === 'gmail';
const gmailCondition2 = process.env.EMAIL_SERVICE === 'gmail';
const gmailCondition3 = !!process.env.EMAIL_USER;
const gmailCondition4 = !!process.env.EMAIL_PASSWORD;

console.log('Gmail Conditions:');
console.log('  emailProvider === "gmail":', gmailCondition1);
console.log('  EMAIL_SERVICE === "gmail":', gmailCondition2);
console.log('  EMAIL_USER exists:', gmailCondition3);
console.log('  EMAIL_PASSWORD exists:', gmailCondition4);

const gmailFinalCondition = (gmailCondition1 || gmailCondition2) && gmailCondition3 && gmailCondition4;
console.log('  Gmail final condition:', gmailFinalCondition);
console.log('');

// Test SendGrid condition
const sendgridCondition1 = emailProvider === 'sendgrid';
const sendgridCondition2 = emailProvider === 'auto';
const sendgridCondition3 = !!process.env.SENDGRID_API_KEY;

console.log('SendGrid Conditions:');
console.log('  emailProvider === "sendgrid":', sendgridCondition1);
console.log('  emailProvider === "auto":', sendgridCondition2);
console.log('  SENDGRID_API_KEY exists:', sendgridCondition3);

const sendgridFinalCondition = (sendgridCondition1 || sendgridCondition2) && sendgridCondition3;
console.log('  SendGrid final condition:', sendgridFinalCondition);
console.log('');

// Test fallback Gmail condition
const fallbackGmailCondition = gmailCondition3 && gmailCondition4;
console.log('Fallback Gmail condition:', fallbackGmailCondition);
console.log('');

console.log('Decision Logic:');
if (gmailFinalCondition) {
    console.log('✅ Should use Gmail (priority)');
} else if (sendgridFinalCondition) {
    console.log('✅ Should use SendGrid');
} else if (fallbackGmailCondition) {
    console.log('✅ Should use Gmail (fallback)');
} else {
    console.log('❌ Should use console mode');
}
