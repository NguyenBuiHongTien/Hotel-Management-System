// config/db.js
const mongoose = require('mongoose'); // Dùng 'require'

const connectDB = async () => {
  try {
    mongoose.set('strictQuery', true);
    
    const conn = await mongoose.connect(process.env.MONGODB_URL); 
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

// Dùng 'module.exports'
module.exports = connectDB;