import Collaboration from '../models/collaboration.model.js';
import Chat from '../models/chat.model.js';
import User from '../models/user.model.js';
import { v4 as uuidv4 } from 'uuid';
import emailService from '../services/email.service.js';
import socketService from '../services/socket.service.js';

// Create or get collaboration for a chat
export const getOrCreateCollaboration = async (req, res) => {
    try {
        const { chatId } = req.params;
        const userId = req.user?._id || req.body.userId || 'temp-user-id'; // Support both auth and test mode
        
        console.log('🔍 DEBUG: Get/Create Collaboration Request');
        console.log('   Chat ID:', chatId);
        console.log('   User ID:', userId);
        console.log('   Request method:', req.method);
        console.log('   Request body:', JSON.stringify(req.body, null, 2));

        // Validate chatId exists
        if (!chatId) {
            return res.status(400).json({ error: 'Chat ID is required' });
        }

        console.log('🔍 Looking for collaboration with chatId:', chatId);

        // Find existing collaboration
        let collaboration = await Collaboration.findOne({ chatId });

        if (!collaboration) {
            console.log('📝 Creating new collaboration for chatId:', chatId);
            
            // Try to find or create chat for metadata
            let chat = null;
            try {
                // Try to find by _id if it's a valid ObjectId, otherwise by sessionId
                if (chatId.match(/^[0-9a-fA-F]{24}$/)) {
                    chat = await Chat.findById(chatId);
                } else {
                    chat = await Chat.findOne({ sessionId: chatId });
                }

                // If chat doesn't exist, create a placeholder
                if (!chat) {
                    console.log('📝 Creating placeholder chat for sessionId:', chatId);
                    try {
                        chat = await Chat.create({
                            sessionId: chatId,
                            userId: userId,
                            model: 'gpt-3.5-turbo',
                            mode: 'manual',
                            title: 'New Chat',
                            messages: [],
                            isCollaborative: true
                        });
                    } catch (createErr) {
                        // If chat creation fails (e.g., duplicate sessionId), try to find it again
                        console.warn('⚠️ Chat creation failed, attempting to find existing:', createErr.message);
                        chat = await Chat.findOne({ sessionId: chatId });
                    }
                }
            } catch (err) {
                console.warn('⚠️ Chat lookup/create failed:', err.message);
            }

            // Create new collaboration
            collaboration = await Collaboration.create({
                chatId,
                owner: userId,
                projectName: chat?.title || 'New Chat',
                collaborators: [],
                shareLinkEnabled: false,
                activeUsers: []
            });
        
            console.log('✅ DEBUG: New collaboration created:', {
                id: collaboration._id,
                chatId: collaboration.chatId,
                owner: collaboration.owner,
                projectName: collaboration.projectName
            });
        } else {
            console.log('✅ Found existing collaboration:', collaboration._id);
        }

        res.json({ collaboration });
    } catch (error) {
        console.error('❌ Get/Create Collaboration Error:', error);
        res.status(500).json({ error: error.message });
    }
};

