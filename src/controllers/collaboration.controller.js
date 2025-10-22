import Collaboration from '../models/collaboration.model.js';
import emailService from '../services/email.service.js';

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
          error: 'Email is required'
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
          error: 'User already invited'
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

      // Generate invitation link
      const invitationToken = `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const invitationLink = `${req.protocol}://${req.get('host')}/invitation/${invitationToken}`;

      // Try to send email invitation
      let emailStatus = { sent: false, error: 'Email service not configured' };
      
      try {
        console.log('📧 Attempting to send invitation email...');
        const emailResult = await emailService.sendInvitationEmail({
          to: email,
          inviterName: 'Team Member', // TODO: Get from authenticated user
          chatTitle: `Chat ${chatId}`, // TODO: Get actual chat title
          invitationLink,
          role
        });
        
        if (emailResult.success) {
          emailStatus = { sent: true, messageId: emailResult.messageId };
          console.log('✅ Invitation email sent successfully');
        } else {
          emailStatus = { sent: false, error: emailResult.error };
          console.log('❌ Failed to send invitation email:', emailResult.error);
        }
      } catch (error) {
        console.error('❌ Email sending error:', error);
        emailStatus = { sent: false, error: error.message };
      }

      res.json({
        success: true,
        collaboration,
        invitationLink,
        emailStatus,
        message: 'User invited successfully'
      });
    } catch (error) {
      console.error('Invite user error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to invite user'
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
  },

  // Update collaborator role (new route pattern)
  updateCollaboratorRole: async (req, res) => {
    try {
      const { chatId, collaboratorId } = req.params;
      const { role } = req.body;

      if (!role || !['viewer', 'editor', 'owner'].includes(role)) {
        return res.status(400).json({
          success: false,
          error: 'Valid role is required (viewer, editor, owner)'
        });
      }

      let collaboration = collaborations.get(chatId);
      if (!collaboration) {
        return res.status(404).json({
          success: false,
          error: 'Collaboration not found'
        });
      }

      const collaborator = collaboration.collaborators.find(c => c._id === collaboratorId);
      if (!collaborator) {
        return res.status(404).json({
          success: false,
          error: 'Collaborator not found'
        });
      }

      collaborator.role = role;
      collaborations.set(chatId, collaboration);

      res.json({
        success: true,
        collaboration,
        message: 'Role updated successfully'
      });
    } catch (error) {
      console.error('Update collaborator role error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update collaborator role'
      });
    }
  },

  // Remove collaborator (new route pattern)
  removeCollaborator: async (req, res) => {
    try {
      const { chatId, collaboratorId } = req.params;

      let collaboration = collaborations.get(chatId);
      if (!collaboration) {
        return res.status(404).json({
          success: false,
          error: 'Collaboration not found'
        });
      }

      collaboration.collaborators = collaboration.collaborators.filter(c => c._id !== collaboratorId);
      collaborations.set(chatId, collaboration);

      res.json({
        success: true,
        collaboration,
        message: 'Collaborator removed successfully'
      });
    } catch (error) {
      console.error('Remove collaborator error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to remove collaborator'
      });
    }
  },

  // Generate share link
  generateShareLink: async (req, res) => {
    try {
      const { chatId } = req.params;
      const { expiryDays = 7, role = 'viewer' } = req.body;

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
        collaborations.set(chatId, collaboration);
      }

      // Generate share token
      const shareToken = `share_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + expiryDays);

      // Update collaboration with share link info
      collaboration.shareLink = shareToken;
      collaboration.shareLinkEnabled = true;
      collaboration.shareLinkExpiry = expiryDate.toISOString();
      collaboration.shareLinkRole = role;
      
      collaborations.set(chatId, collaboration);

      const shareUrl = `${req.protocol}://${req.get('host')}/invitation/${shareToken}`;

      res.json({
        success: true,
        shareToken,
        shareUrl,
        expiryDate: expiryDate.toISOString(),
        role,
        message: 'Share link generated successfully'
      });
    } catch (error) {
      console.error('Generate share link error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate share link'
      });
    }
  }
};

export default collaborationController;