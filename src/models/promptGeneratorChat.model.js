import mongoose from 'mongoose';

const promptGeneratorChatSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    sessionId: {
        type: String,
        required: true,
        description: "Frontend session identifier"
    },
    title: {
        type: String,
        default: 'Prompt Generator Session',
        maxlength: 200
    },
    messages: [{
        id: { type: String, required: true },
        text: { type: String, required: true },
        sender: { 
            type: String, 
            enum: ['user', 'ai', 'system'], 
            required: true 
        },
        timestamp: { type: Date, default: Date.now },
        // For generated prompts
        promptData: {
            title: String,
            content: String,
            context: String,
            improvements: [String],
            confidence: Number,
            category: String
        }
    }],
    snippets: [{
        id: { type: String, required: true },
        text: { type: String, required: true },
        timestamp: { type: Date, default: Date.now }
    }],
    generatedPrompts: [{
        id: { type: String, required: true },
        title: { type: String, required: true },
        content: { type: String, required: true },
        context: String,
        timestamp: { type: Date, default: Date.now },
        wasUsed: { type: Boolean, default: false },
        wasInjected: { type: Boolean, default: false }
    }],
    isActive: {
        type: Boolean,
        default: true,
        description: "Whether this is the current active session"
    },
    lastActivity: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Indexes for better performance
promptGeneratorChatSchema.index({ userId: 1, createdAt: -1 });
promptGeneratorChatSchema.index({ userId: 1, sessionId: 1 });
promptGeneratorChatSchema.index({ userId: 1, isActive: 1 });

// Update last activity on save
promptGeneratorChatSchema.pre('save', function(next) {
    this.lastActivity = new Date();
    next();
});

// Method to add message
promptGeneratorChatSchema.methods.addMessage = function(messageData) {
    this.messages.push(messageData);
    this.lastActivity = new Date();
    return this.save();
};

// Method to add snippet
promptGeneratorChatSchema.methods.addSnippet = function(snippetData) {
    this.snippets.push(snippetData);
    this.lastActivity = new Date();
    return this.save();
};

// Method to add generated prompt
promptGeneratorChatSchema.methods.addGeneratedPrompt = function(promptData) {
    this.generatedPrompts.push(promptData);
    this.lastActivity = new Date();
    return this.save();
};

// Method to mark prompt as used
promptGeneratorChatSchema.methods.markPromptAsUsed = function(promptId) {
    const prompt = this.generatedPrompts.id(promptId);
    if (prompt) {
        prompt.wasUsed = true;
        this.lastActivity = new Date();
        return this.save();
    }
    return Promise.resolve(this);
};

// Method to mark prompt as injected
promptGeneratorChatSchema.methods.markPromptAsInjected = function(promptId) {
    const prompt = this.generatedPrompts.id(promptId);
    if (prompt) {
        prompt.wasInjected = true;
        this.lastActivity = new Date();
        return this.save();
    }
    return Promise.resolve(this);
};

// Static method to get or create active session
promptGeneratorChatSchema.statics.getOrCreateActiveSession = async function(userId, sessionId) {
    let session = await this.findOne({ userId, sessionId, isActive: true });
    
    if (!session) {
        session = new this({
            userId,
            sessionId,
            title: 'Prompt Generator Session',
            messages: [],
            snippets: [],
            generatedPrompts: [],
            isActive: true
        });
        await session.save();
    }
    
    return session;
};

// Static method to archive current session and create new one
promptGeneratorChatSchema.statics.resetSession = async function(userId, currentSessionId) {
    // Archive current session
    await this.updateOne(
        { userId, sessionId: currentSessionId, isActive: true },
        { isActive: false }
    );
    
    // Create new session
    const newSessionId = `pg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newSession = new this({
        userId,
        sessionId: newSessionId,
        title: 'Prompt Generator Session',
        messages: [],
        snippets: [],
        generatedPrompts: [],
        isActive: true
    });
    
    await newSession.save();
    return newSession;
};

export default mongoose.model('PromptGeneratorChat', promptGeneratorChatSchema);