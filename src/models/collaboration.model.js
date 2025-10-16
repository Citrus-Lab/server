import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const collaboratorSchema = new mongoose.Schema({
    userId: {
        type: String, // Changed from ObjectId to String
        ref: 'User',
        required: false // Can be null for email invites not yet registered
    },
    email: {
        type: String,
        required: true
    },
    name: {
        type: String,
        default: ''
    },
    role: {
        type: String,
        enum: ['owner', 'editor', 'viewer'],
        default: 'viewer'
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected'],
        default: 'pending'
    },
    invitedAt: {
        type: Date,
        default: Date.now
    },
    acceptedAt: {
        type: Date
    }
});

const collaborationSchema = new mongoose.Schema({
    chatId: {
        type: String, // Changed from ObjectId to String to support local session IDs
        required: true
    },
    projectName: {
        type: String,
        default: 'Untitled Project'
    },
    owner: {
        type: String, // Changed from ObjectId to String to support temp user IDs
        required: true
    },
    collaborators: [collaboratorSchema],
    shareLink: {
        type: String,
        sparse: true,
        default: () => uuidv4()
    },
    shareLinkEnabled: {
        type: Boolean,
        default: false
    },
    shareLinkExpiry: {
        type: Date
    },
    settings: {
        allowComments: {
            type: Boolean,
            default: true
        },
        allowEditing: {
            type: Boolean,
            default: true
        },
        requireApproval: {
            type: Boolean,
            default: false
        }
    },
    activeUsers: [{
        userId: {
            type: String, // Changed from ObjectId to String
            ref: 'User'
        },
        email: String,
        name: String,
        lastActive: {
            type: Date,
            default: Date.now
        },
        cursor: {
            position: Number,
            color: String
        }
    }]
}, {
    timestamps: true
});

// Index for faster queries
collaborationSchema.index({ chatId: 1 });
collaborationSchema.index({ owner: 1 });
collaborationSchema.index({ 'collaborators.email': 1 });
collaborationSchema.index({ shareLink: 1 });

export default mongoose.model('Collaboration', collaborationSchema);
