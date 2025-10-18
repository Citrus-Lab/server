import express from 'express';
import {
    getMessages,
    sendMessage,
    editMessage,
    deleteMessage,
    addReaction,
    uploadImage
} from '../controllers/message.controller.js';

const router = express.Router();

// Get messages for a chat
router.get('/:chatId', getMessages);

// Send a message
router.post('/:chatId', sendMessage);

// Edit a message
router.patch('/:messageId', editMessage);

// Delete a message
router.delete('/:messageId', deleteMessage);

// Add reaction to message
router.post('/:messageId/reaction', addReaction);

// Upload image
router.post('/upload/image', uploadImage);

export default router;
