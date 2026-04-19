const PDFDocument = require('pdfkit');

/**
 * Default fee structure by class
 */
const FEE_STRUCTURE = {
  'NUR': 250, 'LKG': 250, 'UKG': 250,
  '1': 300, '2': 300,
  '3': 350, '4': 350, '5': 350,
  '6': 400, '7': 400,
  '8': 450,
  '9': 500,
  '10': 600
};

/**
 * Teacher assignments by class (for display)
 */
const TEACHER_ASSIGNMENTS = {
  'NUR': 'KULSUM MAM', 'LKG': 'KULSUM MAM', 'UKG': 'KULSUM MAM',
  '1': 'KHUSHI MAM', '2': 'KHUSHI MAM', '3': 'KHUSHI MAM',
  '4': 'SHIVANI MAM', '5': 'SHIVANI MAM',
  '6': 'VARTIKA MAM', '7': 'VARTIKA MAM', '8': 'VARTIKA MAM',
  '9': 'ABHIGYA SIR', '10': 'ABHIGYA SIR'
};

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

/**
 * Generate a PDF receipt for a payment
 * @param {Object} payment - Payment record
 * @param {Object} student - Student record
 * @returns {Buffer} PDF buffer
 */
function generateReceipt(payment, student) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const buffers = [];

      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      // Header
      doc.fontSize(24).font('Helvetica-Bold')
         .text('AGS TUTORIAL', { align: 'center' });
      doc.fontSize(10).font('Helvetica')
         .text('A-353, Gali No 8, Part 2, Pusta 1, Sonia Vihar, Delhi', { align: 'center' });
      doc.text('Phone: 9839910481 | Email: agstutorial050522@gmail.com', { align: 'center' });

      doc.moveDown();
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown();

      // Receipt title
      doc.fontSize(18).font('Helvetica-Bold')
         .text('FEE RECEIPT', { align: 'center' });
      doc.moveDown();

      // Receipt details
      const monthName = MONTH_NAMES[payment.month - 1];
      const details = [
        ['Receipt No:', payment._id.toString().slice(-8).toUpperCase()],
        ['Date:', new Date(payment.paidAt).toLocaleDateString('en-IN')],
        ['Payment Type:', payment.type === 'online' ? 'Online (Razorpay)' : 'Offline (Cash)'],
        ['', ''],
        ['Student Name:', student.name],
        ['Roll Number:', student.rollNumber],
        ['Class:', student.studentClass],
        ['Section:', student.section],
        ["Father's Name:", student.fatherName || 'N/A'],
        ['', ''],
        ['Fee Month:', `${monthName} ${payment.year}`],
        ['Amount Paid:', `₹${payment.amount}`],
      ];

      if (payment.type === 'offline' && payment.slipNumber) {
        details.push(['Slip Number:', payment.slipNumber]);
      }
      if (payment.razorpayPaymentId) {
        details.push(['Transaction ID:', payment.razorpayPaymentId]);
      }

      details.forEach(([label, value]) => {
        if (!label && !value) {
          doc.moveDown(0.5);
          return;
        }
        doc.fontSize(11).font('Helvetica-Bold').text(label, 50, doc.y, { continued: true, width: 150 });
        doc.font('Helvetica').text(`  ${value}`);
      });

      doc.moveDown(2);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown();

      // Footer
      doc.fontSize(9).font('Helvetica')
         .text('This is a computer-generated receipt. No signature required.', { align: 'center' });
      doc.text('Thank you for your payment!', { align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = { generateReceipt, FEE_STRUCTURE, TEACHER_ASSIGNMENTS, MONTH_NAMES };
