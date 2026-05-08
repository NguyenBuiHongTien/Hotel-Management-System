const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const connectDB = require('./config/db.js');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const { startBookingReminderScheduler } = require('./services/bookingReminderService');

// Import 9 routes cũ
const authRoutes = require('./routes/api/authRoutes');
const employeeRoutes = require('./routes/api/employeeRoutes');
const bookingRoutes = require('./routes/api/bookingRoutes');
const roomRoutes = require('./routes/api/roomRoutes'); 
const roomTypeRoutes = require('./routes/api/roomTypeRoutes');
const guestRoutes = require('./routes/api/guestRoutes');
const invoiceRoutes = require('./routes/api/invoiceRoutes');
const maintenanceRoutes = require('./routes/api/maintenanceRoutes');
const reportRoutes = require('./routes/api/reportRoutes');

// --- BỔ SUNG 3 ROUTES MỚI ---
const checkinRoutes = require('./routes/api/checkinRoutes');
const paymentRoutes = require('./routes/api/paymentRoutes');
const dashboardRoutes = require('./routes/api/dashboardRoutes');

dotenv.config();

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 16) {
  console.error('❌ JWT_SECRET chưa được cấu hình an toàn (tối thiểu 16 ký tự).');
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
  console.error('❌ FRONTEND_URL không được cấu hình trong .env');
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

// Rate limiting theo mức độ endpoint/method
app.use('/api/auth', authLimiter);
app.use('/api/dashboard', lightReadLimiter);
app.use('/api/room-types', lightReadLimiter);
app.use('/api/transactions', lightReadLimiter);
app.use('/api', writeLimiter);
app.use('/api', readLimiter);

// --- Định nghĩa các API Routes ---

// 1. Các routes có tiền tố (prefix) rõ ràng
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/rooms', roomRoutes); 
app.use('/api/room-types', roomTypeRoutes);
app.use('/api/guests', guestRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/dashboard', dashboardRoutes); // -> /api/dashboard/revenue

// 2. Các routes MỚI không có tiền tố (gắn thẳng vào /api)
// (Vì các route này đã tự định nghĩa đường dẫn đầy đủ)
app.use('/api', paymentRoutes); // -> /api/payments, /api/transactions
app.use('/api', checkinRoutes); // -> /api/checkin, /api/checkout

// ------------------------------------

// Sử dụng Middleware xử lý lỗi (Phải đặt ở CUỐI CÙNG)
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  if (process.env.NODE_ENV !== 'test') {
    startBookingReminderScheduler();
  }
});