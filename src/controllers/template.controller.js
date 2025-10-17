import Template from '../models/template.model.js';
import { validationResult } from 'express-validator';

// Create new template
export const createTemplate = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                message: 'Validation failed', 
                errors: errors.array() 
            });
        }

        const {
            name,
            description,
            persona,
            context,
            instruction,
            format,
            tone,
            inputData,
            thinkingPoints,
            warnings,
            askMe,
            isPublic,
            tags,
            category,
            // Frontend compatibility
            actAs,
            deeplyThinkAbout,
            warning
        } = req.body;

        const userId = req.user.userId;

        const template = new Template({
            userId,
            name,
            description,
            persona: persona || actAs, // Support both formats
            context,
            instruction,
            format,
            tone,
            inputData,
            thinkingPoints: thinkingPoints || deeplyThinkAbout,
            warnings: warnings || warning,
            askMe,
            isPublic: isPublic || false,
            tags: tags || [],
            category: category || 'general',
            structure: {
                actAs: actAs || persona,
                deeplyThinkAbout: deeplyThinkAbout || thinkingPoints,
                warning: warning || warnings
            }
        });

        await template.save();

        res.status(201).json({
            message: 'Template created successfully',
            template: {
                id: template._id,
                name: template.name,
                description: template.description,
                category: template.category,
                tags: template.tags,
                isPublic: template.isPublic,
                createdAt: template.createdAt,
                formattedTemplate: template.formattedTemplate
            }
        });

    } catch (error) {
        console.error('Create template error:', error);
        res.status(500).json({ 
            message: 'Server error', 
            error: error.message 
        });
    }
};

// Get user's templates
export const getUserTemplates = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { page = 1, limit = 20, category, search } = req.query;

        const query = { userId };
        
        if (category && category !== 'all') {
            query.category = category;
        }
        
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { tags: { $in: [new RegExp(search, 'i')] } }
            ];
        }

        const templates = await Template.find(query)
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .select('name description category tags isPublic usageCount rating createdAt');

        const total = await Template.countDocuments(query);

        res.json({
            templates,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalTemplates: total,
                hasNext: page * limit < total,
                hasPrev: page > 1
            }
        });

    } catch (error) {
        console.error('Get user templates error:', error);
        res.status(500).json({ 
            message: 'Server error', 
            error: error.message 
        });
    }
};

// Get public templates
export const getPublicTemplates = async (req, res) => {
    try {
        const { page = 1, limit = 20, category, search, sortBy = 'popular' } = req.query;

        const query = { isPublic: true };
        
        if (category && category !== 'all') {
            query.category = category;
        }
        
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { tags: { $in: [new RegExp(search, 'i')] } }
            ];
        }

        let sortOptions = {};
        switch (sortBy) {
            case 'popular':
                sortOptions = { usageCount: -1 };
                break;
            case 'rating':
                sortOptions = { 'rating.averageRating': -1 };
                break;
            case 'newest':
                sortOptions = { createdAt: -1 };
                break;
            default:
                sortOptions = { usageCount: -1 };
        }

        const templates = await Template.find(query)
            .populate('userId', 'username')
            .sort(sortOptions)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .select('name description category tags usageCount rating createdAt userId');

        const total = await Template.countDocuments(query);

        res.json({
            templates,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalTemplates: total,
                hasNext: page * limit < total,
                hasPrev: page > 1
            }
        });

    } catch (error) {
        console.error('Get public templates error:', error);
        res.status(500).json({ 
            message: 'Server error', 
            error: error.message 
        });
    }
};

// Get template by ID
export const getTemplateById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        const template = await Template.findOne({
            _id: id,
            $or: [
                { userId: userId },
                { isPublic: true }
            ]
        }).populate('userId', 'username');

        if (!template) {
            return res.status(404).json({ message: 'Template not found' });
        }

        res.json({
            template: {
                ...template.toObject(),
                formattedTemplate: template.formattedTemplate
            }
        });

    } catch (error) {
        console.error('Get template by ID error:', error);
        res.status(500).json({ 
            message: 'Server error', 
            error: error.message 
        });
    }
};

