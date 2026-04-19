import jsPDF from 'jspdf';
import { MONTH_NAMES } from './constants';

/**
 * Generate and download a fee receipt PDF client-side
 */
export function downloadReceipt(payment, student) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pw = doc.internal.pageSize.getWidth();

  // Header background
  doc.setFillColor(168, 230, 207); // pastel green
  doc.rect(0, 0, pw, 90, 'F');

  // Institute name
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(74, 74, 74);
  doc.text('AGS TUTORIAL', pw / 2, 38, { align: 'center' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('A-353, Gali No 8, Part 2, Pusta 1, Sonia Vihar, Delhi', pw / 2, 55, { align: 'center' });
  doc.text('Phone: 9839910481  |  Email: agstutorial050522@gmail.com', pw / 2, 68, { align: 'center' });

  // Title
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(74, 74, 74);
  doc.text('FEE RECEIPT', pw / 2, 115, { align: 'center' });

  // Divider
  doc.setDrawColor(168, 230, 207);
  doc.setLineWidth(1.5);
  doc.line(40, 125, pw - 40, 125);

  // Receipt details
  const details = [
    ['Receipt No',    (payment._id || '').slice(-8).toUpperCase()],
    ['Date',          new Date(payment.paidAt || Date.now()).toLocaleDateString('en-IN')],
    ['Payment Type',  payment.type === 'online' ? 'Online (Razorpay)' : 'Offline (Cash)'],
    ['', ''],
    ['Student Name',  student.name || ''],
    ['Roll Number',   student.rollNumber || ''],
    ['Class',         `Class ${student.studentClass} – Section ${student.section || 'A'}`],
    ["Father's Name", student.fatherName || 'N/A'],
    ['', ''],
    ['Fee Month',     `${MONTH_NAMES[(payment.month || 1) - 1]} ${payment.year || ''}`],
    ['Amount Paid',   `Rs. ${payment.amount || 0}`],
  ];

  if (payment.slipNumber) details.push(['Slip Number', payment.slipNumber]);
  if (payment.razorpayPaymentId) details.push(['Transaction ID', payment.razorpayPaymentId]);

  let y = 150;
  details.forEach(([label, value]) => {
    if (!label) { y += 10; return; }
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(107, 114, 128);
    doc.text(label + ':', 60, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(74, 74, 74);
    doc.text(String(value), 220, y);
    y += 22;
  });

  // Footer
  doc.setDrawColor(168, 230, 207);
  doc.line(40, y + 20, pw - 40, y + 20);
  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128);
  doc.setFont('helvetica', 'italic');
  doc.text('This is a computer-generated receipt. No signature required.', pw / 2, y + 38, { align: 'center' });
  doc.text('Thank you for your payment!', pw / 2, y + 52, { align: 'center' });

  doc.save(`AGS_Receipt_${(payment._id || 'receipt').slice(-8)}.pdf`);
}
