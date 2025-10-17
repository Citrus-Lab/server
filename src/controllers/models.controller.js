import openRouterService from '../services/openrouter.service.js';

async function getAvailableModels(req, res) {
    try {
        const models = await openRouterService.getAvailableModels();
        const modelInfo = openRouterService.getModelInfo();

        res.json({
            models: models.map(model => ({
                id: model.id,
                name: model.name || modelInfo[model.id]?.name || model.id,
                strengths: modelInfo[model.id]?.strengths || [],
                cost: modelInfo[model.id]?.cost || 'unknown'
            }))
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}

async function selectBestModel(req, res) {
    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({ message: 'Message is required' });
        }

        const selectedModel = await openRouterService.selectBestModel(message);
        const modelInfo = openRouterService.getModelInfo();

        res.json({
            selectedModel,
            modelInfo: modelInfo[selectedModel],
            reasoning: `Selected based on message analysis`
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}

export {
    getAvailableModels,
    selectBestModel
};