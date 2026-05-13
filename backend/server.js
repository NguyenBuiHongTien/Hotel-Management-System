const dotenv = require('dotenv');
const connectDB = require('./config/db.js');
const createApp = require('./app');
const { startBookingReminderScheduler } = require('./services/bookingReminderService');

dotenv.config();

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 16) {
  console.error('❌ JWT_SECRET must be set securely (at least 16 characters).');
  process.exit(1);
}

if (!process.env.FRONTEND_URL) {
  console.error('❌ FRONTEND_URL is not set in .env');
  process.exit(1);
}

connectDB();

const app = createApp();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  if (process.env.NODE_ENV !== 'test') {
    startBookingReminderScheduler();
  }
});
