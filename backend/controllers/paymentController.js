const Razorpay = require('razorpay');
const crypto = require('crypto');
const Payment = require('../models/Payment');
const Student = require('../models/Student');
const { FEE_STRUCTURE, generateReceipt } = require('../utils/pdfGenerator');

// Initialize Razorpay (will fail gracefully if keys not set)
let razorpay = null;
try {
  if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET &&
      process.env.RAZORPAY_KEY_ID !== 'your_razorpay_key_id') {
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
} catch (err) {
  console.log('⚠️  Razorpay not configured. Online payments disabled.');
}

/**
 * Create Razorpay order
 * POST /api/payments/create-order
 */
exports.createOrder = async (req, res) => {
  try {
    if (!razorpay) {
      return res.status(503).json({
        message: 'Online payments are not configured. Please contact admin.'
      });
    }

    const { studentId, months } = req.body;
    // months = [{month, year}, ...]

    if (!studentId || !months || !months.length) {
      return res.status(400).json({ message: 'Student ID and months are required.' });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found.' });
    }

    // Calculate total amount
    let totalAmount = 0;
    for (const m of months) {
      // Check if already paid
      const existing = await Payment.findOne({
        studentId, month: m.month, year: m.year, status: 'completed'
      });
      if (existing) {
        return res.status(400).json({ message: `Fee for ${m.month}/${m.year} is already paid.` });
      }

      const defaultFee = FEE_STRUCTURE[student.studentClass] || 0;
      let fee = student.monthlyFeeOverride || defaultFee;
      if (student.discount > 0 && student.discountStartMonth) {
        const [dYear, dMonth] = student.discountStartMonth.split('-').map(Number);
        if (m.year > dYear || (m.year === dYear && m.month >= dMonth)) {
          fee = Math.max(0, fee - student.discount);
        }
      }
      totalAmount += fee;
    }

    // Create Razorpay order (amount in paise)
    const order = await razorpay.orders.create({
      amount: totalAmount * 100,
      currency: 'INR',
      receipt: `receipt_${studentId}_${Date.now()}`,
      notes: {
        studentId: studentId.toString(),
        studentName: student.name,
        rollNumber: student.rollNumber,
        months: JSON.stringify(months)
      }
    });

    res.json({
      orderId: order.id,
      amount: totalAmount,
      currency: 'INR',
      key: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ message: 'Server error creating payment order.' });
  }
};

/**
 * Verify Razorpay payment
 * POST /api/payments/verify
 */
exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, studentId, months } = req.body;

    if (!razorpay) {
      return res.status(503).json({ message: 'Online payments not configured.' });
    }

    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: 'Payment verification failed.' });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found.' });
    }

    // Create payment records for each month
    const payments = [];
    for (const m of months) {
      const defaultFee = FEE_STRUCTURE[student.studentClass] || 0;
      let fee = student.monthlyFeeOverride || defaultFee;
      if (student.discount > 0 && student.discountStartMonth) {
        const [dYear, dMonth] = student.discountStartMonth.split('-').map(Number);
        if (m.year > dYear || (m.year === dYear && m.month >= dMonth)) {
          fee = Math.max(0, fee - student.discount);
        }
      }

      const payment = new Payment({
        studentId,
        amount: fee,
        month: m.month,
        year: m.year,
        type: 'online',
        razorpayPaymentId: razorpay_payment_id,
        razorpayOrderId: razorpay_order_id,
        razorpaySignature: razorpay_signature,
        status: 'completed',
        paidAt: new Date(),
        collectedBy: req.user._id
      });

      await payment.save();
      payments.push(payment);
    }

    res.json({ message: 'Payment verified and recorded.', payments });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Payment for one of the selected months already exists.' });
    }
    console.error('Verify payment error:', error);
    res.status(500).json({ message: 'Server error verifying payment.' });
  }
};

/**
 * Get all payments (admin view with filters)
 * GET /api/payments
 */
exports.getPayments = async (req, res) => {
  try {
    const { search, studentClass, type, month, year, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (type) filter.type = type;
    if (month) filter.month = parseInt(month);
    if (year) filter.year = parseInt(year);

    let studentFilter = {};
    if (studentClass) {
      studentFilter.studentClass = studentClass;
    }

    let query = Payment.find(filter)
      .populate('studentId', 'name rollNumber studentClass section phone')
      .populate('collectedBy', 'name role')
      .sort({ paidAt: -1 });

    // Apply search if provided
    if (search) {
      // Search by payment ID or collect payments and filter
      const students = await Student.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { rollNumber: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } }
        ]
      });
      const studentIds = students.map(s => s._id);
      filter.studentId = { $in: studentIds };
      query = Payment.find(filter)
        .populate('studentId', 'name rollNumber studentClass section phone')
        .populate('collectedBy', 'name role')
        .sort({ paidAt: -1 });
    }

    const total = await Payment.countDocuments(filter);
    const payments = await query
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      payments,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

/**
 * Download payment receipt as PDF
 * GET /api/payments/:id/receipt
 */
exports.downloadReceipt = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found.' });
    }

    const student = await Student.findById(payment.studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found.' });
    }

    // Check authorization: admin/teacher can access any receipt, student can only access own
    if (req.user.role === 'student') {
      const ownStudent = await Student.findOne({ userId: req.user._id });
      if (!ownStudent || ownStudent._id.toString() !== payment.studentId.toString()) {
        return res.status(403).json({ message: 'You can only download your own receipts.' });
      }
    }

    const pdfBuffer = await generateReceipt(payment, student);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=receipt_${payment._id}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Download receipt error:', error);
    res.status(500).json({ message: 'Server error generating receipt.' });
  }
};

/**
 * Get Razorpay key (public)
 * GET /api/payments/razorpay-key
 */
exports.getRazorpayKey = async (req, res) => {
  res.json({
    key: process.env.RAZORPAY_KEY_ID || null,
    configured: !!razorpay
  });
};
