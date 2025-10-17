import Message from '../models/message.model.js';
import socketService from '../services/socket.service.js';

// Get messages for a chat
export const getMessages = async (req, res) => {
    try {
        const { chatId } = req.params;
        const { limit = 50, skip = 0 } = req.query;

        const messages = await Message.find({ 
            chatId,
            isDeleted: false 
        })
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(parseInt(skip));

        res.json({ 
            messages: messages.reverse(), // Oldest first
            total: await Message.countDocuments({ chatId, isDeleted: false })
        });
    } catch (error) {
        console.error('Get Messages Error:', error);
        res.status(500).json({ error: error.message });
    }
};

// Send a message
export const sendMessage = async (req, res) => {
    try {
        const { chatId } = req.params;
        const { content, type = 'text', sender, imageUrl, replyTo } = req.body;

        const message = new Message({
            chatId,
            sender: {
                email: sender.email,
                name: sender.name,
                avatar: sender.avatar
            },
            content,
            type,
            imageUrl,
            replyTo
        });

        await message.save();

        // Broadcast via WebSocket
        socketService.emitToChatRoom(chatId, 'new-message', {
            message: message.toObject()
        });

        res.status(201).json({ message });
    } catch (error) {
        console.error('Send Message Error:', error);
        res.status(500).json({ error: error.message });
    }
};

// Edit message
export const editMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        const { content, userEmail } = req.body;

        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({ error: 'Message not found' });
        }

        // Check if user is the sender
        if (message.sender.email !== userEmail) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        message.content = content;
        message.isEdited = true;
        message.editedAt = new Date();
        await message.save();

        // Broadcast update
        socketService.emitToChatRoom(message.chatId, 'message-edited', {
            messageId,
            content,
            editedAt: message.editedAt
        });

        res.json({ message });
    } catch (error) {
        console.error('Edit Message Error:', error);
        res.status(500).json({ error: error.message });
    }
};

// Delete message
export const deleteMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        const { userEmail } = req.body;

        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({ error: 'Message not found' });
        }

        // Check if user is the sender
        if (message.sender.email !== userEmail) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        message.isDeleted = true;
        message.deletedAt = new Date();
        await message.save();

        // Broadcast deletion
        socketService.emitToChatRoom(message.chatId, 'message-deleted', {
            messageId
        });

        res.json({ message: 'Message deleted' });
    } catch (error) {
        console.error('Delete Message Error:', error);
        res.status(500).json({ error: error.message });
    }
};

// Add reaction
export const addReaction = async (req, res) => {
    try {
        const { messageId } = req.params;
        const { emoji, userEmail, userName } = req.body;

        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({ error: 'Message not found' });
        }

        // Remove existing reaction from this user
        message.reactions = message.reactions.filter(r => r.user !== userEmail);

        // Add new reaction
        message.reactions.push({
            emoji,
            user: userEmail,
            timestamp: new Date()
        });

        await message.save();

        // Broadcast reaction
        socketService.emitToChatRoom(message.chatId, 'reaction-added', {
            messageId,
            emoji,
            user: userEmail
        });

        res.json({ message });
    } catch (error) {
        console.error('Add Reaction Error:', error);
        res.status(500).json({ error: error.message });
    }
};

// Upload image (placeholder - you'll need to implement file upload)
export const uploadImage = async (req, res) => {
    try {
        // TODO: Implement actual file upload (use multer, cloudinary, etc.)
        // For now, return a placeholder
        const imageUrl = req.body.imageUrl || 'https://via.placeholder.com/300';
        
        res.json({ imageUrl });
    } catch (error) {
        console.error('Upload Image Error:', error);
        res.status(500).json({ error: error.message });
    }
};
