import { Server } from 'socket.io';
import Collaboration from '../models/collaboration.model.js';

class SocketService {
  constructor() {
    this.io = null;
    this.users = new Map(); // userId -> socketId
    this.chatRooms = new Map(); // chatId -> Set of socketIds
  }

  initialize(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.SOCKET_CORS_ORIGIN || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true
      }
    });

    this.io.on('connection', (socket) => {
      console.log(`✅ User connected: ${socket.id}`);

      // Handle user identification
      socket.on('identify', async (userData) => {
        socket.userData = userData;
        this.users.set(userData.email, socket.id);
        console.log(`👤 User identified: ${userData.email}`);
      });

      // Join a chat room
      socket.on('join-chat', async ({ chatId, user }) => {
        try {
          socket.join(`chat-${chatId}`);
          
          // Add to chat room tracking
          if (!this.chatRooms.has(chatId)) {
            this.chatRooms.set(chatId, new Set());
          }
          this.chatRooms.get(chatId).add(socket.id);

          // Update active users in collaboration
          await this.updateActiveUser(chatId, user, socket.id);

          // Notify others in the room
          socket.to(`chat-${chatId}`).emit('user-joined', {
            user: user,
            timestamp: new Date()
          });

          // Send current active users to the joining user
          const activeUsers = await this.getActiveUsers(chatId);
          socket.emit('active-users', activeUsers);

          console.log(`📥 User ${user.email} joined chat ${chatId}`);
        } catch (error) {
          console.error('Join chat error:', error);
          socket.emit('error', { message: 'Failed to join chat' });
        }
      });

      // Leave a chat room
      socket.on('leave-chat', async ({ chatId, user }) => {
        try {
          socket.leave(`chat-${chatId}`);
          
          // Remove from chat room tracking
          if (this.chatRooms.has(chatId)) {
            this.chatRooms.get(chatId).delete(socket.id);
          }

          // Notify others
          socket.to(`chat-${chatId}`).emit('user-left', {
            user: user,
            timestamp: new Date()
          });

          console.log(`📤 User ${user.email} left chat ${chatId}`);
        } catch (error) {
          console.error('Leave chat error:', error);
        }
      });

      // Send message
      socket.on('send-message', async ({ chatId, message, user }) => {
        try {
          // Broadcast to all users in the chat room
          this.io.to(`chat-${chatId}`).emit('new-message', {
            id: Date.now(),
            text: message,
            sender: user,
            timestamp: new Date()
          });

          console.log(`💬 Message in chat ${chatId} from ${user.email}`);
        } catch (error) {
          console.error('Send message error:', error);
          socket.emit('error', { message: 'Failed to send message' });
        }
      });

      // Typing indicator
      socket.on('typing', ({ chatId, user }) => {
        socket.to(`chat-${chatId}`).emit('user-typing', {
          user: user,
          timestamp: new Date()
        });
      });

      socket.on('stop-typing', ({ chatId, user }) => {
        socket.to(`chat-${chatId}`).emit('user-stop-typing', {
          user: user
        });
      });

      // Presence update
      socket.on('presence-update', async ({ chatId, user, cursor }) => {
        try {
          await this.updateActiveUser(chatId, user, socket.id, cursor);
          
          // Broadcast presence to others
          socket.to(`chat-${chatId}`).emit('presence-changed', {
            user: user,
            cursor: cursor,
            timestamp: new Date()
          });
        } catch (error) {
          console.error('Presence update error:', error);
        }
      });

      // Handle invitation accepted
      socket.on('invitation-accepted', ({ chatId, user }) => {
        // Notify all users in the chat
        this.io.to(`chat-${chatId}`).emit('collaborator-joined', {
          user: user,
          timestamp: new Date()
        });
        console.log(`✅ ${user.email} accepted invitation to chat ${chatId}`);
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`❌ User disconnected: ${socket.id}`);
        
        // Remove from all chat rooms
        this.chatRooms.forEach((sockets, chatId) => {
          if (sockets.has(socket.id)) {
            sockets.delete(socket.id);
            
            // Notify others if user was identified
            if (socket.userData) {
              this.io.to(`chat-${chatId}`).emit('user-left', {
                user: socket.userData,
                timestamp: new Date()
              });
            }
          }
        });

        // Remove from users map
        if (socket.userData) {
          this.users.delete(socket.userData.email);
        }
      });
    });

    console.log('🔌 Socket.io initialized');
  }

  async updateActiveUser(chatId, user, socketId, cursor = null) {
    try {
      const collaboration = await Collaboration.findOne({ chatId });
      if (!collaboration) return;

      const existingUserIndex = collaboration.activeUsers.findIndex(
        u => u.email === user.email
      );

      const userData = {
        email: user.email,
        name: user.name,
        lastActive: new Date(),
        cursor: cursor || { position: 0, color: this.generateUserColor(user.email) }
      };

      if (existingUserIndex >= 0) {
        collaboration.activeUsers[existingUserIndex] = userData;
      } else {
        collaboration.activeUsers.push(userData);
      }

      // Remove inactive users (not active for more than 5 minutes)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      collaboration.activeUsers = collaboration.activeUsers.filter(
        u => u.lastActive > fiveMinutesAgo
      );

      await collaboration.save();
    } catch (error) {
      console.error('Update active user error:', error);
    }
  }

  async getActiveUsers(chatId) {
    try {
      const collaboration = await Collaboration.findOne({ chatId });
      if (!collaboration) return [];

      // Filter out inactive users
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      return collaboration.activeUsers.filter(
        u => u.lastActive > fiveMinutesAgo
      );
    } catch (error) {
      console.error('Get active users error:', error);
      return [];
    }
  }

  generateUserColor(email) {
    // Generate consistent color based on email
    let hash = 0;
    for (let i = 0; i < email.length; i++) {
      hash = email.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = hash % 360;
    return `hsl(${hue}, 70%, 60%)`;
  }

  // Emit event to specific chat room
  emitToChatRoom(chatId, event, data) {
    if (this.io) {
      this.io.to(`chat-${chatId}`).emit(event, data);
    }
  }

  // Emit event to specific user
  emitToUser(userEmail, event, data) {
    const socketId = this.users.get(userEmail);
    if (socketId && this.io) {
      this.io.to(socketId).emit(event, data);
    }
  }

  // Get online status of a user
  isUserOnline(userEmail) {
    return this.users.has(userEmail);
  }

  // Get all users in a chat room
  getUsersInChat(chatId) {
    const sockets = this.chatRooms.get(chatId);
    if (!sockets) return [];
    
    return Array.from(sockets).map(socketId => {
      const socket = this.io.sockets.sockets.get(socketId);
      return socket?.userData;
    }).filter(Boolean);
  }
}

export default new SocketService();
