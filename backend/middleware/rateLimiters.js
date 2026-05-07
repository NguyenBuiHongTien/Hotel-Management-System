const rateLimit = require('express-rate-limit');

const isDevelopment = process.env.NODE_ENV === 'development';
const multiplier = isDevelopment ? 4 : 1;
const withEnvScale = (value) => Math.round(value * multiplier);

// Rate limiter cho login (chống brute force)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: withEnvScale(5),
  skipSuccessfulRequests: true,
  message: 'Quá nhiều lần đăng nhập thất bại, vui lòng thử lại sau 15 phút',
  standardHeaders: true,
  legacyHeaders: false,
});

// Limiter cho toàn bộ auth routes (nhẹ hơn loginLimiter, nhưng vẫn chặt)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: withEnvScale(50),
  message: 'Quá nhiều request liên quan xác thực, vui lòng thử lại sau',
  standardHeaders: true,
  legacyHeaders: false,
});

// Limiter mạnh cho các request ghi dữ liệu
const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: withEnvScale(80),
  skip: (req) => ['GET', 'HEAD', 'OPTIONS'].includes(req.method),
  message: 'Quá nhiều request ghi dữ liệu, vui lòng thử lại sau',
  standardHeaders: true,
  legacyHeaders: false,
});

// Limiter mặc định cho API GET
const readLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: withEnvScale(180),
  skip: (req) => {
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return true;
    // Các endpoint này sẽ dùng limiter nhẹ riêng
    return req.path.startsWith('/dashboard')
      || req.path.startsWith('/room-types')
      || req.path.startsWith('/transactions');
  },
  message: 'Quá nhiều request, vui lòng thử lại sau',
  standardHeaders: true,
  legacyHeaders: false,
});

// Limiter nhẹ hơn cho dashboard và room-types (GET)
const lightReadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: withEnvScale(400),
  skip: (req) => !['GET', 'HEAD', 'OPTIONS'].includes(req.method),
  message: 'Quá nhiều request, vui lòng thử lại sau',
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