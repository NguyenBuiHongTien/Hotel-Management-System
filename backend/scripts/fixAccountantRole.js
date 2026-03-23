const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/userModel');

const fixAccountantRole = async () => {
  try {
    if (!process.env.MONGODB_URL) {
      console.error('❌ Error: MONGODB_URL not found in .env file');
      process.exit(1);
    }

    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URL);
    console.log('✅ Connected to MongoDB\n');

    // Find accountant user
    const accountant = await User.findOne({ email: 'accountant@hotel.com' });
    
    if (!accountant) {
      console.log('❌ User with email accountant@hotel.com not found');
      console.log('💡 Creating new accountant user...');
      
      const bcrypt = require('bcryptjs');
      const newAccountant = await User.create({
        name: 'Accountant',
        email: 'accountant@hotel.com',
        password: await bcrypt.hash('123456', 10),
        role: 'accountant'
      });
      console.log('✅ Created accountant user:', newAccountant.email, 'Role:', newAccountant.role);
    } else {
      console.log('📋 Current Accountant User:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`ID: ${accountant._id}`);
      console.log(`Email: ${accountant.email}`);
      console.log(`Current Role: '${accountant.role}' (type: ${typeof accountant.role})`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      // Fix role if needed
      if (accountant.role !== 'accountant') {
        console.log('🔧 Fixing role...');
        accountant.role = 'accountant';
        await accountant.save();
        console.log('✅ Role fixed to: accountant');
      } else {
        console.log('✅ Role is already correct: accountant');
      }

      // Verify
      const updated = await User.findById(accountant._id);
      console.log('\n📋 Updated Accountant User:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`Role: '${updated.role}'`);
      console.log(`Role === 'accountant': ${updated.role === 'accountant'}`);
      console.log(`Role.toLowerCase() === 'accountant': ${updated.role?.toLowerCase() === 'accountant'}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    }

    // List all users
    const allUsers = await User.find({}).select('name email role');
    console.log('📋 All Users in Database:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    allUsers.forEach(user => {
      console.log(`Email: ${user.email} | Role: '${user.role}'`);
    });
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('✅ Done! Please:');
    console.log('   1. Clear localStorage in browser (token and user)');
    console.log('   2. Restart backend server');
    console.log('   3. Login again with accountant@hotel.com / 123456\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
};

fixAccountantRole();

