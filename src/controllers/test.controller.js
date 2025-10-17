// Simple test controller without OpenRouter dependency

async function createSimpleChat(req, res) {
    try {
        const { message, model = 'test-model', mode = 'manual' } = req.body;
        const userId = req.user.userId;

        // Mock response for testing
        const mockResponse = {
            id: Date.now().toString(),
            messages: [
                {
                    role: 'user',
                    content: message,
                    timestamp: new Date()
                },
                {
                    role: 'assistant',
                    content: `This is a test response to: "${message}". OpenRouter integration will work once the API key is properly loaded.`,
                    model: model,
                    timestamp: new Date()
                }
            ],
            model: model,
            mode: mode,
            userId: userId
        };

        res.status(201).json({
            message: 'Test chat created successfully',
            chat: mockResponse
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}

export { createSimpleChat };