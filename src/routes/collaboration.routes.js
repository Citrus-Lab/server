import express from 'express';
import collaborationController from '../controllers/collaboration.controller.js';

const router = express.Router();

// Get collaboration data for a chat
router.get('/:chatId', collaborationController.getCollaboration);

// Get active users for a chat
router.get('/:chatId/active-users', collaborationController.getActiveUsers);

// Update user presence
router.post('/:chatId/active-users', collaborationController.updatePresence);

// Invite user to collaboration
router.post('/:chatId/invite', collaborationController.inviteUser);

// Update user role
router.put('/:chatId/users/:userId/role', collaborationController.updateUserRole);

// Remove user from collaboration
router.delete('/:chatId/users/:userId', collaborationController.removeUser);

// Send message in collaboration chat
router.post('/:chatId/messages', collaborationController.sendMessage);

// Get messages for collaboration chat
router.get('/:chatId/messages', collaborationController.getMessages);

export default router;