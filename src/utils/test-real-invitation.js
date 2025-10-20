import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

async function testRealInvitation() {
    console.log('🧪 Testing Real Invitation API...\n');
    
    try {
        // Test the invitation endpoint
        const response = await fetch('http://localhost:3001/api/collaboration/invite', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chatId: 'test-chat-id',
                email: 'damur3211@gmail.com',
                role: 'viewer'
            })
        });
        
        console.log('📊 API Response:');
        console.log('   Status:', response.status);
        console.log('   Status Text:', response.statusText);
        
        const responseText = await response.text();
        console.log('   Response Body:', responseText);
        
        if (response.ok) {
            console.log('\n✅ Invitation API call successful!');
            console.log('📧 Check server logs for email sending details');
            console.log('📬 Check your Gmail inbox for the invitation');
        } else {
            console.log('\n❌ Invitation API call failed');
            console.log('   Error:', responseText);
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.log('\n🔧 Make sure the server is running on port 3001');
    }
}

testRealInvitation().catch(console.error);
