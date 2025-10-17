async function testOpenRouterDirect(req, res) {
    try {
        const { message = "Hello, how are you?" } = req.body;
        
        console.log('=== Direct OpenRouter Test ===');
        console.log('API Key:', process.env.OPENROUTER_API_KEY ? 'EXISTS' : 'MISSING');
        
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'http://localhost:5000',
                'X-Title': 'AI Platform Test'
            },
            body: JSON.stringify({
                model: 'openai/gpt-3.5-turbo',
                messages: [
                    {
                        role: 'user',
                        content: message
                    }
                ],
                max_tokens: 100,
                temperature: 0.7
            })
        });

        console.log('Response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('OpenRouter error:', errorText);
            return res.status(500).json({
                error: `OpenRouter API error: ${response.status}`,
                details: errorText
            });
        }

        const data = await response.json();
        console.log('Response received:', !!data.choices);
        
        res.json({
            success: true,
            message: 'OpenRouter API working!',
            response: data.choices[0].message.content,
            model: 'openai/gpt-3.5-turbo',
            usage: data.usage
        });

    } catch (error) {
        console.error('Direct test error:', error);
        res.status(500).json({
            error: error.message,
            stack: error.stack
        });
    }
}

export { testOpenRouterDirect };