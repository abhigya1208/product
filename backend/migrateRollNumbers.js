/**
 * Migration Script: Remove month (MM) from all existing roll numbers
 *
 * Old format: YYMMCCCSNN (10 digits) → e.g. 2604005001
 * New format: YYCCCSNN   (8 digits)  → e.g. 26005001
 *
 * This script:
 * 1. Reads all students with 10-digit roll numbers
 * 2. Strips the month portion (characters at index 2-3)
 * 3. Detects and resolves conflicts by incrementing the serial number
 * 4. Updates both Student.rollNumber and User.username (since username = rollNumber)
 * 5. Logs all changes for audit purposes
 *
 * Usage: node migrateRollNumbers.js
 *   (run from the backend directory)
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Student = require('./models/Student');
const User = require('./models/User');
const connectDB = require('./config/db');

async function migrate() {
  // Connect to database
  await connectDB();

  console.log('=== Roll Number Migration: Remove Month Component ===\n');

  // 1. Fetch all students with 10-digit roll numbers (old format)
  const students = await Student.find({
    rollNumber: { $regex: /^\d{10}$/ }
  }).sort({ rollNumber: 1 });

  if (students.length === 0) {
    console.log('No students with 10-digit roll numbers found. Nothing to migrate.');
    process.exit(0);
  }

  console.log(`Found ${students.length} students with 10-digit (old format) roll numbers.\n`);

  // 2. Compute new roll numbers and detect conflicts
  const changes = []; // { student, oldRoll, newRoll }
  const newRollMap = new Map(); // newRoll -> list of students wanting that roll

  for (const student of students) {
    const old = student.rollNumber;
    // Old: YY MM CCC S NN  (positions: 0-1, 2-3, 4-6, 7, 8-9)
    // New: YY    CCC S NN  (strip positions 2-3)
    const yy  = old.slice(0, 2);
    const ccc = old.slice(4, 7);
    const s   = old.slice(7, 8);
    const nn  = old.slice(8, 10);
    const newRoll = `${yy}${ccc}${s}${nn}`;

    if (!newRollMap.has(newRoll)) {
      newRollMap.set(newRoll, []);
    }
    newRollMap.get(newRoll).push({ student, oldRoll: old });
  }

  // 3. Resolve conflicts — if multiple old rolls map to the same new roll,
  //    keep the first one as-is and increment serial for the rest
  const usedRolls = new Set();

  // Also include any existing 8-digit roll numbers already in the DB (new students)
  const existingNew = await Student.find({
    rollNumber: { $regex: /^\d{8}$/ }
  });
  for (const s of existingNew) {
    usedRolls.add(s.rollNumber);
  }

  let conflictCount = 0;

  for (const [baseNewRoll, entries] of newRollMap) {
    for (let i = 0; i < entries.length; i++) {
      let candidate = baseNewRoll;

      if (i > 0 || usedRolls.has(candidate)) {
        // Conflict — need to find next available serial
        const prefix = candidate.slice(0, 6); // YYCCCS
        let serial = parseInt(candidate.slice(6, 8), 10);

        while (usedRolls.has(candidate)) {
          serial++;
          if (serial > 99) {
            throw new Error(`Cannot resolve conflict for prefix ${prefix}: serials exhausted (>99)`);
          }
          candidate = `${prefix}${String(serial).padStart(2, '0')}`;
        }

        if (candidate !== baseNewRoll) {
          conflictCount++;
          console.log(`  ⚠️  CONFLICT: ${entries[i].oldRoll} → ${baseNewRoll} (taken) → resolved to ${candidate}`);
        }
      }

      usedRolls.add(candidate);
      changes.push({
        student: entries[i].student,
        oldRoll: entries[i].oldRoll,
        newRoll: candidate
      });
    }
  }

  console.log(`\nTotal changes:  ${changes.length}`);
  console.log(`Conflicts resolved: ${conflictCount}\n`);

  // 4. Dry-run summary
  console.log('--- Preview (first 20) ---');
  for (const c of changes.slice(0, 20)) {
    console.log(`  ${c.oldRoll}  →  ${c.newRoll}  (${c.student.name})`);
  }
  if (changes.length > 20) {
    console.log(`  ... and ${changes.length - 20} more\n`);
  }

  // 5. Apply changes
  console.log('\nApplying changes...\n');

  let successCount = 0;
  let errorCount = 0;

  for (const c of changes) {
    try {
      // Update Student.rollNumber
      await Student.updateOne(
        { _id: c.student._id },
        { $set: { rollNumber: c.newRoll } }
      );

      // Update User.username (roll number is used as the login username)
      await User.updateOne(
        { _id: c.student.userId, username: c.oldRoll.toLowerCase() },
        { $set: { username: c.newRoll.toLowerCase() } }
      );

      successCount++;
    } catch (err) {
      errorCount++;
      console.error(`  ❌ FAILED: ${c.oldRoll} → ${c.newRoll} (${c.student.name}): ${err.message}`);
    }
  }

  console.log('\n=== Migration Complete ===');
  console.log(`  ✅ Success: ${successCount}`);
  if (errorCount > 0) console.log(`  ❌ Errors:  ${errorCount}`);
  console.log(`  Total:     ${changes.length}\n`);

  // 6. Verification: ensure no duplicates remain
  const dupeCheck = await Student.aggregate([
    { $group: { _id: '$rollNumber', count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } }
  ]);

  if (dupeCheck.length > 0) {
    console.log('⚠️  WARNING: Duplicate roll numbers detected after migration:');
    for (const d of dupeCheck) {
      console.log(`    ${d._id} appears ${d.count} times`);
    }
  } else {
    console.log('✅ Verification passed: No duplicate roll numbers.\n');
  }

  process.exit(0);
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
