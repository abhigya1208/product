const Student = require('../models/Student');
const Payment = require('../models/Payment');
const { FEE_STRUCTURE } = require('../utils/pdfGenerator');

/**
 * Get own student profile
 * GET /api/student/profile
 */
exports.getProfile = async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found.' });
    }

    // Get all payments
    const payments = await Payment.find({ studentId: student._id, status: 'completed' })
      .sort({ year: 1, month: 1 });

    // Calculate fee status
    const feeStatus = calculateFeeStatus(student, payments);

    res.json({ student, payments, feeStatus });
  } catch (error) {
    console.error('Get student profile error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

/**
 * Get payment history
 * GET /api/student/payments
 */
exports.getPaymentHistory = async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found.' });
    }

    const payments = await Payment.find({ studentId: student._id })
      .sort({ paidAt: -1 });

    res.json({ payments });
  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

/**
 * Get monthly fee amount for payment
 * GET /api/student/fee-amount
 */
exports.getFeeAmount = async (req, res) => {
  try {
    const { month, year } = req.query;
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found.' });
    }

    // Check if already paid
    const existing = await Payment.findOne({
      studentId: student._id,
      month: parseInt(month),
      year: parseInt(year),
      status: 'completed'
    });

    if (existing) {
      return res.status(400).json({ message: 'Fee for this month is already paid.' });
    }

    const defaultFee = FEE_STRUCTURE[student.studentClass] || 0;
    let fee = student.monthlyFeeOverride || defaultFee;

    if (student.discount > 0 && student.discountStartMonth) {
      const [dYear, dMonth] = student.discountStartMonth.split('-').map(Number);
      if (parseInt(year) > dYear || (parseInt(year) === dYear && parseInt(month) >= dMonth)) {
        fee = Math.max(0, fee - student.discount);
      }
    }

    res.json({ fee, studentId: student._id });
  } catch (error) {
    console.error('Get fee amount error:', error);
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
