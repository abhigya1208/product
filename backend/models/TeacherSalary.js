const mongoose = require('mongoose');

const salaryPaymentSchema = new mongoose.Schema({
  paidAmount: { 
    type: Number, 
    required: true 
  },
  paymentDate: { 
    type: Date, 
    default: Date.now 
  },
  paymentMode: { 
    type: String, 
    enum: ['cash', 'bank_transfer', 'cheque', 'other'], 
    default: 'cash' 
  },
  transactionReference: { 
    type: String, 
    default: '' 
  }
});

const teacherSalarySchema = new mongoose.Schema({
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
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
  calculatedSalary: {
    type: Number,
    required: true
  },
  carryoverDeduction: {
    type: Number,
    default: 0
  },
  paidAmount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['pending', 'partially_paid', 'paid'],
    default: 'pending'
  },
  payments: [salaryPaymentSchema]
}, {
  timestamps: true
});

// Compound unique index: only one salary record per teacher per month/year
teacherSalarySchema.index({ teacherId: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('TeacherSalary', teacherSalarySchema);
