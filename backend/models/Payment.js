const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
    index: true
  },
  amount: {
    type: Number,
    required: true
  },
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  year: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    enum: ['online', 'offline'],
    required: true
  },
  slipNumber: {
    type: String,
    trim: true
  },
  razorpayPaymentId: {
    type: String,
    trim: true
  },
  razorpayOrderId: {
    type: String,
    trim: true
  },
  razorpaySignature: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'completed'
  },
  paidAt: {
    type: Date,
    default: Date.now
  },
  collectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Compound index: one payment per student per month/year
paymentSchema.index({ studentId: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('Payment', paymentSchema);
