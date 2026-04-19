const ExcelJS = require('exceljs');

/**
 * Export data to Excel buffer
 * @param {string} sheetName - Name of the worksheet
 * @param {Array<Object>} columns - Column definitions [{header, key, width}]
 * @param {Array<Object>} rows - Data rows
 * @returns {Buffer} Excel file buffer
 */
async function exportToExcel(sheetName, columns, rows) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'AGS Tutorial';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet(sheetName);
  worksheet.columns = columns;

  // Style header row
  worksheet.getRow(1).font = { bold: true, size: 12 };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFA8E6CF' } // pastel green
  };

  // Add data rows
  rows.forEach(row => {
    worksheet.addRow(row);
  });

  // Auto-fit column widths (approximate)
  worksheet.columns.forEach(col => {
    col.width = Math.max(col.width || 15, 12);
  });

  return workbook.xlsx.writeBuffer();
}

/**
 * Export students list
 */
async function exportStudents(students) {
  const columns = [
    { header: 'Roll Number', key: 'rollNumber', width: 15 },
    { header: 'Name', key: 'name', width: 25 },
    { header: 'Class', key: 'studentClass', width: 10 },
    { header: 'Section', key: 'section', width: 10 },
    { header: "Father's Name", key: 'fatherName', width: 25 },
    { header: "Mother's Name", key: 'motherName', width: 25 },
    { header: 'Phone', key: 'phone', width: 15 },
    { header: 'Admission Date', key: 'admissionDate', width: 15 },
    { header: 'Monthly Fee', key: 'monthlyFee', width: 12 },
    { header: 'Status', key: 'status', width: 10 }
  ];

  const rows = students.map(s => ({
    rollNumber: s.rollNumber,
    name: s.name,
    studentClass: s.studentClass,
    section: s.section,
    fatherName: s.fatherName || 'N/A',
    motherName: s.motherName || 'N/A',
    phone: s.phone || 'N/A',
    admissionDate: s.admissionDate ? new Date(s.admissionDate).toLocaleDateString('en-IN') : 'N/A',
    monthlyFee: s.monthlyFeeOverride || 'Default',
    status: s.isArchived ? 'Archived' : 'Active'
  }));

  return exportToExcel('Students', columns, rows);
}

/**
 * Export payments list
 */
async function exportPayments(payments) {
  const columns = [
    { header: 'Payment ID', key: 'paymentId', width: 15 },
    { header: 'Student Name', key: 'studentName', width: 25 },
    { header: 'Roll Number', key: 'rollNumber', width: 15 },
    { header: 'Class', key: 'studentClass', width: 10 },
    { header: 'Month', key: 'month', width: 15 },
    { header: 'Amount', key: 'amount', width: 12 },
    { header: 'Type', key: 'type', width: 10 },
    { header: 'Slip No', key: 'slipNumber', width: 15 },
    { header: 'Transaction ID', key: 'transactionId', width: 20 },
    { header: 'Date', key: 'date', width: 15 },
    { header: 'Status', key: 'status', width: 10 }
  ];

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const rows = payments.map(p => ({
    paymentId: p._id.toString().slice(-8).toUpperCase(),
    studentName: p.studentId?.name || 'N/A',
    rollNumber: p.studentId?.rollNumber || 'N/A',
    studentClass: p.studentId?.studentClass || 'N/A',
    month: `${monthNames[p.month - 1]} ${p.year}`,
    amount: `₹${p.amount}`,
    type: p.type,
    slipNumber: p.slipNumber || 'N/A',
    transactionId: p.razorpayPaymentId || 'N/A',
    date: new Date(p.paidAt).toLocaleDateString('en-IN'),
    status: p.status
  }));

  return exportToExcel('Payments', columns, rows);
}

/**
 * Export logs
 */
async function exportLogs(logs) {
  const columns = [
    { header: 'Timestamp', key: 'timestamp', width: 20 },
    { header: 'User', key: 'userName', width: 20 },
    { header: 'Role', key: 'role', width: 10 },
    { header: 'Action', key: 'action', width: 30 },
    { header: 'IP Address', key: 'ipAddress', width: 15 },
    { header: 'Details', key: 'details', width: 40 }
  ];

  const rows = logs.map(l => ({
    timestamp: new Date(l.createdAt).toLocaleString('en-IN'),
    userName: l.userName || 'System',
    role: l.role || 'N/A',
    action: l.action,
    ipAddress: l.ipAddress || 'N/A',
    details: JSON.stringify(l.details || {}).substring(0, 200)
  }));

  return exportToExcel('Logs', columns, rows);
}

module.exports = { exportToExcel, exportStudents, exportPayments, exportLogs };
