const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const connectDB = require('./config/db.js');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const { startBookingReminderScheduler } = require('./services/bookingReminderService');

const authRoutes = require('./routes/api/authRoutes');
const employeeRoutes = require('./routes/api/employeeRoutes');
const bookingRoutes = require('./routes/api/bookingRoutes');
const roomRoutes = require('./routes/api/roomRoutes'); 
const roomTypeRoutes = require('./routes/api/roomTypeRoutes');
const guestRoutes = require('./routes/api/guestRoutes');
const invoiceRoutes = require('./routes/api/invoiceRoutes');
const maintenanceRoutes = require('./routes/api/maintenanceRoutes');
const reportRoutes = require('./routes/api/reportRoutes');

const checkinRoutes = require('./routes/api/checkinRoutes');
const paymentRoutes = require('./routes/api/paymentRoutes');
const dashboardRoutes = require('./routes/api/dashboardRoutes');

dotenv.config();

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 16) {
  console.error('❌ JWT_SECRET must be set securely (at least 16 characters).');
  process.exit(1);
}

connectDB();

const app = express();

app.disable('x-powered-by');

if (process.env.TRUST_PROXY === 'true') {
  app.set('trust proxy', 1);
}

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS configuration
if (!process.env.FRONTEND_URL) {
  console.error('❌ FRONTEND_URL is not set in .env');
  process.exit(1);
}

const allowedOrigins = process.env.FRONTEND_URL.split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    const corsError = new Error('Not allowed by CORS');
    corsError.status = 403;
    return callback(corsError);
  },
  credentials: true
}));

app.get('/api/health', (req, res) => {
  res.status(200).json({ ok: true });
});

app.use(express.json({ limit: '100kb' }));

const {
  authLimiter,
  writeLimiter,
  readLimiter,
  lightReadLimiter
} = require('./middleware/rateLimiters');

// Rate limiting by route/method
app.use('/api/auth', authLimiter);
app.use('/api/dashboard', lightReadLimiter);
app.use('/api/room-types', lightReadLimiter);
app.use('/api/transactions', lightReadLimiter);
app.use('/api', writeLimiter);
app.use('/api', readLimiter);

// API routes

app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/rooms', roomRoutes); 
app.use('/api/room-types', roomTypeRoutes);
app.use('/api/guests', guestRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.use('/api', paymentRoutes);
app.use('/api', checkinRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  if (process.env.NODE_ENV !== 'test') {
    startBookingReminderScheduler();
  }
});