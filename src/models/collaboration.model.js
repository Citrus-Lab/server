// Collaboration model for database integration
// This is a placeholder for future database implementation

const collaborationSchema = {
  chatId: {
    type: String,
    required: true,
    unique: true
  },
  collaborators: [{
    _id: String,
    email: String,
    name: String,
    role: {
      type: String,
      enum: ['viewer', 'editor', 'owner'],
      default: 'viewer'
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined'],
      default: 'pending'
    },
    invitedAt: Date,
    joinedAt: Date
  }],
  settings: {
    notifications: {
      type: Boolean,
      default: true
    },
    soundEnabled: {
      type: Boolean,
      default: true
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
};

// For now, we'll use in-memory storage
// In production, this would be a proper database model (MongoDB, PostgreSQL, etc.)

export default {
  schema: collaborationSchema,
  // Add database methods here when implementing with a real database
};