const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  userName: String,
  role: {
    type: String,
    enum: ['admin', 'teacher', 'student', 'system']
  },
  action: {
    type: String,
    required: true
  },
  details: {
    type: mongoose.Schema.Types.Mixed
  },
  ipAddress: String,
  userAgent: String
}, {
  timestamps: true
});

// Index for efficient querying
logSchema.index({ createdAt: -1 });
logSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Log', logSchema);
