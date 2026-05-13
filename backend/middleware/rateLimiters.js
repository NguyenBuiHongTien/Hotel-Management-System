const rateLimit = require('express-rate-limit');

const isDevLike = ['development', 'test'].includes(process.env.NODE_ENV);
const multiplier = isDevLike ? 4 : 1;
const withEnvScale = (value) => Math.round(value * multiplier);

// Login rate limiter (brute-force protection)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: withEnvScale(5),
  skipSuccessfulRequests: true,
  message: 'Too many failed login attempts. Please try again in 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
});

// All auth routes (lighter than loginLimiter)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: withEnvScale(50),
  message: 'Too many auth-related requests. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter limiter for mutating requests
const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: withEnvScale(80),
  skip: (req) => ['GET', 'HEAD', 'OPTIONS'].includes(req.method),
  message: 'Too many write requests. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Default API GET limiter
const readLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: withEnvScale(180),
  skip: (req) => {
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return true;
    return req.path.startsWith('/dashboard')
      || req.path.startsWith('/room-types')
      || req.path.startsWith('/transactions');
  },
  message: 'Too many requests. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Lighter limiter for dashboard and room-types (GET)
const lightReadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: withEnvScale(400),
  skip: (req) => !['GET', 'HEAD', 'OPTIONS'].includes(req.method),
  message: 'Too many requests. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  loginLimiter,
  authLimiter,
  writeLimiter,
  readLimiter,
  lightReadLimiter,
};
