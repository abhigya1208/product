const mongoose = require('mongoose');

const aiMessageSchema = new mongoose.Schema({
  content: { type: String, required: true },
  role: { type: String, enum: ['user', 'assistant'], required: true },
  timestamp: { type: Date, default: Date.now }
});

const aiChatSchema = new mongoose.Schema({
  // Logged-in user (optional)
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  // Visitor token for unauthenticated sessions
  visitorId: { type: String, default: null },
  messages: [aiMessageSchema],
  // Human handoff support
  status: {
    type: String,
    enum: ['active', 'needs_human', 'closed'],
    default: 'active'
  },
  // Admin reply for handoff
  adminReplies: [{
    message: String,
    timestamp: { type: Date, default: Date.now },
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }]
}, { timestamps: true });

// Index for fast lookups
aiChatSchema.index({ userId: 1 });
aiChatSchema.index({ visitorId: 1 });
aiChatSchema.index({ status: 1 });

module.exports = mongoose.model('AiChat', aiChatSchema);
