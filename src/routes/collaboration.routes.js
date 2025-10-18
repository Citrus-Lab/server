import express from 'express';
import * as collaborationController from '../controllers/collaboration.controller.js';

const router = express.Router();

// IMPORTANT: Specific routes MUST come before parameterized routes
// Access shared chat (MUST be before /:chatId routes)
router.get('/shared/:shareToken', collaborationController.accessSharedChat);
router.get('/invitation/:shareToken', collaborationController.accessSharedChat);

// Get or create collaboration for a chat
router.get('/:chatId', collaborationController.getOrCreateCollaboration);
router.post('/:chatId', collaborationController.getOrCreateCollaboration);

// Invite collaborator
router.post('/:chatId/invite', collaborationController.inviteCollaborator);

// Update collaborator role
router.patch('/:chatId/collaborators/:collaboratorId', collaborationController.updateCollaboratorRole);

// Remove collaborator
router.delete('/:chatId/collaborators/:collaboratorId', collaborationController.removeCollaborator);

// Generate share link
router.post('/:chatId/share-link', collaborationController.generateShareLink);

// Disable share link
router.delete('/:chatId/share-link', collaborationController.disableShareLink);

// Active users (real-time presence)
router.post('/:chatId/active-users', collaborationController.updateActiveUser);
router.get('/:chatId/active-users', collaborationController.getActiveUsers);

export default router;