// Invite collaborator by email
export const inviteCollaborator = async (req, res) => {
    try {
        const { chatId } = req.params;
        const { email, role = 'viewer', name } = req.body;
        const userId = req.user?._id || req.body.userId;

        console.log('🔍 DEBUG: Invite Collaborator Request');
        console.log('   Chat ID:', chatId);
        console.log('   Email:', email);
        console.log('   Role:', role);
        console.log('   Name:', name);
        console.log('   User ID:', userId);
        console.log('   Request Body:', JSON.stringify(req.body, null, 2));
        console.log('   Environment Check:');
        console.log('     - FRONTEND_URL:', process.env.FRONTEND_URL || 'NOT SET');
        console.log('     - SENDGRID_API_KEY:', process.env.SENDGRID_API_KEY ? 'SET ✓' : 'NOT SET ✗');
        console.log('     - SENDGRID_FROM_EMAIL:', process.env.SENDGRID_FROM_EMAIL || 'NOT SET');
        console.log('     - EMAIL_SERVICE:', process.env.EMAIL_SERVICE || 'NOT SET');
        console.log('     - EMAIL_USER:', process.env.EMAIL_USER ? 'SET ✓' : 'NOT SET ✗');

        if (!email) {
            console.log('❌ DEBUG: Email is required');
            return res.status(400).json({ error: 'Email is required' });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            console.log('❌ DEBUG: Invalid email format:', email);
            return res.status(400).json({ error: 'Invalid email format' });
        }

        // Find collaboration
        const collaboration = await Collaboration.findOne({ chatId });
        if (!collaboration) {
            return res.status(404).json({ error: 'Collaboration not found' });
        }

        // Check if user is owner
        if (collaboration.owner.toString() !== userId?.toString()) {
            return res.status(403).json({ error: 'Only owner can invite collaborators' });
        }

        // Check if already invited
        const existingCollaborator = collaboration.collaborators.find(
            c => c.email.toLowerCase() === email.toLowerCase()
        );

        if (existingCollaborator) {
            return res.status(400).json({ error: 'User already invited' });
        }

        // Try to find user by email (optional)
        let user = null;
        try {
            user = await User.findOne({ email: email.toLowerCase() });
        } catch (err) {
            console.warn('User lookup failed:', err.message);
        }

        // Add collaborator
        collaboration.collaborators.push({
            userId: user?._id,
            email: email.toLowerCase(),
            name: name || user?.name || email.split('@')[0],
            role,
            status: 'pending'
        });

        await collaboration.save();

        // Generate invitation link using UUID
        const invitationToken = uuidv4();
        collaboration.shareLink = invitationToken;
        collaboration.shareLinkEnabled = true;
        await collaboration.save();

        const invitationLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/invitation/${invitationToken}`;
        
        console.log('📧 DEBUG: Preparing to send invitation email...');
        console.log('   To:', email);
        console.log('   Link:', invitationLink);
        console.log('   Token:', invitationToken);
        console.log('   Collaboration ID:', collaboration._id);
        console.log('   Share Link Enabled:', collaboration.shareLinkEnabled);

        // Try to get chat and inviter info, but don't fail if not found
        let chat = null;
        let inviter = null;
        try {
            // Try to find chat by _id if it's a valid ObjectId, otherwise by custom id field
            if (chatId.match(/^[0-9a-fA-F]{24}$/)) {
                chat = await Chat.findById(chatId);
            } else {
                chat = await Chat.findOne({ id: chatId });
            }
            
            // Try to find user if userId is valid
            if (userId && userId.match(/^[0-9a-fA-F]{24}$/)) {
                inviter = await User.findById(userId);
            }
        } catch (err) {
            console.warn('Chat/User lookup failed:', err.message);
        }
        
        // Send email invitation
        let emailResult = null;
        try {
            console.log('📤 DEBUG: Attempting to send invitation email...');
            console.log('   Email Service Initialized:', emailService.initialized);
            console.log('   Has Transporter:', !!emailService.transporter);
            
            emailResult = await emailService.sendInvitationEmail({
                to: email,
                inviterName: inviter?.name || 'A team member',
                chatTitle: chat?.title || 'Untitled Chat',
                invitationLink: invitationLink,
                role: role
            });
            
            console.log('📧 DEBUG: Email service response:', JSON.stringify(emailResult, null, 2));
            
            if (emailResult.success) {
                console.log('✅ DEBUG: Invitation email sent successfully to:', email);
                console.log('   Message ID:', emailResult.messageId);
                console.log('   Response:', emailResult.response);
                console.log('   Accepted:', emailResult.accepted);
                console.log('   Rejected:', emailResult.rejected);
            } else {
                console.error('❌ DEBUG: Failed to send invitation email');
                console.error('   Error:', emailResult.error);
                console.error('   Code:', emailResult.code);
                console.error('   Response Code:', emailResult.responseCode);
                console.error('   Original Error:', emailResult.originalError);
                // Still continue with the request but include email status in response
            }
        } catch (emailError) {
            console.error('❌ DEBUG: Email service exception:', emailError);
            console.error('   Error Message:', emailError.message);
            console.error('   Error Stack:', emailError.stack);
            emailResult = { success: false, error: emailError.message };
        }

        // Notify via WebSocket if user is online (optional)
        try {
            socketService.emitToUser(email, 'invitation-received', {
                chatId,
                inviter: inviter?.name || 'A team member',
                chatTitle: chat?.title || 'Untitled Chat',
                role
            });
        } catch (socketError) {
            console.warn('WebSocket notification failed:', socketError.message);
        }

        const response = { 
            message: 'Collaborator invited successfully',
            collaboration,
            invitationLink,
            emailStatus: {
                sent: emailResult?.success || false,
                error: emailResult?.success ? null : emailResult?.error,
                messageId: emailResult?.messageId,
                debug: {
                    hasTransporter: !!emailService.transporter,
                    serviceInitialized: emailService.initialized,
                    sendgridConfigured: !!process.env.SENDGRID_API_KEY,
                    gmailConfigured: !!(process.env.EMAIL_SERVICE === 'gmail' && process.env.EMAIL_USER),
                    fromEmail: process.env.SENDGRID_FROM_EMAIL || process.env.EMAIL_USER || 'noreply@citruslab.dev'
                }
            }
        };
        
        console.log('✅ DEBUG: Sending response:', JSON.stringify(response, null, 2));
        res.json(response);
    } catch (error) {
        console.error('Invite Collaborator Error:', error);
        res.status(500).json({ error: error.message });
    }
};

// Update collaborator role
export const updateCollaboratorRole = async (req, res) => {
    try {
        const { chatId, collaboratorId } = req.params;
        const { role } = req.body;
        const userId = req.user?._id || req.body.userId;

        const collaboration = await Collaboration.findOne({ chatId });
        if (!collaboration) {
            return res.status(404).json({ error: 'Collaboration not found' });
        }

        // Check if user is owner
        if (collaboration.owner.toString() !== userId?.toString()) {
            return res.status(403).json({ error: 'Only owner can update roles' });
        }

        // Find and update collaborator
        const collaborator = collaboration.collaborators.id(collaboratorId);
        if (!collaborator) {
            return res.status(404).json({ error: 'Collaborator not found' });
        }

        collaborator.role = role;
        await collaboration.save();

        res.json({ 
            message: 'Role updated successfully',
            collaboration 
        });
    } catch (error) {
        console.error('Update Role Error:', error);
        res.status(500).json({ error: error.message });
    }
};

// Remove collaborator
export const removeCollaborator = async (req, res) => {
    try {
        const { chatId, collaboratorId } = req.params;
        const userId = req.user?._id || req.body.userId;

        const collaboration = await Collaboration.findOne({ chatId });
        if (!collaboration) {
            return res.status(404).json({ error: 'Collaboration not found' });
        }

        // Check if user is owner
        if (collaboration.owner.toString() !== userId?.toString()) {
            return res.status(403).json({ error: 'Only owner can remove collaborators' });
        }

        // Remove collaborator
        collaboration.collaborators.pull(collaboratorId);
        await collaboration.save();

        res.json({ 
            message: 'Collaborator removed successfully',
            collaboration 
        });
    } catch (error) {
        console.error('Remove Collaborator Error:', error);
        res.status(500).json({ error: error.message });
    }
};

// Generate share link
export const generateShareLink = async (req, res) => {
    try {
        const { chatId } = req.params;
        const { expiryDays = 7, role = 'viewer' } = req.body;
        const userId = req.user?._id || req.body.userId;

        console.log('🔗 DEBUG: Generate Share Link Request');
        console.log('   Chat ID:', chatId);
        console.log('   Expiry Days:', expiryDays);
        console.log('   Role:', role);
        console.log('   User ID:', userId);
        console.log('   Request Body:', JSON.stringify(req.body, null, 2));

        const collaboration = await Collaboration.findOne({ chatId });
        if (!collaboration) {
            console.log('❌ DEBUG: Collaboration not found for chatId:', chatId);
            return res.status(404).json({ error: 'Collaboration not found' });
        }
        
        console.log('✅ DEBUG: Found collaboration:', collaboration._id);

        // Check if user is owner
        if (collaboration.owner.toString() !== userId?.toString()) {
            return res.status(403).json({ error: 'Only owner can generate share links' });
        }

        // Generate unique share link using UUID
        const shareToken = uuidv4();
        collaboration.shareLink = shareToken;
        collaboration.shareLinkEnabled = true;
        
        if (expiryDays > 0) {
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + expiryDays);
            collaboration.shareLinkExpiry = expiryDate;
            console.log('📅 DEBUG: Set expiry date:', expiryDate);
        }

        await collaboration.save();
        console.log('💾 DEBUG: Collaboration saved with share link');

        const shareUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/invitation/${shareToken}`;
        console.log('🔗 DEBUG: Generated share URL:', shareUrl);

        const response = { 
            message: 'Share link generated successfully',
            shareUrl,
            shareToken,
            expiresAt: collaboration.shareLinkExpiry
        };
        
        console.log('✅ DEBUG: Share link response:', JSON.stringify(response, null, 2));
        res.json(response);
    } catch (error) {
        console.error('Generate Share Link Error:', error);
        res.status(500).json({ error: error.message });
    }
};

