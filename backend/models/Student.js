const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rollNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  fatherName: {
    type: String,
    trim: true
  },
  motherName: {
    type: String,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  studentClass: {
    type: String,
    required: true,
    enum: ['NUR', 'LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10']
  },
  section: {
    type: String,
    enum: ['A', 'B'],
    default: 'A'
  },
  admissionDate: {
    type: Date,
    default: Date.now
  },
  // Fee override: if set, this overrides the default class fee
  monthlyFeeOverride: {
    type: Number,
    default: null
  },
  // Discount amount per month (flat discount)
  discount: {
    type: Number,
    default: 0
  },
  // Month from which discount starts (format: YYYY-MM)
  discountStartMonth: {
    type: String,
    default: null
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Validate that at least one parent name is provided
studentSchema.pre('validate', function(next) {
  if (!this.fatherName && !this.motherName) {
    this.invalidate('fatherName', 'At least one parent name (father or mother) is required');
  }
  // Section B only allowed for classes 4,5,6,7,8
  const sectionBClasses = ['4', '5', '6', '7', '8'];
  if (this.section === 'B' && !sectionBClasses.includes(this.studentClass)) {
    this.invalidate('section', 'Section B is only available for classes 4, 5, 6, 7, 8');
  }
  next();
});

module.exports = mongoose.model('Student', studentSchema);
