import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const messageSchema = new mongoose.Schema({
    role: {
        type: String,
        enum: ['user', 'assistant'],
        required: true
    },
    content: {
        type: String,
        required: true
    },
    model: {
        type: String,
        required: false // Only for assistant messages
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

const chatSchema = new mongoose.Schema({
    userId: {
        type: String, // Changed to String to support temp user IDs
        ref: 'User',
        required: false // Made optional for guest users
    },
    sessionId: {
        type: String, // Local session ID for tracking
        unique: true,
        sparse: true,
        default: () => uuidv4()
    },
    messages: [messageSchema],
    model: {
        type: String,
        required: true
    },
    mode: {
        type: String,
        enum: ['manual', 'auto'],
        default: 'manual'
    },
    title: {
        type: String,
        default: function() {
            return this.messages[0]?.content?.substring(0, 50) + '...' || 'New Chat';
        }
    },
    isCollaborative: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Index for faster queries
chatSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model('Chat', chatSchema);