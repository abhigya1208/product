const mongoose = require('mongoose');

const teacherClassSchema = new mongoose.Schema({
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  classId: {
    type: String,
    required: true,
    enum: ['NUR', 'LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10']
  },
  subject: {
    type: String,
    default: ''
  },
  session: {
    type: String,
    required: true,
    default: '2026-27'
  }
}, {
  timestamps: true
});

// A teacher can only be assigned to a specific class and subject once per session
teacherClassSchema.index({ teacherId: 1, classId: 1, subject: 1, session: 1 }, { unique: true });

module.exports = mongoose.model('TeacherClass', teacherClassSchema);