// Disable share link
export const disableShareLink = async (req, res) => {
    try {
        const { chatId } = req.params;
        const userId = req.user?._id || req.body.userId;

        const collaboration = await Collaboration.findOne({ chatId });
        if (!collaboration) {
            return res.status(404).json({ error: 'Collaboration not found' });
        }

        // Check if user is owner
        if (collaboration.owner.toString() !== userId?.toString()) {
            return res.status(403).json({ error: 'Only owner can disable share links' });
        }

        collaboration.shareLinkEnabled = false;
        await collaboration.save();

        res.json({ 
            message: 'Share link disabled successfully',
            collaboration 
        });
    } catch (error) {
        console.error('Disable Share Link Error:', error);
        res.status(500).json({ error: error.message });
    }
};

// Access shared chat via link
export const accessSharedChat = async (req, res) => {
    try {
        const { shareToken } = req.params;

        console.log('🔍 DEBUG: Accessing shared chat with token:', shareToken);
        console.log('   Request URL:', req.originalUrl);
        console.log('   Request Method:', req.method);
        console.log('   Request Headers:', JSON.stringify(req.headers, null, 2));

        const collaboration = await Collaboration.findOne({ 
            shareLink: shareToken,
            shareLinkEnabled: true
        });

        console.log('🔍 DEBUG: Database query result:');
        console.log('   Found collaboration:', !!collaboration);
        if (collaboration) {
            console.log('   Collaboration ID:', collaboration._id);
            console.log('   Chat ID:', collaboration.chatId);
            console.log('   Share Link Enabled:', collaboration.shareLinkEnabled);
            console.log('   Share Link Expiry:', collaboration.shareLinkExpiry);
            console.log('   Collaborators:', collaboration.collaborators.length);
        }

        if (!collaboration) {
            console.log('❌ DEBUG: Collaboration not found for token:', shareToken);
            // Let's also check if there are any collaborations with this token but disabled
            const disabledCollab = await Collaboration.findOne({ shareLink: shareToken });
            if (disabledCollab) {
                console.log('⚠️ DEBUG: Found collaboration but share link is disabled');
                console.log('   Collaboration ID:', disabledCollab._id);
                console.log('   Share Link Enabled:', disabledCollab.shareLinkEnabled);
            }
            return res.status(404).json({ error: 'Invalid or expired invitation link' });
        }

        // Check if link is expired
        if (collaboration.shareLinkExpiry && new Date() > collaboration.shareLinkExpiry) {
            console.log('❌ DEBUG: Invitation link expired:', shareToken);
            console.log('   Expiry Date:', collaboration.shareLinkExpiry);
            console.log('   Current Date:', new Date());
            return res.status(403).json({ error: 'Invitation link has expired' });
        }

        console.log('✅ DEBUG: Valid invitation found:', collaboration._id);

        // Try to get chat details
        let chat = null;
        try {
            if (collaboration.chatId.match(/^[0-9a-fA-F]{24}$/)) {
                chat = await Chat.findById(collaboration.chatId);
            } else {
                chat = await Chat.findOne({ sessionId: collaboration.chatId });
            }
        } catch (err) {
            console.warn('Chat lookup failed:', err.message);
        }

        // Find the invited collaborator (if any)
        const invitedCollaborator = collaboration.collaborators.find(c => c.status === 'pending');
        console.log('👤 DEBUG: Invited collaborator:', invitedCollaborator ? invitedCollaborator.email : 'None found');

        const response = { 
            chatId: collaboration.chatId,
            chatTitle: chat?.title || collaboration.projectName || 'Untitled Chat',
            inviterName: 'Team Member',
            invitedEmail: invitedCollaborator?.email || '',
            role: invitedCollaborator?.role || 'viewer',
            collaboration
        };
        
        console.log('✅ DEBUG: Access shared chat response:', JSON.stringify({
            ...response,
            collaboration: { id: response.collaboration._id, chatId: response.collaboration.chatId }
        }, null, 2));
        
        res.json(response);
    } catch (error) {
        console.error('❌ DEBUG: Access Shared Chat Error:', error);
        console.error('   Error Message:', error.message);
        console.error('   Error Stack:', error.stack);
        res.status(500).json({ error: error.message });
    }
};

