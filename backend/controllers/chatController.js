const Chat = require('../models/Chat');
const Message = require('../models/Message');
const User = require('../models/User');

/**
 * Get all chats for the current user
 * GET /api/chat
 */
exports.getChats = async (req, res) => {
  try {
    const chats = await Chat.find({ members: req.user._id })
      .populate('members', 'name username role')
      .populate('admin', 'name username role')
      .populate('lastMessage')
      .sort({ updatedAt: -1 });

    res.json({ chats });
  } catch (error) {
    console.error('Get chats error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

/**
 * Get users available for chat (teachers + admins only)
 * GET /api/chat/users
 */
exports.getChatUsers = async (req, res) => {
  try {
    const users = await User.find({
      role: { $in: ['admin', 'teacher'] },
      isActive: true,
      _id: { $ne: req.user._id }
    }).select('name username role');

    res.json({ users });
  } catch (error) {
    console.error('Get chat users error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

/**
 * Create or access a 1-to-1 chat
 * POST /api/chat/one-to-one
 */
exports.createOneToOneChat = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required.' });
    }

    // Check if user exists and is teacher/admin
    const otherUser = await User.findById(userId);
    if (!otherUser || !['admin', 'teacher'].includes(otherUser.role)) {
      return res.status(400).json({ message: 'Invalid user for chat.' });
    }

    // Check if 1-to-1 chat already exists
    const existingChat = await Chat.findOne({
      isGroup: false,
      members: { $all: [req.user._id, userId], $size: 2 }
    }).populate('members', 'name username role')
      .populate('lastMessage');

    if (existingChat) {
      return res.json({ chat: existingChat });
    }

    // Create new chat
    const chat = new Chat({
      isGroup: false,
      members: [req.user._id, userId],
      createdBy: req.user._id
    });

    await chat.save();

    const populatedChat = await Chat.findById(chat._id)
      .populate('members', 'name username role');

    res.status(201).json({ chat: populatedChat });
  } catch (error) {
    console.error('Create 1-to-1 chat error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

/**
 * Create a group chat
 * POST /api/chat/group
 */
exports.createGroupChat = async (req, res) => {
  try {
    const { groupName, members } = req.body;

    if (!groupName || !members || members.length < 1) {
      return res.status(400).json({ message: 'Group name and at least 1 member are required.' });
    }

    if (members.length > 14) { // 14 + creator = 15 max
      return res.status(400).json({ message: 'Maximum 15 members allowed in a group.' });
    }

    // Add creator to members
    const allMembers = [...new Set([req.user._id.toString(), ...members])];

    const chat = new Chat({
      isGroup: true,
      groupName,
      members: allMembers,
      admin: req.user._id,
      createdBy: req.user._id
    });

    await chat.save();

    const populatedChat = await Chat.findById(chat._id)
      .populate('members', 'name username role')
      .populate('admin', 'name username role');

    res.status(201).json({ chat: populatedChat });
  } catch (error) {
    console.error('Create group chat error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

/**
 * Send a message
 * POST /api/chat/:chatId/messages
 */
exports.sendMessage = async (req, res) => {
  try {
    const { content } = req.body;
    const { chatId } = req.params;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Message content is required.' });
    }

    // Verify user is member of chat
    const chat = await Chat.findOne({ _id: chatId, members: req.user._id });
    if (!chat) {
      return res.status(403).json({ message: 'You are not a member of this chat.' });
    }

    const message = new Message({
      chatId,
      senderId: req.user._id,
      content: content.trim(),
      readBy: [{ userId: req.user._id }]
    });

    await message.save();

    // Update last message
    chat.lastMessage = message._id;
    await chat.save();

    const populatedMessage = await Message.findById(message._id)
      .populate('senderId', 'name username role');

    res.status(201).json({ message: populatedMessage });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

/**
 * Get messages for a chat (paginated)
 * GET /api/chat/:chatId/messages
 */
exports.getMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { page = 1, limit = 40 } = req.query;

    // Verify membership
    const chat = await Chat.findOne({ _id: chatId, members: req.user._id });
    if (!chat) {
      return res.status(403).json({ message: 'You are not a member of this chat.' });
    }

    const total = await Message.countDocuments({ chatId });
    const messages = await Message.find({ chatId })
      .populate('senderId', 'name username role')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      messages: messages.reverse(),
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

/**
 * Mark messages as read
 * PUT /api/chat/:chatId/read
 */
exports.markAsRead = async (req, res) => {
  try {
    const { chatId } = req.params;

    await Message.updateMany(
      {
        chatId,
        'readBy.userId': { $ne: req.user._id }
      },
      {
        $push: { readBy: { userId: req.user._id, readAt: new Date() } }
      }
    );

    res.json({ message: 'Messages marked as read.' });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

/**
 * Add member to group
 * PUT /api/chat/:chatId/add-member
 */
exports.addMember = async (req, res) => {
  try {
    const { userId } = req.body;
    const { chatId } = req.params;

    const chat = await Chat.findById(chatId);
    if (!chat || !chat.isGroup) {
      return res.status(404).json({ message: 'Group not found.' });
    }

    if (chat.members.length >= 15) {
      return res.status(400).json({ message: 'Group already has maximum members (15).' });
    }

    if (chat.members.includes(userId)) {
      return res.status(400).json({ message: 'User is already a member.' });
    }

    chat.members.push(userId);
    await chat.save();

    const populatedChat = await Chat.findById(chatId)
      .populate('members', 'name username role');

    res.json({ chat: populatedChat });
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

/**
 * Remove member from group
 * PUT /api/chat/:chatId/remove-member
 */
exports.removeMember = async (req, res) => {
  try {
    const { userId } = req.body;
    const { chatId } = req.params;

    const chat = await Chat.findById(chatId);
    if (!chat || !chat.isGroup) {
      return res.status(404).json({ message: 'Group not found.' });
    }

    chat.members = chat.members.filter(m => m.toString() !== userId);
    await chat.save();

    const populatedChat = await Chat.findById(chatId)
      .populate('members', 'name username role');

    res.json({ chat: populatedChat });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

/**
 * Delete group
 * DELETE /api/chat/:chatId
 */
exports.deleteChat = async (req, res) => {
  try {
    const { chatId } = req.params;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found.' });
    }

    // Delete all messages first
    await Message.deleteMany({ chatId });
    await Chat.findByIdAndDelete(chatId);

    res.json({ message: 'Chat deleted successfully.' });
  } catch (error) {
    console.error('Delete chat error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};
