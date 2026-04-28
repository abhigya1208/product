const express = require('express');
const router = express.Router();
const {
  optionalAuth,
  getHistory,
  handleChat,
  getSupportChats,
  adminReply,
  updateChatStatus,
  getSupportCount
} = require('../controllers/aiController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// Public / optional-auth routes
router.get('/history', optionalAuth, getHistory);
router.post('/chat', optionalAuth, handleChat);

// Admin-only routes — static paths MUST come before parameterized paths
router.get('/support-chats/count', auth, roleCheck('admin'), getSupportCount);
router.get('/support-chats', auth, roleCheck('admin'), getSupportChats);
router.post('/support-chats/:id/reply', auth, roleCheck('admin'), adminReply);
router.patch('/support-chats/:id/status', auth, roleCheck('admin'), updateChatStatus);

module.exports = router;