// Update active users (for real-time presence)
export const updateActiveUser = async (req, res) => {
    try {
        const { chatId } = req.params;
        const { email, name, cursor } = req.body;
        const userId = req.user?._id;

        const collaboration = await Collaboration.findOne({ chatId });
        if (!collaboration) {
            return res.status(404).json({ error: 'Collaboration not found' });
        }

        // Update or add active user
        const existingUserIndex = collaboration.activeUsers.findIndex(
            u => u.email === email || (userId && u.userId?.toString() === userId.toString())
        );

        const activeUserData = {
            userId,
            email,
            name,
            lastActive: new Date(),
            cursor: cursor || { position: 0, color: `#${Math.floor(Math.random()*16777215).toString(16)}` }
        };

        if (existingUserIndex >= 0) {
            collaboration.activeUsers[existingUserIndex] = activeUserData;
        } else {
            collaboration.activeUsers.push(activeUserData);
        }

        // Remove inactive users (not active for more than 5 minutes)
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        collaboration.activeUsers = collaboration.activeUsers.filter(
            u => u.lastActive > fiveMinutesAgo
        );

        await collaboration.save();

        res.json({ 
            activeUsers: collaboration.activeUsers 
        });
    } catch (error) {
        console.error('Update Active User Error:', error);
        res.status(500).json({ error: error.message });
    }
};

// Get active users
export const getActiveUsers = async (req, res) => {
    try {
        const { chatId } = req.params;

        const collaboration = await Collaboration.findOne({ chatId });
        if (!collaboration) {
            return res.status(404).json({ error: 'Collaboration not found' });
        }

        // Remove inactive users
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        collaboration.activeUsers = collaboration.activeUsers.filter(
            u => u.lastActive > fiveMinutesAgo
        );

        await collaboration.save();

        res.json({ 
            activeUsers: collaboration.activeUsers 
        });
    } catch (error) {
        console.error('Get Active Users Error:', error);
        res.status(500).json({ error: error.message });
    }
};
