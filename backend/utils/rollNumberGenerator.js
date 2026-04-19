const Student = require('../models/Student');

/**
 * Roll Number Format: YYMMCCCSNN
 * YY  = last 2 digits of admission year
 * MM  = month of admission (01-12)
 * CCC = class code (3 digits)
 * S   = section code (0 = A, 1 = B)
 * NN  = serial number (01, 02, ...)
 */

// Class code mapping
const CLASS_CODES = {
  'NUR': '100',
  'LKG': '200',
  'UKG': '300',
  '1':   '001',
  '2':   '002',
  '3':   '003',
  '4':   '004',
  '5':   '005',
  '6':   '006',
  '7':   '007',
  '8':   '008',
  '9':   '009',
  '10':  '010'
};

// Classes that can have Section B
const SECTION_B_CLASSES = ['4', '5', '6', '7', '8'];

/**
 * Generate a unique roll number for a student
 * @param {string} studentClass - The class (NUR, LKG, UKG, 1-10)
 * @param {string} section - Section A or B
 * @param {Date} admissionDate - The admission date
 * @returns {string} The generated roll number (10 digits)
 */
async function generateRollNumber(studentClass, section = 'A', admissionDate = new Date()) {
  const year = admissionDate.getFullYear();
  const month = admissionDate.getMonth() + 1; // 0-indexed to 1-indexed

  const yy = String(year).slice(-2);
  const mm = String(month).padStart(2, '0');
  const ccc = CLASS_CODES[studentClass];

  if (!ccc) {
    throw new Error(`Invalid class: ${studentClass}`);
  }

  // Section code: 0 for A, 1 for B
  // Section B only allowed for classes 4,5,6,7,8
  let sectionCode = '0';
  if (section === 'B') {
    if (!SECTION_B_CLASSES.includes(studentClass)) {
      throw new Error(`Section B is not available for class ${studentClass}`);
    }
    sectionCode = '1';
  }

  // Build the prefix (without serial number)
  const prefix = `${yy}${mm}${ccc}${sectionCode}`;

  // Find the highest existing serial number for this prefix
  // Using regex to match the prefix pattern
  const pattern = new RegExp(`^${prefix}\\d{2}$`);
  const lastStudent = await Student.findOne({
    rollNumber: { $regex: pattern }
  }).sort({ rollNumber: -1 });

  let nextSerial = 1;
  if (lastStudent) {
    const lastSerial = parseInt(lastStudent.rollNumber.slice(-2), 10);
    nextSerial = lastSerial + 1;
  }

  if (nextSerial > 99) {
    throw new Error('Maximum students (99) reached for this class/section/month/year combination');
  }

  const nn = String(nextSerial).padStart(2, '0');
  const rollNumber = `${prefix}${nn}`;

  // Double-check uniqueness
  const existing = await Student.findOne({ rollNumber });
  if (existing) {
    throw new Error(`Roll number ${rollNumber} already exists. Please try again.`);
  }

  return rollNumber;
}

/**
 * Generate password from parent's name
 * Format: First letter capital + rest lowercase + "@ags"
 * Uses father's name first, falls back to mother's name
 */
function generatePassword(fatherName, motherName) {
  const name = fatherName || motherName;
  if (!name) {
    throw new Error('At least one parent name is required to generate password');
  }

  // Take first name only, capitalize first letter
  const firstName = name.trim().split(' ')[0];
  const formatted = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
  return `${formatted}@ags`;
}

module.exports = {
  generateRollNumber,
  generatePassword,
  CLASS_CODES,
  SECTION_B_CLASSES
};
