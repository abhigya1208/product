const User = require('../models/User');
const Student = require('../models/Student');
const Payment = require('../models/Payment');
const { generateRollNumber, generatePassword } = require('../utils/rollNumberGenerator');
const { FEE_STRUCTURE } = require('../utils/pdfGenerator');

/**
 * Add a new student (teacher can add)
 * POST /api/teacher/students
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

    // Create user account
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
    console.error('Teacher add student error:', error);
    res.status(500).json({ message: error.message || 'Server error adding student.' });
  }
};

/**
 * Get all students
 * GET /api/teacher/students
 */
exports.getStudents = async (req, res) => {
  try {
    const { search, studentClass, section, page = 1, limit = 50 } = req.query;

    const filter = { isArchived: false };

    if (studentClass) filter.studentClass = studentClass;
    if (section) filter.section = section;

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
    console.error('Teacher get students error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

/**
 * Get single student with fee status
 * GET /api/teacher/students/:id
 */
exports.getStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found.' });
    }

    const payments = await Payment.find({ studentId: student._id, status: 'completed' })
      .sort({ year: 1, month: 1 });

    const feeStatus = calculateFeeStatus(student, payments);

    res.json({ student, payments, feeStatus });
  } catch (error) {
    console.error('Teacher get student error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

/**
 * Update student details (teacher can edit basic info)
 * PUT /api/teacher/students/:id
 */
exports.updateStudent = async (req, res) => {
  try {
    const { name, fatherName, motherName, phone, admissionDate } = req.body;

    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found.' });
    }

    if (name) student.name = name;
    if (fatherName !== undefined) student.fatherName = fatherName;
    if (motherName !== undefined) student.motherName = motherName;
    if (phone !== undefined) student.phone = phone;
    if (admissionDate) student.admissionDate = new Date(admissionDate);

    await student.save();

    if (name) {
      await User.findByIdAndUpdate(student.userId, { name });
    }

    res.json({ message: 'Student updated successfully.', student });
  } catch (error) {
    console.error('Teacher update student error:', error);
    res.status(500).json({ message: error.message || 'Server error.' });
  }
};

/**
 * Mark offline fee payment
 * POST /api/teacher/payments/offline
 */
exports.markOfflinePayment = async (req, res) => {
  try {
    const { studentId, month, year, slipNumber } = req.body;

    if (!studentId || !month || !year || !slipNumber) {
      return res.status(400).json({ message: 'Student ID, month, year, and slip number are required.' });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found.' });
    }

    // Check if already paid
    const existing = await Payment.findOne({ studentId, month, year, status: 'completed' });
    if (existing) {
      return res.status(400).json({ message: `Fee for ${month}/${year} is already paid.` });
    }

    // Calculate fee amount
    const defaultFee = FEE_STRUCTURE[student.studentClass] || 0;
    let fee = student.monthlyFeeOverride || defaultFee;

    // Apply discount
    if (student.discount > 0 && student.discountStartMonth) {
      const [dYear, dMonth] = student.discountStartMonth.split('-').map(Number);
      if (year > dYear || (year === dYear && month >= dMonth)) {
        fee = Math.max(0, fee - student.discount);
      }
    }

    const payment = new Payment({
      studentId,
      amount: fee,
      month,
      year,
      type: 'offline',
      slipNumber,
      status: 'completed',
      paidAt: new Date(),
      collectedBy: req.user._id
    });

    await payment.save();

    res.status(201).json({ message: 'Payment recorded successfully.', payment });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Payment for this month already exists.' });
    }
    console.error('Mark offline payment error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

/**
 * Get students with pending fees
 * GET /api/teacher/pending-fees
 */
exports.getPendingFees = async (req, res) => {
  try {
    const students = await Student.find({ isArchived: false });
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const pendingList = [];

    for (const student of students) {
      const payments = await Payment.find({
        studentId: student._id,
        status: 'completed'
      });

      const paid = payments.find(p => p.month === currentMonth && p.year === currentYear);
      if (!paid) {
        const defaultFee = FEE_STRUCTURE[student.studentClass] || 0;
        let fee = student.monthlyFeeOverride || defaultFee;
        if (student.discount > 0 && student.discountStartMonth) {
          const [dYear, dMonth] = student.discountStartMonth.split('-').map(Number);
          if (currentYear > dYear || (currentYear === dYear && currentMonth >= dMonth)) {
            fee = Math.max(0, fee - student.discount);
          }
        }

        pendingList.push({
          _id: student._id,
          name: student.name,
          rollNumber: student.rollNumber,
          studentClass: student.studentClass,
          section: student.section,
          phone: student.phone,
          fatherName: student.fatherName,
          pendingFee: fee,
          month: currentMonth,
          year: currentYear
        });
      }
    }

    res.json({ pendingFees: pendingList, total: pendingList.length });
  } catch (error) {
    console.error('Get pending fees error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

/**
 * Teacher dashboard stats
 * GET /api/teacher/dashboard
 */
exports.getDashboardStats = async (req, res) => {
  try {
    const totalStudents = await Student.countDocuments({ isArchived: false });
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const paidThisMonth = await Payment.countDocuments({
      month: currentMonth,
      year: currentYear,
      status: 'completed'
    });

    const classBreakdown = await Student.aggregate([
      { $match: { isArchived: false } },
      { $group: { _id: '$studentClass', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      totalStudents,
      paidThisMonth,
      pendingThisMonth: totalStudents - paidThisMonth,
      classBreakdown
    });
  } catch (error) {
    console.error('Teacher dashboard error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// Helper
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

    if (student.discount > 0 && student.discountStartMonth) {
      const [dYear, dMonth] = student.discountStartMonth.split('-').map(Number);
      if (year > dYear || (year === dYear && month >= dMonth)) {
        fee = Math.max(0, fee - student.discount);
      }
    }

    statuses.push({
      month, year, fee,
      paid: !!payment,
      paymentId: payment?._id || null,
      amount: payment?.amount || 0,
      type: payment?.type || null,
      paidAt: payment?.paidAt || null
    });

    month++;
    if (month > 12) { month = 1; year++; }
  }

  return statuses;
}
