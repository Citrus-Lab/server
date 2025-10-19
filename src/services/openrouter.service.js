// Node.js 18+ has built-in fetch

class OpenRouterService {
    constructor() {
        this.baseURL = 'https://openrouter.ai/api/v1';
        
        // Available models with their strengths (OpenRouter supported)
        this.models = {
            'openai/gpt-4o': {
                name: 'GPT-4o',
                strengths: ['reasoning', 'analysis', 'multimodal', 'general'],
                cost: 'high'
            },
            'openai/gpt-3.5-turbo': {
                name: 'GPT-3.5 Turbo',
                strengths: ['general', 'fast', 'coding'],
                cost: 'low'
            },
            'anthropic/claude-3.5-sonnet': {
                name: 'Claude 3.5 Sonnet',
                strengths: ['reasoning', 'analysis', 'writing', 'coding'],
                cost: 'medium'
            },
            'anthropic/claude-3-haiku': {
                name: 'Claude 3 Haiku',
                strengths: ['fast', 'efficient', 'concise'],
                cost: 'low'
            },
            'google/gemini-pro-1.5': {
                name: 'Gemini Pro 1.5',
                strengths: ['multimodal', 'reasoning', 'creative'],
                cost: 'medium'
            },
            'meta-llama/llama-3-70b-instruct': {
                name: 'Llama 3 70B',
                strengths: ['reasoning', 'general', 'open-source'],
                cost: 'medium'
            },
            'openai/gpt-4-turbo': {
                name: 'GPT-4 Turbo',
                strengths: ['reasoning', 'speed', 'efficiency'],
                cost: 'medium'
            },
            'meta-llama/llama-3-8b-instruct:free': {
                name: 'Llama 3 8B (Free)',
                strengths: ['general', 'free', 'open-source'],
                cost: 'free'
            },
            'mistralai/mistral-7b-instruct:free': {
                name: 'Mistral 7B (Free)',
                strengths: ['fast', 'free', 'european'],
                cost: 'free'
            }
        };
    }

    async selectBestModel(message) {
        try {
            const messageType = this.analyzeMessageType(message);
            
            // Simple routing logic based on message content
            switch (messageType) {
                case 'coding':
                    return 'anthropic/claude-3.5-sonnet';
                case 'search':
                case 'current-events':
                    return 'meta-llama/llama-3-70b-instruct';
                case 'creative-writing':
                    return 'google/gemini-pro-1.5';
                case 'analysis':
                    return 'openai/gpt-4o';
                case 'quick-question':
                    return 'meta-llama/llama-3-8b-instruct:free'; // Use free model for quick questions
                default:
                    return 'meta-llama/llama-3-8b-instruct:free'; // Default to free model
            }
        } catch (error) {
            console.error('Error selecting model:', error);
            return 'openai/gpt-3.5-turbo'; // Safe fallback
        }
    }

    analyzeMessageType(message) {
        const lowerMessage = message.toLowerCase();
        
        // Coding keywords
        if (lowerMessage.includes('code') || lowerMessage.includes('function') || 
            lowerMessage.includes('debug') || lowerMessage.includes('programming') ||
            lowerMessage.includes('javascript') || lowerMessage.includes('python') ||
            lowerMessage.includes('react') || lowerMessage.includes('api')) {
            return 'coding';
        }
        
        // Search/current events keywords
        if (lowerMessage.includes('latest') || lowerMessage.includes('news') ||
            lowerMessage.includes('current') || lowerMessage.includes('today') ||
            lowerMessage.includes('recent') || lowerMessage.includes('search')) {
            return 'search';
        }
        
        // Creative writing keywords
        if (lowerMessage.includes('write') || lowerMessage.includes('story') ||
            lowerMessage.includes('creative') || lowerMessage.includes('poem') ||
            lowerMessage.includes('essay')) {
            return 'creative-writing';
        }
        
        // Analysis keywords
        if (lowerMessage.includes('analyze') || lowerMessage.includes('compare') ||
            lowerMessage.includes('explain') || lowerMessage.includes('detailed') ||
            lowerMessage.includes('research')) {
            return 'analysis';
        }
        
        // Quick questions (short messages)
        if (message.length < 50) {
            return 'quick-question';
        }
        
        return 'general';
    }

    async generateResponse(message, model, previousMessages = []) {
        try {
            const apiKey = process.env.OPENROUTER_API_KEY;
            if (!apiKey) {
                throw new Error('OpenRouter API key not configured');
            }

            const messages = [
                ...previousMessages.map(msg => ({
                    role: msg.role,
                    content: msg.content
                })),
                {
                    role: 'user',
                    content: message
                }
            ];

            console.log(`Making OpenRouter API call with model: ${model}`);

            const response = await fetch(`${this.baseURL}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': process.env.APP_URL || 'http://localhost:5000',
                    'X-Title': 'AI Platform'
                },
                body: JSON.stringify({
                    model: model,
                    messages: messages,
                    max_tokens: 200, // Reduced to save credits
                    temperature: 0.7
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`OpenRouter API error ${response.status}:`, errorText);
                
                // Handle credit issues specifically
                if (response.status === 402) {
                    console.log('Credits exhausted, trying with free model...');
                    
                    // Retry with free model
                    const freeResponse = await fetch(`${this.baseURL}/chat/completions`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${apiKey}`,
                            'Content-Type': 'application/json',
                            'HTTP-Referer': process.env.APP_URL || 'http://localhost:3001',
                            'X-Title': 'AI Platform'
                        },
                        body: JSON.stringify({
                            model: 'meta-llama/llama-3-8b-instruct:free',
                            messages: messages,
                            max_tokens: 150, // Even smaller for free model
                            temperature: 0.7
                        })
                    });
                    
                    if (freeResponse.ok) {
                        const freeData = await freeResponse.json();
                        if (freeData.choices && freeData.choices[0] && freeData.choices[0].message) {
                            return {
                                content: freeData.choices[0].message.content + '\n\n[Note: Using free model due to credit limits]',
                                model: 'meta-llama/llama-3-8b-instruct:free',
                                usage: freeData.usage
                            };
                        }
                    }
                }
                
                throw new Error(`OpenRouter API error: ${response.status} - Credits exhausted. Please add credits at https://openrouter.ai/settings/credits`);
            }

            const data = await response.json();
            
            if (!data.choices || !data.choices[0] || !data.choices[0].message) {
                console.error('Invalid OpenRouter response:', data);
                throw new Error('Invalid response from OpenRouter API');
            }
            
            return {
                content: data.choices[0].message.content,
                model: model,
                usage: data.usage
            };

        } catch (error) {
            console.error('Error generating response:', error.message);
            throw new Error(`Failed to generate AI response: ${error.message}`);
        }
    }

    async getAvailableModels() {
        try {
            const apiKey = process.env.OPENROUTER_API_KEY;
            const response = await fetch(`${this.baseURL}/models`, {
                headers: {
                    'Authorization': `Bearer ${apiKey}`
                }
            });

            if (!response.ok) {
                throw new Error(`OpenRouter API error: ${response.status}`);
            }

            const data = await response.json();
            return data.data;

        } catch (error) {
            console.error('Error fetching models:', error);
            return Object.keys(this.models).map(id => ({
                id,
                ...this.models[id]
            }));
        }
    }

    getModelInfo() {
        return this.models;
    }
}

export default new OpenRouterService();