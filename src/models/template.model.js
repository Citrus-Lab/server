import mongoose from 'mongoose';

const templateSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    description: {
        type: String,
        maxlength: 500
    },
    // Core template fields
    persona: {
        type: String,
        maxlength: 200,
        description: "AI role/character (e.g., 'Expert Python Developer')"
    },
    context: {
        type: String,
        maxlength: 1000,
        description: "Background information for the AI"
    },
    instruction: {
        type: String,
        maxlength: 1000,
        description: "Main task or instruction"
    },
    format: {
        type: String,
        maxlength: 300,
        description: "Expected output format"
    },
    tone: {
        type: String,
        enum: ['professional', 'casual', 'friendly', 'formal', 'creative', 'technical', 'conversational'],
        default: 'professional'
    },
    inputData: {
        type: String,
        maxlength: 2000,
        description: "Reference data or examples"
    },
    thinkingPoints: {
        type: String,
        maxlength: 500,
        description: "Key areas to focus on"
    },
    warnings: {
        type: String,
        maxlength: 500,
        description: "Restrictions or things to avoid"
    },
    askMe: {
        type: String,
        maxlength: 300,
        description: "Questions AI should ask for clarification"
    },
    isPublic: {
        type: Boolean,
        default: false,
        description: "Whether template is shareable with other users"
    },
    tags: [{
        type: String,
        trim: true,
        maxlength: 30
    }],
    category: {
        type: String,
        enum: ['coding', 'writing', 'analysis', 'creative', 'business', 'research', 'education', 'general'],
        default: 'general'
    },
    usageCount: {
        type: Number,
        default: 0
    },
    rating: {
        totalRating: { type: Number, default: 0 },
        ratingCount: { type: Number, default: 0 },
        averageRating: { type: Number, default: 0 }
    },
    // Template structure for frontend
    structure: {
        actAs: { type: String, maxlength: 200 },
        deeplyThinkAbout: { type: String, maxlength: 500 },
        warning: { type: String, maxlength: 500 }
    }
}, {
    timestamps: true
});

// Indexes for better performance
templateSchema.index({ userId: 1, createdAt: -1 });
templateSchema.index({ isPublic: 1, category: 1 });
templateSchema.index({ tags: 1 });
templateSchema.index({ 'rating.averageRating': -1 });

// Virtual for formatted template
templateSchema.virtual('formattedTemplate').get(function() {
    let template = '';
    
    if (this.persona) {
        template += `Act as: ${this.persona}\n\n`;
    }
    
    if (this.context) {
        template += `Context: ${this.context}\n\n`;
    }
    
    if (this.thinkingPoints) {
        template += `Deeply think about: ${this.thinkingPoints}\n\n`;
    }
    
    if (this.instruction) {
        template += `Task: ${this.instruction}\n\n`;
    }
    
    if (this.format) {
        template += `Format: ${this.format}\n\n`;
    }
    
    if (this.warnings) {
        template += `Warning/Restrictions: ${this.warnings}\n\n`;
    }
    
    if (this.askMe) {
        template += `Ask me: ${this.askMe}\n\n`;
    }
    
    template += '[Your specific question/request here]';
    
    return template;
});

// Method to increment usage
templateSchema.methods.incrementUsage = function() {
    this.usageCount += 1;
    return this.save();
};

// Method to add rating
templateSchema.methods.addRating = function(rating) {
    this.rating.totalRating += rating;
    this.rating.ratingCount += 1;
    this.rating.averageRating = this.rating.totalRating / this.rating.ratingCount;
    return this.save();
};

export default mongoose.model('Template', templateSchema);