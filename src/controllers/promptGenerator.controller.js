import PromptGeneration from '../models/promptGenerator.model.js';
import Template from '../models/template.model.js';
import openRouterService from '../services/openrouter.service.js';
import { validationResult } from 'express-validator';

// Generate refined prompt from messy input
export const generatePrompt = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                message: 'Validation failed', 
                errors: errors.array() 
            });
        }

        const { originalInput, category, preferredFormat, preferredTone } = req.body;
        const userId = req.user.userId;
        const startTime = Date.now();

        // AI prompt for generating structured prompts
        const systemPrompt = `You are an expert prompt engineer. Your task is to convert messy, incomplete user ideas into well-structured, comprehensive prompts that will get better AI responses.

ANALYZE the user's input and CREATE a structured prompt with these components:

1. **Persona**: What role should the AI take? (e.g., "Expert Software Engineer", "Creative Writing Mentor")
2. **Context**: Background information or situation
3. **Instruction**: Clear task starting with action verb (Analyze, Generate, Write, Review, etc.)
4. **Format**: How should the output be structured? (paragraph, bullet-points, table, code, etc.)
5. **Tone**: Communication style (professional, casual, technical, creative, etc.)
6. **Focus Areas**: What should the AI deeply think about?
7. **Restrictions**: What to avoid or be careful about?

RULES:
- Make the prompt specific and actionable
- Add missing context that would improve the response
- Suggest appropriate format and tone if not specified
- Include focus areas that ensure quality output
- Add reasonable restrictions to avoid common issues

RESPOND in this JSON format:
{
  "persona": "role for AI",
  "context": "background information", 
  "instruction": "clear task with action verb",
  "format": "output format",
  "tone": "communication style",
  "focusAreas": ["area1", "area2", "area3"],
  "restrictions": ["restriction1", "restriction2"],
  "category": "detected category",
  "confidence": 85,
  "improvements": ["what was added/improved"],
  "fullPrompt": "complete formatted prompt ready to use"
}`;

        const userMessage = `Original input: "${originalInput}"
${category ? `Preferred category: ${category}` : ''}
${preferredFormat ? `Preferred format: ${preferredFormat}` : ''}
${preferredTone ? `Preferred tone: ${preferredTone}` : ''}

Please analyze this and create a comprehensive, structured prompt.`;

        console.log('Generating prompt with AI...');

        // Use Claude for prompt generation (best for structured tasks)
        const aiResponse = await openRouterService.generateResponse(
            userMessage,
            'anthropic/claude-3-sonnet',
            [{ role: 'system', content: systemPrompt }]
        );

        const processingTime = Date.now() - startTime;

        // Parse AI response
        let generatedData;
        try {
            // Extract JSON from AI response
            const jsonMatch = aiResponse.content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                generatedData = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error('No JSON found in AI response');
            }
        } catch (parseError) {
            console.error('Failed to parse AI response:', parseError);
            
            // Fallback: create basic structured prompt
            generatedData = {
                persona: 'AI Assistant',
                context: 'General assistance request',
                instruction: `Help with: ${originalInput}`,
                format: preferredFormat || 'paragraph',
                tone: preferredTone || 'professional',
                focusAreas: ['Accuracy', 'Clarity', 'Helpfulness'],
                restrictions: ['Provide factual information only'],
                category: category || 'general',
                confidence: 60,
                improvements: ['Added basic structure', 'Clarified intent'],
                fullPrompt: `Please help with the following request: ${originalInput}\n\nPlease provide a ${preferredFormat || 'detailed'} response in a ${preferredTone || 'professional'} tone.`
            };
        }

        // Save generation record
        const promptGeneration = new PromptGeneration({
            userId,
            originalInput,
            generatedPrompt: generatedData.fullPrompt,
            category: generatedData.category || category || 'general',
            improvements: generatedData.improvements || [],
            confidence: generatedData.confidence || 70,
            extractedComponents: {
                persona: generatedData.persona,
                context: generatedData.context,
                instruction: generatedData.instruction,
                format: generatedData.format,
                tone: generatedData.tone,
                focusAreas: generatedData.focusAreas || [],
                restrictions: generatedData.restrictions || []
            },
            processingTime,
            tokensUsed: aiResponse.usage?.total_tokens || 0
        });

        await promptGeneration.save();

        res.json({
            message: 'Prompt generated successfully',
            generation: {
                id: promptGeneration._id,
                originalInput: promptGeneration.originalInput,
                generatedPrompt: promptGeneration.generatedPrompt,
                category: promptGeneration.category,
                confidence: promptGeneration.confidence,
                improvements: promptGeneration.improvements,
                components: promptGeneration.extractedComponents,
                processingTime: promptGeneration.processingTime
            },
            suggestions: {
                canSaveAsTemplate: true,
                similarTemplates: await findSimilarTemplates(userId, generatedData.category)
            }
        });

    } catch (error) {
        console.error('Generate prompt error:', error);
        res.status(500).json({ 
            message: 'Failed to generate prompt', 
            error: error.message 
        });
    }
};

