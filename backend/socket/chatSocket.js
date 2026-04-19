const jwt = require('jsonwebtoken');
const Message = require('../models/Message');
const Chat = require('../models/Chat');

// Track online users: Map<userId, Set<socketId>>
const onlineUsers = new Map();

/**
 * Initialize Socket.io event handlers
 */
function initializeSocket(io) {
  // Authenticate socket connection
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      socket.userRole = decoded.role;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.userId;
    console.log(`🔌 Socket connected: ${userId}`);

    // Track online user
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId).add(socket.id);

    // Join all chat rooms the user is a member of
    const userChats = await Chat.find({ members: userId });
    userChats.forEach(chat => {
      socket.join(chat._id.toString());
    });

    // Broadcast online users
    broadcastOnlineUsers(io);

    // ===== EVENT HANDLERS =====

    /**
     * Join a specific chat room
     */
    socket.on('joinChat', (chatId) => {
      socket.join(chatId);
    });

    /**
     * Send a message
     */
    socket.on('sendMessage', async (data) => {
      try {
        const { chatId, content } = data;

        if (!chatId || !content || !content.trim()) return;

        // Verify membership
        const chat = await Chat.findOne({ _id: chatId, members: userId });
        if (!chat) return;

        // Save message
        const message = new Message({
          chatId,
          senderId: userId,
          content: content.trim(),
          readBy: [{ userId }]
        });
        await message.save();

        // Update chat last message
        chat.lastMessage = message._id;
        await chat.save();

        // Populate sender info
        const populatedMessage = await Message.findById(message._id)
          .populate('senderId', 'name username role');

        // Emit to all members of the chat
        io.to(chatId).emit('newMessage', populatedMessage);
      } catch (error) {
        console.error('Socket sendMessage error:', error);
      }
    });

    /**
     * Typing indicator
     */
    socket.on('typing', (data) => {
      const { chatId, userName } = data;
      socket.to(chatId).emit('userTyping', { chatId, userId, userName });
    });

    /**
     * Stop typing
     */
    socket.on('stopTyping', (data) => {
      const { chatId } = data;
      socket.to(chatId).emit('userStopTyping', { chatId, userId });
    });

    /**
     * Mark messages as read
     */
    socket.on('markRead', async (data) => {
      try {
        const { chatId } = data;

        await Message.updateMany(
          {
            chatId,
            senderId: { $ne: userId },
            'readBy.userId': { $ne: userId }
          },
          {
            $push: { readBy: { userId, readAt: new Date() } }
          }
        );

        // Notify other members
        socket.to(chatId).emit('messagesRead', { chatId, userId });
      } catch (error) {
        console.error('Socket markRead error:', error);
      }
    });

    /**
     * Disconnect
     */
    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${userId}`);

      if (onlineUsers.has(userId)) {
        onlineUsers.get(userId).delete(socket.id);
        if (onlineUsers.get(userId).size === 0) {
          onlineUsers.delete(userId);
        }
      }

      broadcastOnlineUsers(io);
    });
  });
}

/**
 * Broadcast the list of online user IDs to all connected sockets
 */
function broadcastOnlineUsers(io) {
  const onlineUserIds = Array.from(onlineUsers.keys());
  io.emit('online_users', onlineUserIds);
}

module.exports = { initializeSocket };
