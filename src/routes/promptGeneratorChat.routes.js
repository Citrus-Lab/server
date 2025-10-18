import express from 'express';
import { body } from 'express-validator';
import { authUser } from '../middlewares/auth.middleware.js';
import {
    getActiveSession,
    saveSessionState,
    resetSession,
    getSessionHistory,
    getSessionById,
    deleteSession,
    markPromptAction
} from '../controllers/promptGeneratorChat.controller.js';

// Optional auth middleware - allows both authenticated and guest users
const optionalAuth = (req, res, next) => {
    const token = req.cookies.token;
    
    if (!token) {
        // No token - continue as guest user
        req.user = null;
        return next();
    }
    
    // Token exists - try to authenticate
    authUser(req, res, next);
};

const router = express.Router();

// Validation middleware for session state
const saveSessionValidation = [
    body('sessionId')
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Session ID is required and must be less than 100 characters'),
    body('title')
        .optional()
        .trim()
        .isLength({ max: 200 })
        .withMessage('Title must be less than 200 characters'),
    body('messages')
        .optional()
        .isArray()
        .withMessage('Messages must be an array'),
    body('snippets')
        .optional()
        .isArray()
        .withMessage('Snippets must be an array'),
    body('generatedPrompts')
        .optional()
        .isArray()
        .withMessage('Generated prompts must be an array')
];

// Reset session validation
const resetSessionValidation = [
    body('currentSessionId')
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Current session ID is required')
];

// Mark prompt action validation
const markPromptActionValidation = [
    body('action')
        .isIn(['used', 'injected'])
        .withMessage('Action must be either "used" or "injected"')
];

// Routes

// Get or create active session
router.get('/active', optionalAuth, getActiveSession);

// Save current session state
router.post('/save', optionalAuth, saveSessionValidation, saveSessionState);

// Reset session (archive current and create new)
router.post('/reset', optionalAuth, resetSessionValidation, resetSession);

// Get session history (archived sessions)
router.get('/history', optionalAuth, getSessionHistory);

// Get specific session by ID
router.get('/:sessionId', optionalAuth, getSessionById);

// Delete session
router.delete('/:sessionId', optionalAuth, deleteSession);

// Mark prompt as used/injected
router.post('/:sessionId/prompts/:promptId/action', optionalAuth, markPromptActionValidation, markPromptAction);

export default router;