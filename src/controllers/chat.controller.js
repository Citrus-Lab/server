import chatModel from '../models/chat.model.js';
import openRouterService from '../services/openrouter.service.js';

async function createChat(req, res) {
    try {
        const { message, model, mode = 'manual' } = req.body;
        const userId = req.user.userId;

        // Create new chat
        const chat = new chatModel({
            userId,
            messages: [{
                role: 'user',
                content: message,
                timestamp: new Date()
            }],
            model: model || 'auto',
            mode
        });

        await chat.save();

        // Determine which model to use
        let selectedModel = model;
        if (mode === 'auto' || !model) {
            selectedModel = await openRouterService.selectBestModel(message);
        }

        // Get AI response
        const aiResponse = await openRouterService.generateResponse(message, selectedModel);

        // Add AI response to chat
        chat.messages.push({
            role: 'assistant',
            content: aiResponse.content,
            model: selectedModel,
            timestamp: new Date()
        });

        chat.model = selectedModel;
        await chat.save();

        res.status(201).json({
            message: 'Chat created successfully',
            chat: {
                id: chat._id,
                messages: chat.messages,
                model: selectedModel,
                mode
            }
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}

async function getChatHistory(req, res) {
    try {
        const userId = req.user.userId;
        const { page = 1, limit = 20 } = req.query;

        const chats = await chatModel.find({ userId })
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .select('_id messages model mode createdAt updatedAt');

        res.json({
            chats,
            currentPage: page,
            totalPages: Math.ceil(await chatModel.countDocuments({ userId }) / limit)
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}

async function getChatById(req, res) {
    try {
        const { chatId } = req.params;
        const userId = req.user.userId;

        const chat = await chatModel.findOne({ _id: chatId, userId });

        if (!chat) {
            return res.status(404).json({ message: 'Chat not found' });
        }

        res.json({ chat });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}

async function addMessageToChat(req, res) {
    try {
        const { chatId } = req.params;
        const { message, model } = req.body;
        const userId = req.user.userId;

        const chat = await chatModel.findOne({ _id: chatId, userId });

        if (!chat) {
            return res.status(404).json({ message: 'Chat not found' });
        }

        // Add user message
        chat.messages.push({
            role: 'user',
            content: message,
            timestamp: new Date()
        });

        // Determine model to use
        let selectedModel = model || chat.model;
        if (chat.mode === 'auto' || !model) {
            selectedModel = await openRouterService.selectBestModel(message);
        }

        // Get AI response
        const aiResponse = await openRouterService.generateResponse(
            message, 
            selectedModel, 
            chat.messages.slice(0, -1) // Previous messages for context
        );

        // Add AI response
        chat.messages.push({
            role: 'assistant',
            content: aiResponse.content,
            model: selectedModel,
            timestamp: new Date()
        });

        chat.model = selectedModel;
        await chat.save();

        res.json({
            message: 'Message added successfully',
            chat: {
                id: chat._id,
                messages: chat.messages,
                model: selectedModel
            }
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}

export {
    createChat,
    getChatHistory,
    getChatById,
    addMessageToChat
};