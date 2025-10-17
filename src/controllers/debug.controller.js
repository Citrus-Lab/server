import openRouterService from '../services/openrouter.service.js';

async function debugOpenRouter(req, res) {
    try {
        console.log('=== DEBUG OpenRouter ===');
        
        // Check API key
        console.log('API Key exists:', !!process.env.OPENROUTER_API_KEY);
        console.log('API Key length:', process.env.OPENROUTER_API_KEY?.length || 0);
        
        // Check service initialization
        console.log('Service baseURL:', openRouterService.baseURL);
        console.log('Service API key exists:', !!process.env.OPENROUTER_API_KEY);
        console.log('Service API key value:', process.env.OPENROUTER_API_KEY?.substring(0, 10) + '...');
        
        // Test model selection
        const testMessage = "Hello world";
        const selectedModel = await openRouterService.selectBestModel(testMessage);
        console.log('Selected model:', selectedModel);
        
        // Test model info
        const modelInfo = openRouterService.getModelInfo();
        console.log('Available models count:', Object.keys(modelInfo).length);
        
        res.json({
            status: 'Debug complete',
            apiKeyExists: !!process.env.OPENROUTER_API_KEY,
            apiKeyLength: process.env.OPENROUTER_API_KEY?.length || 0,
            serviceInitialized: !!process.env.OPENROUTER_API_KEY,
            selectedModel: selectedModel,
            availableModelsCount: Object.keys(modelInfo).length
        });
        
    } catch (error) {
        console.error('Debug error:', error);
        res.status(500).json({ 
            error: error.message,
            stack: error.stack 
        });
    }
}

async function testSimpleResponse(req, res) {
    try {
        const { message = "Hello, how are you?" } = req.body;
        
        // Mock response without OpenRouter
        const mockResponse = {
            content: `Mock AI Response: I received your message "${message}". This is a test response while we debug the OpenRouter integration.`,
            model: 'mock-model',
            usage: { total_tokens: 50 }
        };
        
        res.json({
            message: 'Mock response generated',
            response: mockResponse,
            timestamp: new Date()
        });
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export {
    debugOpenRouter,
    testSimpleResponse
};