const User = require('../models/User');
const Student = require('../models/Student');
const Payment = require('../models/Payment');
const Session = require('../models/Session');
const Log = require('../models/Log');
const TeacherClass = require('../models/TeacherClass');
const TeacherSalary = require('../models/TeacherSalary');
const { generateRollNumber, generatePassword } = require('../utils/rollNumberGenerator');
const { FEE_STRUCTURE } = require('../utils/pdfGenerator');
const { exportStudents, exportPayments, exportLogs } = require('../utils/excelExport');

// ==================== TEACHER MANAGEMENT ====================

/**
 * Create a teacher account
 * POST /api/admin/teachers
 */
exports.createTeacher = async (req, res) => {
  try {
    const { name, username, password, email, phone } = req.body;

    if (!name || !username || !password) {
      return res.status(400).json({ message: 'Name, username, and password are required.' });
    }

    // Check if username exists
    const existing = await User.findOne({ username: username.toLowerCase() });
    if (existing) {
      return res.status(400).json({ message: 'Username already exists.' });
    }

    const teacher = new User({
      name,
      username: username.toLowerCase(),
      password,
      role: 'teacher',
      email,
      phone
    });

    await teacher.save();

    res.status(201).json({ message: 'Teacher created successfully.', teacher });
  } catch (error) {
    console.error('Create teacher error:', error);
    res.status(500).json({ message: 'Server error creating teacher.' });
  }
};

/**
 * Get all teachers
 * GET /api/admin/teachers
 */
