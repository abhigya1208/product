require('dotenv').config();
const mongoose = require('mongoose');
const { generateRollNumber, generatePassword } = require('./utils/rollNumberGenerator');
const Student = require('./models/Student');
const User = require('./models/User');

async function testImport() {
  await require('./config/db')();

  const data = { name: 'Test Stud', studentClass: '4', section: 'B', fatherName: 'Bob', phone: '123' };
  console.log('Testing generateRollNumber...');
  try {
    const rollNumber = await generateRollNumber(data.studentClass, data.section, new Date());
    console.log('Generated roll:', rollNumber);

    const password = generatePassword(data.fatherName, null);
    console.log('Generated pass:', password);

    const user = new User({
      username: rollNumber,
      password,
      role: 'student',
      name: data.name,
      phone: data.phone
    });
    
    // Testing mongoose validation manually
    const userErr = user.validateSync();
    if (userErr) console.log('User Validation Error:', userErr.message);

    const student = new Student({
      userId: new mongoose.Types.ObjectId(), // fake id
      rollNumber,
      name: data.name,
      fatherName: data.fatherName,
      motherName: data.motherName,
      phone: data.phone,
      studentClass: data.studentClass,
      section: data.section || 'A',
      admissionDate: new Date(),
    });

    const studErr = student.validateSync();
    if (studErr) {
       console.log('Student Validation Error:', studErr.message);
    } else {
       console.log('Validation passed!');
    }
  } catch (err) {
    console.log('Runtime Error:', err.message);
  }
  process.exit(0);
}

testImport();
