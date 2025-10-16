import mongoose from 'mongoose';

const promptGenerationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    originalInput: {
        type: String,
        required: true,
        maxlength: 2000,
        description: "User's messy or incomplete idea"
    },
    generatedPrompt: {
        type: String,
        required: true,
        maxlength: 5000,
        description: "AI-refined structured prompt"
    },
    category: {
        type: String,
        enum: ['coding', 'writing', 'analysis', 'creative', 'business', 'research', 'education', 'general'],
        default: 'general',
        description: "Auto-detected category"
    },
    improvements: [{
        type: String,
        maxlength: 200,
        description: "What elements were added or improved"
    }],
    confidence: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
        description: "AI confidence in the generated prompt (0-100%)"
    },
    userRating: {
        type: Number,
        min: 1,
        max: 5,
        description: "User feedback rating (1-5 stars)"
    },
    wasUsed: {
        type: Boolean,
        default: false,
        description: "Whether user actually used this generated prompt"
    },
    savedAsTemplate: {
        type: Boolean,
        default: false,
        description: "Whether user saved this as a template"
    },
    templateId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Template',
        description: "Reference to template if saved"
    },
    // Structured components extracted by AI
    extractedComponents: {
        persona: { type: String, maxlength: 200 },
        context: { type: String, maxlength: 1000 },
        instruction: { type: String, maxlength: 500 },
        format: { type: String, maxlength: 100 },
        tone: { type: String, maxlength: 50 },
        focusAreas: [{ type: String, maxlength: 200 }],
        restrictions: [{ type: String, maxlength: 200 }]
    },
    // Analytics data
    processingTime: {
        type: Number,
        description: "Time taken to generate prompt (in milliseconds)"
    },
    tokensUsed: {
        type: Number,
        description: "AI tokens consumed for generation"
    }
}, {
    timestamps: true
});

// Indexes for better performance
promptGenerationSchema.index({ userId: 1, createdAt: -1 });
promptGenerationSchema.index({ category: 1, confidence: -1 });
promptGenerationSchema.index({ userRating: -1 });
promptGenerationSchema.index({ wasUsed: 1, savedAsTemplate: 1 });

// Virtual for success rate calculation
promptGenerationSchema.virtual('isSuccessful').get(function() {
    return this.userRating >= 4 || this.wasUsed || this.savedAsTemplate;
});

// Method to mark as used
promptGenerationSchema.methods.markAsUsed = function() {
    this.wasUsed = true;
    return this.save();
};

// Method to add user rating
promptGenerationSchema.methods.addRating = function(rating) {
    this.userRating = rating;
    return this.save();
};

// Static method to get user's generation stats
promptGenerationSchema.statics.getUserStats = function(userId) {
    return this.aggregate([
        { $match: { userId: mongoose.Types.ObjectId(userId) } },
        {
            $group: {
                _id: null,
                totalGenerations: { $sum: 1 },
                successfulGenerations: {
                    $sum: {
                        $cond: [
                            {
                                $or: [
                                    { $gte: ['$userRating', 4] },
                                    { $eq: ['$wasUsed', true] },
                                    { $eq: ['$savedAsTemplate', true] }
                                ]
                            },
                            1,
                            0
                        ]
                    }
                },
                avgConfidence: { $avg: '$confidence' },
                avgRating: { $avg: '$userRating' },
                categoriesUsed: { $addToSet: '$category' }
            }
        }
    ]);
};

export default mongoose.model('PromptGeneration', promptGenerationSchema);