exports.getTeachers = async (req, res) => {
  try {
    const teachers = await User.find({ role: 'teacher' }).sort({ name: 1 });
    res.json({ teachers });
  } catch (error) {
    console.error('Get teachers error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

/**
 * Update a teacher
 * PUT /api/admin/teachers/:id
 */
exports.updateTeacher = async (req, res) => {
  try {
    const { name, email, phone, isActive } = req.body;

    const teacher = await User.findOne({ _id: req.params.id, role: 'teacher' });
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found.' });
    }

    if (name) teacher.name = name;
    if (email !== undefined) teacher.email = email;
    if (phone !== undefined) teacher.phone = phone;
    if (isActive !== undefined) teacher.isActive = isActive;

    await teacher.save();

    res.json({ message: 'Teacher updated successfully.', teacher });
  } catch (error) {
    console.error('Update teacher error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

/**
 * Reset teacher password
 * PUT /api/admin/teachers/:id/reset-password
 */
exports.resetTeacherPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 4) {
      return res.status(400).json({ message: 'Password must be at least 4 characters.' });
    }

    const teacher = await User.findOne({ _id: req.params.id, role: 'teacher' });
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found.' });
    }

    teacher.password = newPassword;
    await teacher.save();

    res.json({ message: 'Teacher password reset successfully.' });
  } catch (error) {
    console.error('Reset teacher password error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

/**
 * Delete a teacher
 * DELETE /api/admin/teachers/:id
 */
exports.deleteTeacher = async (req, res) => {
  try {
    const teacher = await User.findOneAndDelete({ _id: req.params.id, role: 'teacher' });
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found.' });
    }

    // Deactivate all their sessions
    await Session.updateMany({ userId: teacher._id }, { isActive: false });

    res.json({ message: 'Teacher deleted successfully.' });
  } catch (error) {
    console.error('Delete teacher error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ==================== STUDENT MANAGEMENT (Admin) ====================

/**
 * Add a new student
 * POST /api/admin/students
 */
exports.addStudent = async (req, res) => {
  try {
    const { name, fatherName, motherName, phone, studentClass, section, admissionDate } = req.body;

    if (!name || (!fatherName && !motherName)) {
      return res.status(400).json({ message: 'Name and at least one parent name are required.' });
    }

    if (!studentClass) {
      return res.status(400).json({ message: 'Class is required.' });
    }

    const admDate = admissionDate ? new Date(admissionDate) : new Date();

    // Generate roll number
    const rollNumber = await generateRollNumber(studentClass, section || 'A', admDate);

    // Generate password from parent name
    const password = generatePassword(fatherName, motherName);

    // Create user account (username = roll number)
    const user = new User({
      username: rollNumber,
      password,
      role: 'student',
      name,
      phone
    });
    await user.save();

    // Create student record
    const student = new Student({
      userId: user._id,
      rollNumber,
      name,
      fatherName,
      motherName,
      phone,
      studentClass,
      section: section || 'A',
      admissionDate: admDate,
      createdBy: req.user._id
    });
    await student.save();

    res.status(201).json({
      message: 'Student added successfully.',
      student,
      credentials: {
        username: rollNumber,
        password: password,
        note: 'Share these credentials with the student/parent.'
      }
    });
  } catch (error) {
    console.error('Add student error:', error);
    res.status(500).json({ message: error.message || 'Server error adding student.' });
  }
};

/**
 * Bulk import students
 * POST /api/admin/students/bulk-import
 */
exports.bulkImportStudents = async (req, res) => {
  try {
    const { students } = req.body;
    if (!students || !Array.isArray(students)) {
      return res.status(400).json({ message: 'Invalid data format array expected.' });
    }

    const summary = { success: 0, failed: 0, skipped: 0 };
    const credentials = [];
    const errors = [];

    for (let i = 0; i < students.length; i++) {
      const data = students[i];
      try {
        if (!data.name || !data.studentClass) {
          throw new Error('Name and Class are required.');
        }
        
        let rollNumber = data.rollNumber;
        const admDate = data.admissionDate ? new Date(data.admissionDate) : new Date();

        if (rollNumber) {
           const existing = await Student.findOne({ rollNumber });
           if (existing) {
             summary.skipped++;
             continue; // Skip duplicate manually assigned roll number
           }
        } else {
           rollNumber = await generateRollNumber(data.studentClass, data.section || 'A', admDate);
        }

        const password = generatePassword(data.fatherName || 'Parent', data.motherName);

        const user = new User({
          username: rollNumber,
          password,
          role: 'student',
          name: data.name,
          phone: data.phone
        });
        await user.save();

        const student = new Student({
          userId: user._id,
          rollNumber,
          name: data.name,
          fatherName: data.fatherName,
          motherName: data.motherName,
          phone: data.phone,
          studentClass: data.studentClass,
          section: data.section || 'A',
          admissionDate: admDate,
          isArchived: data.isArchived || false,
          createdBy: req.user._id
        });
        await student.save();

        credentials.push({
          name: data.name,
          username: rollNumber,
          password
        });
        summary.success++;

      } catch (err) {
        summary.failed++;
        errors.push({ row: i + 1, name: data.name || 'Unknown', error: err.message });
      }
    }

    res.json({
      summary,
      credentials,
      errors
    });

  } catch (error) {
    console.error('Bulk import error:', error);
    res.status(500).json({ message: 'Server error during bulk import.' });
  }
};

/**
 * Get all students (with filters and pagination)
 * GET /api/admin/students
 */
exports.getStudents = async (req, res) => {
  try {
    const { search, studentClass, section, archived, page = 1, limit = 50 } = req.query;

    const filter = {};

    if (studentClass) filter.studentClass = studentClass;
    if (section) filter.section = section;
    if (archived === 'true') {
      filter.isArchived = true;
    } else if (archived === 'false' || !archived) {
      filter.isArchived = false;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { rollNumber: { $regex: search, $options: 'i' } },
        { fatherName: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await Student.countDocuments(filter);
    const students = await Student.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      students,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

/**
 * Get single student with fee status
 * GET /api/admin/students/:id
 */
exports.getStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).populate('createdBy', 'name role');
    if (!student) {
      return res.status(404).json({ message: 'Student not found.' });
    }

    // Get all payments for this student
    const payments = await Payment.find({ studentId: student._id, status: 'completed' })
      .sort({ year: 1, month: 1 });

    // Calculate fee status month by month
    const feeStatus = calculateFeeStatus(student, payments);

    res.json({ student, payments, feeStatus });
  } catch (error) {
    console.error('Get student error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

/**
 * Update student details
 * PUT /api/admin/students/:id
 */
exports.updateStudent = async (req, res) => {
  try {
    const { name, fatherName, motherName, phone, studentClass, section, admissionDate, monthlyFeeOverride, discount, discountStartMonth, isArchived } = req.body;

    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found.' });
    }

    if (name) student.name = name;
    if (fatherName !== undefined) student.fatherName = fatherName;
    if (motherName !== undefined) student.motherName = motherName;
    if (phone !== undefined) student.phone = phone;
    if (studentClass) student.studentClass = studentClass;
    if (section) student.section = section;
    if (admissionDate) student.admissionDate = new Date(admissionDate);
    if (monthlyFeeOverride !== undefined) student.monthlyFeeOverride = monthlyFeeOverride;
    if (discount !== undefined) student.discount = discount;
    if (discountStartMonth !== undefined) student.discountStartMonth = discountStartMonth;
    if (isArchived !== undefined) student.isArchived = isArchived;

    await student.save();

    // Update user name if changed
    if (name) {
      await User.findByIdAndUpdate(student.userId, { name });
    }

    res.json({ message: 'Student updated successfully.', student });
  } catch (error) {
    console.error('Update student error:', error);
    res.status(500).json({ message: error.message || 'Server error.' });
  }
};

/**
 * Delete a student
 * DELETE /api/admin/students/:id
 */
exports.deleteStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found.' });
    }

    // Delete user account
    await User.findByIdAndDelete(student.userId);

    // Delete all sessions
    await Session.updateMany({ userId: student.userId }, { isActive: false });

    // Delete student record (keep payments for records)
    await Student.findByIdAndDelete(req.params.id);

    res.json({ message: 'Student deleted successfully.' });
  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ==================== SESSION MANAGEMENT ====================

/**
 * Get all active sessions
 * GET /api/admin/sessions
 */
exports.getSessions = async (req, res) => {
  try {
    const sessions = await Session.find({ isActive: true })
      .populate('userId', 'name username role')
      .sort({ loginTime: -1 });

    res.json({ sessions });
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

/**
 * Terminate a session (force logout)
 * DELETE /api/admin/sessions/:id
 */
exports.terminateSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ message: 'Session not found.' });
    }

    session.isActive = false;
    await session.save();

    res.json({ message: 'Session terminated. User will be logged out on next request.' });
  } catch (error) {
    console.error('Terminate session error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ==================== DASHBOARD STATS ====================

/**
 * Get admin dashboard statistics
 * GET /api/admin/dashboard
 */
exports.getDashboardStats = async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Total students (active)
    const totalStudents = await Student.countDocuments({ isArchived: false });
    const totalTeachers = await User.countDocuments({ role: 'teacher', isActive: true });

    // Payment stats
    const totalPayments = await Payment.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]);

    const todayPayments = await Payment.aggregate([
      { $match: { status: 'completed', paidAt: { $gte: startOfDay } } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]);

    const monthPayments = await Payment.aggregate([
      { $match: { status: 'completed', paidAt: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]);

    // Revenue trend (last 12 months)
    const revenueTrend = await Payment.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: { year: '$year', month: '$month' },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 }
    ]);

    // Student growth (monthly additions, last 12 months)
    const studentGrowth = await Student.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 }
    ]);

    // Fee collection percentage (current month)
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const paidThisMonth = await Payment.countDocuments({
      month: currentMonth,
      year: currentYear,
      status: 'completed'
    });
    const feeCollectionPercent = totalStudents > 0
      ? Math.round((paidThisMonth / totalStudents) * 100)
      : 0;

    // Class-wise breakdown
    const classBreakdown = await Student.aggregate([
      { $match: { isArchived: false } },
      { $group: { _id: '$studentClass', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      summary: {
        totalStudents,
        totalTeachers,
        totalCollection: totalPayments[0]?.total || 0,
        totalPaymentsCount: totalPayments[0]?.count || 0,
        todayCollection: todayPayments[0]?.total || 0,
        todayPaymentsCount: todayPayments[0]?.count || 0,
        monthCollection: monthPayments[0]?.total || 0,
        averagePayment: totalPayments[0]
          ? Math.round(totalPayments[0].total / totalPayments[0].count)
          : 0,
        feeCollectionPercent
      },
      revenueTrend,
      studentGrowth,
      classBreakdown
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ==================== EXPORTS ====================

/**
 * Export students to Excel
 * GET /api/admin/export/students
 */
exports.exportStudentsExcel = async (req, res) => {
  try {
    const students = await Student.find({}).sort({ name: 1 });
    const buffer = await exportStudents(students);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=students.xlsx');
    res.send(buffer);
  } catch (error) {
    console.error('Export students error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

/**
 * Export payments to Excel
 * GET /api/admin/export/payments
 */
exports.exportPaymentsExcel = async (req, res) => {
  try {
    const payments = await Payment.find({})
      .populate('studentId', 'name rollNumber studentClass')
      .sort({ paidAt: -1 });
    const buffer = await exportPayments(payments);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=payments.xlsx');
    res.send(buffer);
  } catch (error) {
    console.error('Export payments error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

/**
 * Export logs to Excel
 * GET /api/admin/export/logs
 */
exports.exportLogsExcel = async (req, res) => {
  try {
    const logs = await Log.find({}).sort({ createdAt: -1 }).limit(5000);
    const buffer = await exportLogs(logs);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=logs.xlsx');
    res.send(buffer);
  } catch (error) {
    console.error('Export logs error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ==================== HELPER ====================

/**
 * Calculate fee status for a student from admission month to current month
 */
function calculateFeeStatus(student, payments) {
  const admDate = new Date(student.admissionDate);
  const now = new Date();
  const statuses = [];

  let year = admDate.getFullYear();
  let month = admDate.getMonth() + 1;

  const endYear = now.getFullYear();
  const endMonth = now.getMonth() + 1;

  while (year < endYear || (year === endYear && month <= endMonth)) {
    const payment = payments.find(p => p.month === month && p.year === year);
    const defaultFee = FEE_STRUCTURE[student.studentClass] || 0;
    let fee = student.monthlyFeeOverride || defaultFee;

    // Apply discount if applicable
    if (student.discount > 0 && student.discountStartMonth) {
      const [dYear, dMonth] = student.discountStartMonth.split('-').map(Number);
      if (year > dYear || (year === dYear && month >= dMonth)) {
        fee = Math.max(0, fee - student.discount);
      }
    }

    statuses.push({
      month,
      year,
      fee,
      paid: !!payment,
      paymentId: payment ? payment._id : null,
      amount: payment ? payment.amount : 0,
      type: payment ? payment.type : null,
      paidAt: payment ? payment.paidAt : null
    });

    month++;
    if (month > 12) {
      month = 1;
      year++;
    }
  }

  return statuses;
}

exports.calculateFeeStatus = calculateFeeStatus;

// ==================== TEACHER CLASS ASSIGNMENT & SALARY MANAGEMENT ====================

/**
 * Get all teacher class assignments and active teachers
 * GET /api/admin/teachers/assignments
 */
exports.getTeacherAssignments = async (req, res) => {
  try {
    const teachers = await User.find({ role: 'teacher', isActive: true }).sort({ name: 1 });
    const assignments = await TeacherClass.find({}).populate('teacherId', 'name username');
    res.json({ assignments, teachers });
  } catch (error) {
    console.error('Get teacher assignments error:', error);
    res.status(500).json({ message: 'Server error fetching teacher assignments.' });
  }
};

/**
 * Assign a class and subject to a teacher
 * POST /api/admin/teachers/assign
 */
exports.assignTeacherClasses = async (req, res) => {
  try {
    const { teacherId, classId, subject, session } = req.body;
    if (!teacherId || !classId) {
      return res.status(400).json({ message: 'Teacher and Class are required.' });
    }
    // Check if assignment already exists
    const existing = await TeacherClass.findOne({ 
      teacherId, 
      classId, 
      subject: subject || '', 
      session: session || '2026-27' 
    });
    if (existing) {
      return res.status(400).json({ message: 'Teacher is already assigned to this class and subject.' });
    }
    const assignment = new TeacherClass({
      teacherId,
      classId,
      subject: subject || '',
      session: session || '2026-27'
    });
    await assignment.save();
    res.status(201).json({ message: 'Class assigned to teacher successfully.', assignment });
  } catch (error) {
    console.error('Assign teacher class error:', error);
    res.status(500).json({ message: 'Server error assigning class.' });
  }
};

/**
 * Delete a teacher class assignment
 * DELETE /api/admin/teachers/assign/:id
 */
exports.deleteTeacherAssignment = async (req, res) => {
  try {
    const assignment = await TeacherClass.findByIdAndDelete(req.params.id);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found.' });
    }
    res.json({ message: 'Teacher assignment removed successfully.' });
  } catch (error) {
    console.error('Delete teacher assignment error:', error);
    res.status(500).json({ message: 'Server error removing assignment.' });
  }
};

/**
 * Calculate salaries for all teachers for a specific month and year
 * GET /api/admin/salary/calculate
 */
exports.calculateTeacherSalaries = async (req, res) => {
  try {
    const targetMonth = parseInt(req.query.month) || (new Date().getMonth() + 1);
    const targetYear = parseInt(req.query.year) || new Date().getFullYear();

    // 1. Get all active teachers
    const teachers = await User.find({ role: 'teacher', isActive: true }).sort({ name: 1 });

    // 2. Get all class assignments for session '2026-27'
    const assignments = await TeacherClass.find({ session: '2026-27' });

    // 3. Count how many teachers teach each class
    const classTeacherCount = {};
    assignments.forEach(a => {
      classTeacherCount[a.classId] = (classTeacherCount[a.classId] || 0) + 1;
    });

    // 4. Find all completed payments for this month/year
    const payments = await Payment.find({
      month: targetMonth,
      year: targetYear,
      status: 'completed'
    }).populate('studentId');

    // 5. Sum completed class fees
    const classFeesMap = {};
    payments.forEach(p => {
      if (p.studentId && !p.studentId.isArchived) {
        classFeesMap[p.studentId.studentClass] = (classFeesMap[p.studentId.studentClass] || 0) + p.amount;
      }
    });

    const salaryData = [];

    for (let i = 0; i < teachers.length; i++) {
      const teacher = teachers[i];
      const teacherAssigns = assignments.filter(a => a.teacherId.toString() === teacher._id.toString());
      
      // Calculate raw fee share
      let rawCalculated = 0;
      const breakdowns = [];
      
      teacherAssigns.forEach(a => {
        const countInClass = classTeacherCount[a.classId] || 1;
        const feeCollected = classFeesMap[a.classId] || 0;
        const classShare = (0.60 * feeCollected) / countInClass;
        rawCalculated += classShare;
        breakdowns.push({
          classId: a.classId,
          subject: a.subject,
          feeCollected,
          totalTeachersInClass: countInClass,
          share: classShare
        });
      });

      // 6. Calculate carryover deduction
      // Find all previous salary records
      const pastSalaries = await TeacherSalary.find({
        teacherId: teacher._id,
        $or: [
          { year: { $lt: targetYear } },
          { year: targetYear, month: { $lt: targetMonth } }
        ]
      });

      let totalPreviousCalculated = 0;
      let totalPreviousPaid = 0;
      pastSalaries.forEach(s => {
        totalPreviousCalculated += s.calculatedSalary;
        totalPreviousPaid += s.paidAmount;
      });

      // Balance carried forward is the extra paid previously
      const balanceCarriedForward = Math.max(0, totalPreviousPaid - totalPreviousCalculated);
      
      // Carryover deduction cannot exceed the raw calculation
      const carryoverDeduction = Math.min(rawCalculated, balanceCarriedForward);

      // Find if this record already exists in database
      let salaryRecord = await TeacherSalary.findOne({
        teacherId: teacher._id,
        month: targetMonth,
        year: targetYear
      });

      if (!salaryRecord) {
        salaryRecord = new TeacherSalary({
          teacherId: teacher._id,
          month: targetMonth,
          year: targetYear,
          calculatedSalary: rawCalculated,
          carryoverDeduction,
          paidAmount: 0,
          status: (carryoverDeduction >= rawCalculated && rawCalculated > 0) ? 'paid' : 'pending'
        });
        await salaryRecord.save();
      } else {
        // Update calculation if still pending/partially paid, preserving payments made
        if (salaryRecord.status !== 'paid' || salaryRecord.paidAmount === 0) {
          salaryRecord.calculatedSalary = rawCalculated;
          salaryRecord.carryoverDeduction = carryoverDeduction;
          // re-evaluate status
          const coverage = salaryRecord.paidAmount + carryoverDeduction;
          if (coverage >= rawCalculated) {
            salaryRecord.status = 'paid';
          } else if (coverage > 0) {
            salaryRecord.status = 'partially_paid';
          } else {
            salaryRecord.status = 'pending';
          }
          await salaryRecord.save();
        }
      }

      salaryData.push({
        teacher,
        assignments: teacherAssigns,
        rawCalculated,
        carryoverDeduction,
        balanceCarriedForward,
        finalCalculated: rawCalculated - carryoverDeduction,
        paidAmount: salaryRecord.paidAmount,
        status: salaryRecord.status,
        payments: salaryRecord.payments,
        breakdowns
      });
    }

    res.json({
      month: targetMonth,
      year: targetYear,
      salaryData
    });
  } catch (error) {
    console.error('Calculate salaries error:', error);
    res.status(500).json({ message: 'Server error calculating salaries.' });
  }
};

/**
 * Record a salary payout
 * POST /api/admin/salary/pay
 */
exports.payTeacherSalary = async (req, res) => {
  try {
    const { teacherId, month, year, paidAmount, paymentMode, transactionReference } = req.body;
    
    if (!teacherId || !month || !year || paidAmount === undefined || paidAmount <= 0) {
      return res.status(400).json({ message: 'Teacher, month, year, and a positive payment amount are required.' });
    }

    let salaryRecord = await TeacherSalary.findOne({ teacherId, month, year });
    if (!salaryRecord) {
      return res.status(404).json({ message: 'Salary record not calculated for this month/year. Please calculate salaries first.' });
    }

    const newPaidAmount = salaryRecord.paidAmount + parseFloat(paidAmount);
    salaryRecord.paidAmount = newPaidAmount;
    
    // Record this payment in the ledger
    salaryRecord.payments.push({
      paidAmount: parseFloat(paidAmount),
      paymentDate: new Date(),
      paymentMode: paymentMode || 'cash',
      transactionReference: transactionReference || ''
    });

    // Recheck status
    const coverage = newPaidAmount + salaryRecord.carryoverDeduction;
    if (coverage >= salaryRecord.calculatedSalary) {
      salaryRecord.status = 'paid';
    } else {
      salaryRecord.status = 'partially_paid';
    }

    await salaryRecord.save();
    
    res.json({ message: 'Salary payment recorded successfully.', salaryRecord });
  } catch (error) {
    console.error('Pay teacher salary error:', error);
    res.status(500).json({ message: 'Server error recording payment.' });
  }
};

/**
 * Fetch a teacher's salary payment ledger
 * GET /api/admin/salary/ledger/:teacherId
 */
exports.getTeacherSalaryLedger = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const history = await TeacherSalary.find({ teacherId })
      .sort({ year: -1, month: -1 });
    res.json({ history });
  } catch (error) {
    console.error('Get teacher salary ledger error:', error);
    res.status(500).json({ message: 'Server error fetching salary ledger.' });
  }
};

/**
 * Fetch Monthly salary expense vs. fee collections for charts
 * GET /api/admin/salary/chart-data
 */
exports.getSalaryChartData = async (req, res) => {
  try {
    // Aggregate monthly completed fee collections
    const fees = await Payment.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: { year: '$year', month: '$month' },
          totalFees: { $sum: '$amount' }
        }
      }
    ]);

    // Aggregate monthly teacher salaries paid/calculated
    const salaries = await TeacherSalary.aggregate([
      {
        $group: {
          _id: { year: '$year', month: '$month' },
          totalCalculatedSalaries: { $sum: '$calculatedSalary' },
          totalPaidSalaries: { $sum: '$paidAmount' }
        }
      }
    ]);

    // Merge results
    const chartMap = {};
    
    fees.forEach(f => {
      const key = `${f._id.year}-${String(f._id.month).padStart(2, '0')}`;
      chartMap[key] = {
        period: key,
        fees: f.totalFees,
        salaryCalculated: 0,
        salaryPaid: 0
      };
    });

    salaries.forEach(s => {
      const key = `${s._id.year}-${String(s._id.month).padStart(2, '0')}`;
      if (!chartMap[key]) {
        chartMap[key] = {
          period: key,
          fees: 0,
          salaryCalculated: 0,
          salaryPaid: 0
        };
      }
      chartMap[key].salaryCalculated = s.totalCalculatedSalaries;
      chartMap[key].salaryPaid = s.totalPaidSalaries;
    });

    const chartData = Object.values(chartMap).sort((a, b) => a.period.localeCompare(b.period)).slice(-12);

    res.json({ chartData });
  } catch (error) {
    console.error('Get salary chart data error:', error);
    res.status(500).json({ message: 'Server error fetching salary chart data.' });
  }
};
