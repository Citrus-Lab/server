import express from 'express';
import { body } from 'express-validator';
import { authUser } from '../middlewares/auth.middleware.js';
import {
    generatePrompt,
    getGenerationHistory,
    rateGeneration,
    markAsUsed,
    saveAsTemplate,
    getGenerationStats
} from '../controllers/promptGenerator.controller.js';

const router = express.Router();

// Validation middleware for prompt generation
const generatePromptValidation = [
    body('originalInput')
        .trim()
        .isLength({ min: 5, max: 2000 })
        .withMessage('Original input must be between 5 and 2000 characters'),
    body('category')
        .optional()
        .isIn(['coding', 'writing', 'analysis', 'creative', 'business', 'research', 'education', 'general'])
        .withMessage('Invalid category'),
    body('preferredFormat')
        .optional()
        .isLength({ max: 100 })
        .withMessage('Preferred format must be less than 100 characters'),
    body('preferredTone')
        .optional()
        .isLength({ max: 50 })
        .withMessage('Preferred tone must be less than 50 characters')
];

// Rating validation
const ratingValidation = [
    body('rating')
        .isInt({ min: 1, max: 5 })
        .withMessage('Rating must be between 1 and 5')
];

// Template name validation
const templateNameValidation = [
    body('templateName')
        .optional()
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Template name must be between 1 and 100 characters'),
    body('isPublic')
        .optional()
        .isBoolean()
        .withMessage('isPublic must be a boolean')
];

// Routes

// Generate refined prompt from messy input
router.post('/generate', authUser, generatePromptValidation, generatePrompt);

// Get user's generation history
router.get('/history', authUser, getGenerationHistory);

// Get user's generation statistics
router.get('/stats', authUser, getGenerationStats);

// Rate a generated prompt
router.post('/:id/rate', authUser, ratingValidation, rateGeneration);

// Mark generation as used
router.post('/:id/use', authUser, markAsUsed);

// Save generation as template
router.post('/:id/save-template', authUser, templateNameValidation, saveAsTemplate);

export default router;