const bcrypt = require('bcryptjs');

const User = require('../../models/userModel');

module.exports = async function seedUsers() {
    const users = [
      {
        name: 'Manager',
        email: 'manager@hotel.com',
        password: await bcrypt.hash('HotelDemo1', 10),
        role: 'manager'
      },
      {
        name: 'Receptionist',
        email: 'receptionist@hotel.com',
        password: await bcrypt.hash('HotelDemo1', 10),
        role: 'receptionist'
      },
      {
        name: 'Accountant',
        email: 'accountant@hotel.com',
        password: await bcrypt.hash('HotelDemo1', 10),
        role: 'accountant'
      },
      {
        name: 'Housekeeper',
        email: 'housekeeper@hotel.com',
        password: await bcrypt.hash('HotelDemo1', 10),
        role: 'housekeeper'
      },
      {
        name: 'Maintenance',
        email: 'maintenance@hotel.com',
        password: await bcrypt.hash('HotelDemo1', 10),
        role: 'maintenance'
      }
    ];

    // Clear existing users (optional - comment out if you want to keep existing users)
    await User.deleteMany({});
    console.log('🗑️  Cleared existing users');

    // Insert new users
    await User.insertMany(users);
    console.log('✅ Users seeded successfully!');
    console.log('\n📋 Test Accounts:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    users.forEach(user => {
      console.log(`Email: ${user.email} | Password: [HIDDEN] | Role: ${user.role}`);
    });
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
};

