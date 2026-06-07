const mongoose = require('mongoose');

const gallerySchema = new mongoose.Schema({
  title: {
    type: String,
    default: '',
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    default: '',
    trim: true,
    maxlength: 500
  },
  imageData: {
    type: String, // Base64 encoded image data
    required: true
  },
  mimeType: {
    type: String,
    required: true,
    enum: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/svg+xml']
  },
  fileSize: {
    type: Number,
    required: true // in bytes
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  isVisible: {
    type: Boolean,
    default: true
  },
  displayOrder: {
    type: Number,
    default: 0
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for sorting: pinned first, then by displayOrder and createdAt
gallerySchema.index({ isPinned: -1, displayOrder: 1, createdAt: -1 });
gallerySchema.index({ isVisible: 1 });

module.exports = mongoose.model('Gallery', gallerySchema);
