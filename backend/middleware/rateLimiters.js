const rateLimit = require('express-rate-limit');

// Rate limiter cho login (chống brute force)
const loginLimiter = rateLimit({
  windowMs: 15 * 1000, 
  max: 5, // Tối đa 5 lần thử
  message: 'Quá nhiều lần đăng nhập thất bại, vui lòng thử lại sau 15 phút',
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter chung cho API
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 100, // Tối đa 100 requests
  message: 'Quá nhiều requests, vui lòng thử lại sau',
});

module.exports = { loginLimiter, apiLimiter };