const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/userModel');

const checkUserRole = async () => {
  try {
    if (!process.env.MONGODB_URL) {
      console.error('❌ Error: MONGODB_URL not found in .env file');
      process.exit(1);
    }

    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URL);
    console.log('✅ Connected to MongoDB\n');

    const accountant = await User.findOne({ email: 'accountant@hotel.com' });
    
    if (!accountant) {
      console.log('❌ User with email accountant@hotel.com not found');
    } else {
      console.log('📋 Accountant User Details:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`ID: ${accountant._id}`);
      console.log(`Name: ${accountant.name}`);
      console.log(`Email: ${accountant.email}`);
      console.log(`Role: '${accountant.role}'`);
      console.log(`Role type: ${typeof accountant.role}`);
      console.log(`Role length: ${accountant.role?.length || 0}`);
      console.log(`Role char codes: ${accountant.role ? Array.from(accountant.role).map(c => c.charCodeAt(0)).join(', ') : 'N/A'}`);
      console.log(`Role === 'accountant': ${accountant.role === 'accountant'}`);
      console.log(`Role.toLowerCase() === 'accountant': ${accountant.role?.toLowerCase() === 'accountant'}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    }

    // Check all users
    const allUsers = await User.find({}).select('name email role');
    console.log('📋 All Users in Database:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    allUsers.forEach(user => {
      console.log(`Email: ${user.email} | Role: '${user.role}' (type: ${typeof user.role})`);
    });
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
};

checkUserRole();

