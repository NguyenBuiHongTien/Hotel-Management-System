/**
 * Seed Runner - Quản lý thứ tự seed cho các hệ thống lớn
 * 
 * Cách sử dụng:
 * - npm run seed:all    -> Seed tất cả theo thứ tự
 * - npm run seed:users  -> Chỉ seed users
 * - npm run seed:room-types -> Chỉ seed room types
 * - npm run seed:rooms  -> Chỉ seed rooms
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
// __dirname ở đây là backend/scripts/seeders -> cần đi lên 2 cấp để tới backend/.env
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Import các seed functions
const seedUsers = require('./seedUsers');
const seedRoomTypes = require('./seedRoomTypes');
const seedRooms = require('./seedRooms');

// Định nghĩa thứ tự seed và dependencies
const SEED_ORDER = [
  {
    name: 'users',
    fn: seedUsers,
    dependencies: [] // Không phụ thuộc gì
  },
  {
    name: 'room-types',
    fn: seedRoomTypes,
    dependencies: [] // Không phụ thuộc gì
  },
  {
    name: 'rooms',
    fn: seedRooms,
    dependencies: ['room-types'] // Phụ thuộc vào room-types
  }
];

const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URL) {
      throw new Error('MONGODB_URL not found in .env file');
    }
    await mongoose.connect(process.env.MONGODB_URL);
    console.log('✅ Connected to MongoDB\n');
  } catch (error) {
    console.error('❌ Error connecting to MongoDB:', error.message);
    process.exit(1);
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error disconnecting:', error.message);
  }
};

const runSeed = async (seedName) => {
  const seedConfig = SEED_ORDER.find(s => s.name === seedName);
  
  if (!seedConfig) {
    throw new Error(`Seed "${seedName}" not found`);
  }

  // Kiểm tra dependencies
  for (const dep of seedConfig.dependencies) {
    const depConfig = SEED_ORDER.find(s => s.name === dep);
    if (depConfig) {
      console.log(`⚠️  Warning: "${seedName}" depends on "${dep}". Make sure "${dep}" is seeded first.\n`);
    }
  }

  console.log(`🌱 Seeding: ${seedName}...`);
  await seedConfig.fn();
  console.log(`✅ Completed: ${seedName}\n`);
};

const runAllSeeds = async () => {
  console.log('🚀 Starting seed process...\n');
  
  for (const seedConfig of SEED_ORDER) {
    try {
      console.log(`🌱 Seeding: ${seedConfig.name}...`);
      await seedConfig.fn();
      console.log(`✅ Completed: ${seedConfig.name}\n`);
    } catch (error) {
      console.error(`❌ Error seeding ${seedConfig.name}:`, error.message);
      throw error;
    }
  }
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ All seeds completed successfully!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
};

// Main execution
const main = async () => {
  try {
    await connectDB();
    
    const args = process.argv.slice(2);
    const seedName = args[0];

    if (seedName) {
      // Seed một phần cụ thể
      await runSeed(seedName);
    } else {
      // Seed tất cả
      await runAllSeeds();
    }
    
    await disconnectDB();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Seed process failed:', error.message);
    await disconnectDB();
    process.exit(1);
  }
};

main();

