/**
 * Seed script: Creates default admin user
 * Run: node seed.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const connectDB = require('./config/db');

async function seed() {
  try {
    await connectDB();

    // Check if admin already exists
    const existingAdmin = await User.findOne({ username: 'admin@ags.com', role: 'admin' });

    if (existingAdmin) {
      console.log('✅ Admin user already exists.');
      console.log(`   Username: ${existingAdmin.username}`);
      console.log('   Password: (already set)');
    } else {
      const admin = new User({
        username: 'admin@ags.com',
        password: 'admin123',
        role: 'admin',
        name: 'Admin',
        email: 'agstutorial050522@gmail.com',
        phone: '9839910481'
      });

      await admin.save();
      console.log('✅ Default admin user created successfully!');
      console.log('   Username: admin@ags.com');
      console.log('   Password: admin123');
      console.log('   ⚠️  CHANGE THE PASSWORD AFTER FIRST LOGIN!');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
}

seed();
