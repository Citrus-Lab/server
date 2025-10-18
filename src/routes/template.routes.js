import express from 'express';
import { body } from 'express-validator';
import { authUser } from '../middlewares/auth.middleware.js';
import {
    createTemplate,
    getUserTemplates,
    getPublicTemplates,
    getTemplateById,
    updateTemplate,
    deleteTemplate,
    useTemplate,
    rateTemplate,
    getTemplateCategories
} from '../controllers/template.controller.js';

const router = express.Router();

// Validation middleware for template creation/update
const templateValidation = [
    body('name')
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Template name is required and must be less than 100 characters'),
    body('description')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Description must be less than 500 characters'),
    body('persona')
        .optional()
        .isLength({ max: 200 })
        .withMessage('Persona must be less than 200 characters'),
    body('context')
        .optional()
        .isLength({ max: 1000 })
        .withMessage('Context must be less than 1000 characters'),
    body('instruction')
        .optional()
        .isLength({ max: 1000 })
        .withMessage('Instruction must be less than 1000 characters'),
    body('format')
        .optional()
        .isLength({ max: 300 })
        .withMessage('Format must be less than 300 characters'),
    body('tone')
        .optional()
        .isIn(['professional', 'casual', 'friendly', 'formal', 'creative', 'technical', 'conversational'])
        .withMessage('Invalid tone value'),
    body('inputData')
        .optional()
        .isLength({ max: 2000 })
        .withMessage('Input data must be less than 2000 characters'),
    body('thinkingPoints')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Thinking points must be less than 500 characters'),
    body('warnings')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Warnings must be less than 500 characters'),
    body('askMe')
        .optional()
        .isLength({ max: 300 })
        .withMessage('Ask me must be less than 300 characters'),
    body('category')
        .optional()
        .isIn(['coding', 'writing', 'analysis', 'creative', 'business', 'research', 'education', 'general'])
        .withMessage('Invalid category'),
    body('tags')
        .optional()
        .isArray()
        .withMessage('Tags must be an array'),
    body('tags.*')
        .optional()
        .isLength({ max: 30 })
        .withMessage('Each tag must be less than 30 characters'),
    // Frontend compatibility
    body('actAs')
        .optional()
        .isLength({ max: 200 })
        .withMessage('Act as must be less than 200 characters'),
    body('deeplyThinkAbout')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Deeply think about must be less than 500 characters'),
    body('warning')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Warning must be less than 500 characters')
];

// Rating validation
const ratingValidation = [
    body('rating')
        .isInt({ min: 1, max: 5 })
        .withMessage('Rating must be between 1 and 5')
];

// Routes

// Create new template
router.post('/', authUser, templateValidation, createTemplate);

// Get user's templates
router.get('/my-templates', authUser, getUserTemplates);

// Get public templates
router.get('/public', authUser, getPublicTemplates);

// Get template categories
router.get('/categories', authUser, getTemplateCategories);

// Get specific template by ID
router.get('/:id', authUser, getTemplateById);

// Update template
router.put('/:id', authUser, templateValidation, updateTemplate);

// Delete template
router.delete('/:id', authUser, deleteTemplate);

// Use template (increment usage count and get formatted template)
router.post('/:id/use', authUser, useTemplate);

// Rate template
router.post('/:id/rate', authUser, ratingValidation, rateTemplate);

export default router;