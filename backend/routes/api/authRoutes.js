// routes/api/authRoutes.js
const { loginLimiter } = require('../../middleware/rateLimiters');

const express = require('express');
const router = express.Router();
const {
    loginUser,
    getProfile,
    logoutUser
} = require('../../controllers/authController');
const { protect } = require('../../middleware/authMiddleware');
const { validate } = require('../../middleware/validationMiddleware');
const { loginRules } = require('../../validators/authValidators');

// Public routes
router.post('/login', loginLimiter, loginRules, validate, loginUser);

// Protected routes
router.get('/profile', protect, getProfile);
router.post('/logout', protect, logoutUser);

module.exports = router;
