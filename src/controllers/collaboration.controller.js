import Collaboration from '../models/collaboration.model.js';

// In-memory storage for demo (replace with database in production)
let collaborations = new Map();
let activeUsers = new Map();
let messages = new Map();

const collaborationController = {
  // Get collaboration data
  getCollaboration: async (req, res) => {
    try {
      const { chatId } = req.params;
      
      let collaboration = collaborations.get(chatId);
      if (!collaboration) {
        // Create default collaboration
        collaboration = {
          chatId,
          collaborators: [],
          settings: {
            notifications: true,
            soundEnabled: true
          },
          createdAt: new Date().toISOString()
        };
        collaborations.set(chatId, collaboration);
      }

      res.json({
        success: true,
        collaboration
      });
    } catch (error) {
      console.error('Get collaboration error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get collaboration data'
      });
    }
  },

  // Get active users
  getActiveUsers: async (req, res) => {
    try {
      const { chatId } = req.params;
      
      const chatActiveUsers = activeUsers.get(chatId) || [];
      
      // Filter out users who haven't been active in the last 5 minutes
      const now = new Date();
      const activeThreshold = 5 * 60 * 1000; // 5 minutes
      
      const currentlyActive = chatActiveUsers.filter(user => {
        const lastActive = new Date(user.lastActive);
        return (now - lastActive) < activeThreshold;
      });

      // Update the active users list
      activeUsers.set(chatId, currentlyActive);

      res.json({
        success: true,
        activeUsers: currentlyActive
      });
    } catch (error) {
      console.error('Get active users error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get active users'
      });
    }
  },

  // Update user presence
  updatePresence: async (req, res) => {
    try {
      const { chatId } = req.params;
      const { email, name, cursor } = req.body;

      if (!email || !name) {
        return res.status(400).json({
          success: false,
          message: 'Email and name are required'
        });
      }

      let chatActiveUsers = activeUsers.get(chatId) || [];
      
      // Remove existing entry for this user
      chatActiveUsers = chatActiveUsers.filter(user => user.email !== email);
      
      // Add updated user
      chatActiveUsers.push({
        email,
        name,
        lastActive: new Date().toISOString(),
        cursor: cursor || null
      });

      activeUsers.set(chatId, chatActiveUsers);

      res.json({
        success: true,
        message: 'Presence updated successfully'
      });
    } catch (error) {
      console.error('Update presence error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update presence'
      });
    }
  },

  // Invite user
  inviteUser: async (req, res) => {
    try {
      const { chatId } = req.params;
      const { email, role = 'viewer' } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email is required'
        });
      }

      let collaboration = collaborations.get(chatId);
      if (!collaboration) {
        collaboration = {
          chatId,
          collaborators: [],
          settings: {
            notifications: true,
            soundEnabled: true
          },
          createdAt: new Date().toISOString()
        };
      }

      // Check if user already exists
      const existingUser = collaboration.collaborators.find(c => c.email === email);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User already invited'
        });
      }

      // Add new collaborator
      const newCollaborator = {
        _id: Date.now().toString(),
        email,
        name: email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1),
        role,
        status: 'pending',
        invitedAt: new Date().toISOString()
      };

      collaboration.collaborators.push(newCollaborator);
      collaborations.set(chatId, collaboration);

      res.json({
        success: true,
        collaborator: newCollaborator,
        message: 'User invited successfully'
      });
    } catch (error) {
      console.error('Invite user error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to invite user'
      });
    }
  },

  // Update user role
  updateUserRole: async (req, res) => {
    try {
      const { chatId, userId } = req.params;
      const { role } = req.body;

      if (!role || !['viewer', 'editor', 'owner'].includes(role)) {
        return res.status(400).json({
          success: false,
          message: 'Valid role is required (viewer, editor, owner)'
        });
      }

      let collaboration = collaborations.get(chatId);
      if (!collaboration) {
        return res.status(404).json({
          success: false,
          message: 'Collaboration not found'
        });
      }

      const collaborator = collaboration.collaborators.find(c => c._id === userId);
      if (!collaborator) {
        return res.status(404).json({
          success: false,
          message: 'Collaborator not found'
        });
      }

      collaborator.role = role;
      collaborations.set(chatId, collaboration);

      res.json({
        success: true,
        collaborator,
        message: 'Role updated successfully'
      });
    } catch (error) {
      console.error('Update user role error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update user role'
      });
    }
  },

  // Remove user
  removeUser: async (req, res) => {
    try {
      const { chatId, userId } = req.params;

      let collaboration = collaborations.get(chatId);
      if (!collaboration) {
        return res.status(404).json({
          success: false,
          message: 'Collaboration not found'
        });
      }

      collaboration.collaborators = collaboration.collaborators.filter(c => c._id !== userId);
      collaborations.set(chatId, collaboration);

      res.json({
        success: true,
        message: 'User removed successfully'
      });
    } catch (error) {
      console.error('Remove user error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to remove user'
      });
    }
  },

  // Send message
  sendMessage: async (req, res) => {
    try {
      const { chatId } = req.params;
      const { content, type = 'text', sender, recipient } = req.body;

      if (!content || !sender || !recipient) {
        return res.status(400).json({
          success: false,
          message: 'Content, sender, and recipient are required'
        });
      }

      let chatMessages = messages.get(chatId) || [];
      
      const newMessage = {
        id: Date.now().toString(),
        content,
        type,
        sender,
        recipient,
        chatId,
        createdAt: new Date().toISOString()
      };

      chatMessages.push(newMessage);
      messages.set(chatId, chatMessages);

      res.json({
        success: true,
        message: newMessage
      });
    } catch (error) {
      console.error('Send message error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send message'
      });
    }
  },

  // Get messages
  getMessages: async (req, res) => {
    try {
      const { chatId } = req.params;
      const { sender, recipient } = req.query;

      let chatMessages = messages.get(chatId) || [];

      // Filter messages between sender and recipient if specified
      if (sender && recipient) {
        chatMessages = chatMessages.filter(msg => 
          (msg.sender.email === sender && msg.recipient === recipient) ||
          (msg.sender.email === recipient && msg.recipient === sender)
        );
      }

      res.json({
        success: true,
        messages: chatMessages
      });
    } catch (error) {
      console.error('Get messages error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get messages'
      });
    }
  }
};

export default collaborationController;