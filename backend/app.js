const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./config/openapi.json');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

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

const {
  authLimiter,
  writeLimiter,
  readLimiter,
  lightReadLimiter,
} = require('./middleware/rateLimiters');

/**
 * Build Express app (no DB connect, no listen). Used by server.js and Jest.
 */
function createApp() {
  const app = express();

  app.disable('x-powered-by');

  if (process.env.TRUST_PROXY === 'true') {
    app.set('trust proxy', 1);
  }

  const isProd = process.env.NODE_ENV === 'production';
  // Swagger UI needs relaxed CSP in non-production; keep default Helmet in production.
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      ...(!isProd ? { contentSecurityPolicy: false } : {}),
    })
  );

  const allowedOrigins = (process.env.FRONTEND_URL || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.use(
    cors({
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
      credentials: true,
    })
  );

  app.get('/api/health', (req, res) => {
    res.status(200).json({ ok: true });
  });

  const swaggerEnabled = !isProd || process.env.ENABLE_SWAGGER === 'true';
  if (swaggerEnabled) {
    app.use(
      '/api/docs',
      swaggerUi.serve,
      swaggerUi.setup(swaggerDocument, {
        customSiteTitle: 'Hotel Management API',
      })
    );
  }

  app.use(express.json({ limit: '100kb' }));

  app.use('/api/auth', authLimiter);
  app.use('/api/dashboard', lightReadLimiter);
  app.use('/api/room-types', lightReadLimiter);
  app.use('/api/transactions', lightReadLimiter);
  app.use('/api', writeLimiter);
  app.use('/api', readLimiter);

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

  return app;
}

module.exports = createApp;
