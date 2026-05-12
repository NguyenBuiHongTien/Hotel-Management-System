/**
 * Seed runner — ordered seeds for larger setups.
 *
 * Usage:
 * - npm run seed:all    -> Seed everything in order
 * - npm run seed:users  -> Users only
 * - npm run seed:room-types -> Room types only
 * - npm run seed:rooms  -> Rooms only
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// __dirname is backend/scripts/seeders — go up two levels for backend/.env
dotenv.config({ path: path.join(__dirname, '../../.env') });

const seedUsers = require('./seedUsers');
const seedRoomTypes = require('./seedRoomTypes');
const seedRooms = require('./seedRooms');

const SEED_ORDER = [
  {
    name: 'users',
    fn: seedUsers,
    dependencies: []
  },
  {
    name: 'room-types',
    fn: seedRoomTypes,
    dependencies: []
  },
  {
    name: 'rooms',
    fn: seedRooms,
    dependencies: ['room-types']
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

const main = async () => {
  try {
    await connectDB();

    const args = process.argv.slice(2);
    const seedName = args[0];

    if (seedName) {
      await runSeed(seedName);
    } else {
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
