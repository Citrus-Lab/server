import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

async function checkSendGridStatus() {
    console.log('🔍 Checking SendGrid Account Status...\n');
    
    const apiKey = process.env.SENDGRID_API_KEY;
    const fromEmail = process.env.SENDGRID_FROM_EMAIL;
    
    if (!apiKey) {
        console.log('❌ SENDGRID_API_KEY not found in environment');
        return;
    }
    
    console.log('📧 From Email:', fromEmail);
    console.log('🔑 API Key:', apiKey.substring(0, 10) + '...' + apiKey.substring(apiKey.length - 5));
    console.log('');
    
    try {
        // Check API key validity
        console.log('1️⃣ Testing API Key...');
        const response = await fetch('https://api.sendgrid.com/v3/user/account', {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const account = await response.json();
            console.log('✅ API Key is valid');
            console.log('   Account Type:', account.type);
            console.log('   Account Email:', account.email);
        } else {
            console.log('❌ API Key is invalid');
            console.log('   Status:', response.status);
            console.log('   Response:', await response.text());
            return;
        }
        
        // Check sender verification
        console.log('\n2️⃣ Checking Sender Verification...');
        const senderResponse = await fetch('https://api.sendgrid.com/v3/verified_senders', {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (senderResponse.ok) {
            const senders = await senderResponse.json();
            console.log('📋 Verified Senders:');
            
            if (senders.results && senders.results.length > 0) {
                senders.results.forEach(sender => {
                    console.log(`   ${sender.from_email} - ${sender.verified ? '✅ Verified' : '❌ Not Verified'}`);
                });
                
                const isFromEmailVerified = senders.results.some(
                    sender => sender.from_email === fromEmail && sender.verified
                );
                
                if (isFromEmailVerified) {
                    console.log('✅ Your FROM email is verified');
                } else {
                    console.log('❌ Your FROM email is NOT verified');
                    console.log('   Please verify', fromEmail, 'in SendGrid dashboard');
                }
            } else {
                console.log('❌ No verified senders found');
            }
        }
        
        // Check domain authentication
        console.log('\n3️⃣ Checking Domain Authentication...');
        const domainResponse = await fetch('https://api.sendgrid.com/v3/whitelabel/domains', {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (domainResponse.ok) {
            const domains = await domainResponse.json();
            if (domains.length > 0) {
                console.log('📋 Authenticated Domains:');
                domains.forEach(domain => {
                    console.log(`   ${domain.domain} - ${domain.valid ? '✅ Valid' : '❌ Invalid'}`);
                });
            } else {
                console.log('⚠️  No domain authentication set up');
                console.log('   Consider setting up domain authentication for better deliverability');
            }
        }
        
        // Check recent activity
        console.log('\n4️⃣ Checking Recent Email Activity...');
        const statsResponse = await fetch('https://api.sendgrid.com/v3/stats?start_date=2024-10-13', {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (statsResponse.ok) {
            const stats = await statsResponse.json();
            console.log('📊 Recent Stats:', JSON.stringify(stats, null, 2));
        }
        
    } catch (error) {
        console.error('❌ Error checking SendGrid:', error.message);
    }
}

checkSendGridStatus().catch(console.error);
