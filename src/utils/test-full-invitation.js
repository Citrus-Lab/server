import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

async function testFullInvitation() {
    console.log('🧪 Testing Full Invitation Flow...\n');
    
    try {
        // First create a chat
        console.log('1️⃣ Creating a test chat...');
        const chatResponse = await fetch('http://localhost:3001/api/chats', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                title: 'Email Test Chat',
                userId: 'test-user-123'
            })
        });
        
        if (!chatResponse.ok) {
            throw new Error(`Failed to create chat: ${chatResponse.status}`);
        }
        
        const chat = await chatResponse.json();
        console.log('✅ Chat created:', chat.chat._id);
        
        // Now send invitation
        console.log('\n2️⃣ Sending invitation...');
        const inviteResponse = await fetch('http://localhost:3001/api/collaboration/invite', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chatId: chat.chat._id,
                email: 'damur3211@gmail.com',
                role: 'viewer',
                userId: 'test-user-123'
            })
        });
        
        console.log('📊 Invitation Response:');
        console.log('   Status:', inviteResponse.status);
        console.log('   Status Text:', inviteResponse.statusText);
        
        const inviteResult = await inviteResponse.text();
        console.log('   Response:', inviteResult);
        
        if (inviteResponse.ok) {
            console.log('\n✅ Invitation sent successfully!');
            console.log('📧 Check server console for email sending logs');
            console.log('📬 Check Gmail inbox for invitation email');
        } else {
            console.log('\n❌ Invitation failed');
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testFullInvitation().catch(console.error);
