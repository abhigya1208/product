const rawData = `Roll Numb	Name	Father Na	Class	Phone	Remarks	Status	Siblings	Enrolled D
26030101	SAMAY	Mr. Viresh	1	75228938	Good in st	Active		3/31/2026
26030102	NIDHI	Mr. Mada	1	97735527	Good in st	Active		3/31/2026
26031001	ASHISH	SHAITAN S	10	96670859	Active		3/26/2026
26031002	LAKSHYA	NEERAJ KU	10	89205455	Active	BHAWNA	3/29/2026
26031003	GOURI SIN	PRABHAT	10	92052244	PASS WITH	Active		3/30/2026
26031004	KHUSHI	RAVINDER	10	99115354	Active		3/30/2026
26041001	PRIYANSH	CHANDRA	10	97177255	Active		4/15/2026
26041201	BHAWNA	NEERAJ KU	12	89305455	Active	LAKSHYA	4/15/2026
26041202	MAHAK	TAJBULLA	12	78271456	Active		4/15/2026
26041203	ANANYA	VIJAY	12	84478617	Active		4/15/2026
26041301	Nikhi	Mr.kishan	13	93546533	Average ir	Active		4/3/2026
26041302	Arohi	Mr.ranjee	13	84332364	Average ir	Active		4/3/2026`;

function parseTabular(text) {
  const lines = text.trim().split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return { headers: [], rows: [] };
  const delimiter = '\t';
  const headers = lines[0].split(delimiter).map(h => h.trim());
  const rows = lines.slice(1).map(line => {
    const cells = line.split(delimiter).map(c => c.trim());
    const obj = {};
    headers.forEach((h, i) => { obj[h] = cells[i] || ''; });
    return obj;
  });
  return { headers, rows };
}

const COLUMN_ALIASES = {
  name: ['name', 'student name', 'student_name', 'studentname', 'full name'],
  fatherName: ['father name', 'father_name', 'fathername', 'father na', 'father\'s name', 'father', 'parent name'],
  studentClass: ['class', 'studentclass', 'student_class', 'grade'],
  phone: ['phone', 'contact', 'mobile', 'phone number', 'phone no', 'phone_number', 'parent contact'],
  rollNumber: ['roll number', 'rollnumber', 'roll_number', 'roll no', 'roll', 'roll numb', 'roll numbe'],
  admissionDate: ['enrolled date', 'enrolled d', 'enrollment date', 'admission date', 'admission_date', 'admissiondate', 'enrolled', 'date'],
  status: ['status'],
};

function autoMapColumns(headers) {
  const mapping = {};
  const lowerHeaders = headers.map(h => h.toLowerCase().trim());
  for (const [field, aliases] of Object.entries(COLUMN_ALIASES)) {
    const idx = lowerHeaders.findIndex(h => aliases.some(a => h.includes(a)));
    if (idx !== -1) mapping[field] = headers[idx];
  }
  return mapping;
}

const CLASSES = ['NUR', 'LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
const SECTION_B_CLASSES = ['4', '5', '6', '7', '8'];

function parseClassSection(raw) {
  if (!raw) return { studentClass: '', section: 'A' };
  const str = String(raw).trim().toUpperCase();
  if (str.match(/^U\.?K\.?G\.?$/)) return { studentClass: 'UKG', section: 'A' };
  if (str.match(/^L\.?K\.?G\.?$/)) return { studentClass: 'LKG', section: 'A' };
  if (str.match(/^NUR(SERY)?$/i)) return { studentClass: 'NUR', section: 'A' };

  const match = str.match(/^(\d{1,2})\s*([AB])?$/);
  if (match) {
    const cls = match[1];
    const sec = match[2] || 'A';
    if (CLASSES.includes(cls)) {
      if (sec === 'B' && !SECTION_B_CLASSES.includes(cls)) {
        return { studentClass: cls, section: 'A' };
      }
      return { studentClass: cls, section: sec };
    }
  }
  return { studentClass: str, section: 'A' };
}

function mapRowToStudent(row, mapping) {
  const get = (field) => {
    const col = mapping[field];
    return col ? (row[col] || '').trim() : '';
  };
  const { studentClass, section } = parseClassSection(get('studentClass'));
  return {
    name: get('name'),
    fatherName: get('fatherName'),
    phone: get('phone'),
    studentClass,
    section,
    rollNumber: get('rollNumber'),
    _valid: !!get('name') && !!studentClass && CLASSES.includes(studentClass),
  };
}

const { headers, rows } = parseTabular(rawData);
const mapping = autoMapColumns(headers);
const mapped = rows.map(r => mapRowToStudent(r, mapping));

console.log("Valid Rows:", mapped.filter(r => r._valid).length);
console.log("Invalid Rows:", mapped.filter(r => !r._valid).length);

const payload = mapped.filter(r => r._valid).map(r => ({
    name: r.name,
    fatherName: r.fatherName,
    studentClass: r.studentClass,
    section: r.section,
    rollNumber: r.rollNumber
}));

require('dotenv').config();
require('./config/db')().then(async () => {
    console.log("Calling bulkImportStudents with payload size:", payload.length);
    const admin = require('./controllers/adminController');
    const req = { body: { students: payload }, user: { _id: new (require('mongoose')).Types.ObjectId() } };
    const res = { json: (d)=>console.log(JSON.stringify(d, null, 2)), status: (s)=>{console.log('Status:', s); return res;} };
    await admin.bulkImportStudents(req, res);
    process.exit(0);
});