// Update template
export const updateTemplate = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                message: 'Validation failed', 
                errors: errors.array() 
            });
        }

        const { id } = req.params;
        const userId = req.user.userId;

        const template = await Template.findOne({ _id: id, userId });

        if (!template) {
            return res.status(404).json({ message: 'Template not found' });
        }

        const updateData = { ...req.body };
        
        // Handle frontend compatibility
        if (req.body.actAs) {
            updateData.persona = req.body.actAs;
            updateData['structure.actAs'] = req.body.actAs;
        }
        if (req.body.deeplyThinkAbout) {
            updateData.thinkingPoints = req.body.deeplyThinkAbout;
            updateData['structure.deeplyThinkAbout'] = req.body.deeplyThinkAbout;
        }
        if (req.body.warning) {
            updateData.warnings = req.body.warning;
            updateData['structure.warning'] = req.body.warning;
        }

        Object.assign(template, updateData);
        await template.save();

        res.json({
            message: 'Template updated successfully',
            template: {
                id: template._id,
                name: template.name,
                description: template.description,
                category: template.category,
                tags: template.tags,
                isPublic: template.isPublic,
                updatedAt: template.updatedAt,
                formattedTemplate: template.formattedTemplate
            }
        });

    } catch (error) {
        console.error('Update template error:', error);
        res.status(500).json({ 
            message: 'Server error', 
            error: error.message 
        });
    }
};

// Delete template
export const deleteTemplate = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        const template = await Template.findOneAndDelete({ _id: id, userId });

        if (!template) {
            return res.status(404).json({ message: 'Template not found' });
        }

        res.json({ message: 'Template deleted successfully' });

    } catch (error) {
        console.error('Delete template error:', error);
        res.status(500).json({ 
            message: 'Server error', 
            error: error.message 
        });
    }
};

// Use template (increment usage count)
export const useTemplate = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        const template = await Template.findOne({
            _id: id,
            $or: [
                { userId: userId },
                { isPublic: true }
            ]
        });

        if (!template) {
            return res.status(404).json({ message: 'Template not found' });
        }

        await template.incrementUsage();

        res.json({
            message: 'Template usage recorded',
            formattedTemplate: template.formattedTemplate,
            template: {
                id: template._id,
                name: template.name,
                structure: template.structure
            }
        });

    } catch (error) {
        console.error('Use template error:', error);
        res.status(500).json({ 
            message: 'Server error', 
            error: error.message 
        });
    }
};

// Rate template
export const rateTemplate = async (req, res) => {
    try {
        const { id } = req.params;
        const { rating } = req.body;

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ message: 'Rating must be between 1 and 5' });
        }

        const template = await Template.findOne({ _id: id, isPublic: true });

        if (!template) {
            return res.status(404).json({ message: 'Template not found' });
        }

        await template.addRating(rating);

        res.json({
            message: 'Rating added successfully',
            averageRating: template.rating.averageRating,
            ratingCount: template.rating.ratingCount
        });

    } catch (error) {
        console.error('Rate template error:', error);
        res.status(500).json({ 
            message: 'Server error', 
            error: error.message 
        });
    }
};

// Get template categories
export const getTemplateCategories = async (req, res) => {
    try {
        const userId = req.user.userId;

        const userCategories = await Template.distinct('category', { userId });
        const publicCategories = await Template.distinct('category', { isPublic: true });

        const allCategories = [...new Set([...userCategories, ...publicCategories])];

        res.json({
            categories: allCategories,
            predefinedCategories: [
                'coding', 'writing', 'analysis', 'creative', 
                'business', 'research', 'education', 'general'
            ]
        });

    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({ 
            message: 'Server error', 
            error: error.message 
        });
    }
};