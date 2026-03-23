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

// Public routes
router.post('/login',loginLimiter, loginUser);

// Protected routes
router.get('/profile', protect, getProfile);
router.post('/logout', protect, logoutUser);

module.exports = router;