// Get user's generation history
export const getGenerationHistory = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { page = 1, limit = 20, category, search } = req.query;

        const query = { userId };
        
        if (category && category !== 'all') {
            query.category = category;
        }
        
        if (search) {
            query.$or = [
                { originalInput: { $regex: search, $options: 'i' } },
                { generatedPrompt: { $regex: search, $options: 'i' } }
            ];
        }

        const generations = await PromptGeneration.find(query)
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .select('originalInput generatedPrompt category confidence userRating wasUsed savedAsTemplate createdAt improvements');

        const total = await PromptGeneration.countDocuments(query);

        res.json({
            generations,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalGenerations: total,
                hasNext: page * limit < total,
                hasPrev: page > 1
            }
        });

    } catch (error) {
        console.error('Get generation history error:', error);
        res.status(500).json({ 
            message: 'Server error', 
            error: error.message 
        });
    }
};

// Rate generated prompt
export const rateGeneration = async (req, res) => {
    try {
        const { id } = req.params;
        const { rating } = req.body;
        const userId = req.user.userId;

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ message: 'Rating must be between 1 and 5' });
        }

        const generation = await PromptGeneration.findOne({ _id: id, userId });

        if (!generation) {
            return res.status(404).json({ message: 'Generation not found' });
        }

        await generation.addRating(rating);

        res.json({
            message: 'Rating added successfully',
            generation: {
                id: generation._id,
                rating: generation.userRating
            }
        });

    } catch (error) {
        console.error('Rate generation error:', error);
        res.status(500).json({ 
            message: 'Server error', 
            error: error.message 
        });
    }
};

// Mark generation as used
export const markAsUsed = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        const generation = await PromptGeneration.findOne({ _id: id, userId });

        if (!generation) {
            return res.status(404).json({ message: 'Generation not found' });
        }

        await generation.markAsUsed();

        res.json({
            message: 'Marked as used successfully',
            generation: {
                id: generation._id,
                wasUsed: generation.wasUsed
            }
        });

    } catch (error) {
        console.error('Mark as used error:', error);
        res.status(500).json({ 
            message: 'Server error', 
            error: error.message 
        });
    }
};

// Save generation as template
export const saveAsTemplate = async (req, res) => {
    try {
        const { id } = req.params;
        const { templateName, isPublic = false } = req.body;
        const userId = req.user.userId;

        const generation = await PromptGeneration.findOne({ _id: id, userId });

        if (!generation) {
            return res.status(404).json({ message: 'Generation not found' });
        }

        if (generation.savedAsTemplate) {
            return res.status(400).json({ message: 'Already saved as template' });
        }

        // Create template from generation
        const template = new Template({
            userId,
            name: templateName || `Generated Template ${Date.now()}`,
            description: `Auto-generated from prompt: "${generation.originalInput.substring(0, 100)}..."`,
            persona: generation.extractedComponents.persona,
            context: generation.extractedComponents.context,
            instruction: generation.extractedComponents.instruction,
            format: generation.extractedComponents.format,
            tone: generation.extractedComponents.tone,
            thinkingPoints: generation.extractedComponents.focusAreas?.join(', '),
            warnings: generation.extractedComponents.restrictions?.join(', '),
            isPublic,
            category: generation.category,
            tags: ['ai-generated', generation.category]
        });

        await template.save();

        // Update generation record
        generation.savedAsTemplate = true;
        generation.templateId = template._id;
        await generation.save();

        res.json({
            message: 'Saved as template successfully',
            template: {
                id: template._id,
                name: template.name,
                category: template.category
            },
            generation: {
                id: generation._id,
                savedAsTemplate: generation.savedAsTemplate
            }
        });

    } catch (error) {
        console.error('Save as template error:', error);
        res.status(500).json({ 
            message: 'Server error', 
            error: error.message 
        });
    }
};

// Get user's generation statistics
export const getGenerationStats = async (req, res) => {
    try {
        const userId = req.user.userId;

        const stats = await PromptGeneration.getUserStats(userId);
        
        const recentGenerations = await PromptGeneration.find({ userId })
            .sort({ createdAt: -1 })
            .limit(5)
            .select('originalInput category confidence createdAt');

        res.json({
            stats: stats[0] || {
                totalGenerations: 0,
                successfulGenerations: 0,
                avgConfidence: 0,
                avgRating: 0,
                categoriesUsed: []
            },
            recentGenerations
        });

    } catch (error) {
        console.error('Get generation stats error:', error);
        res.status(500).json({ 
            message: 'Server error', 
            error: error.message 
        });
    }
};

// Helper function to find similar templates
async function findSimilarTemplates(userId, category) {
    try {
        const templates = await Template.find({
            $or: [
                { userId: userId },
                { isPublic: true }
            ],
            category: category
        })
        .limit(3)
        .select('name description category')
        .sort({ usageCount: -1 });

        return templates;
    } catch (error) {
        console.error('Error finding similar templates:', error);
        return [];
    }
}