// routes/api/checkinRoutes.js
const express = require('express');
const router = express.Router();
const {
    checkIn,
    checkOut
} = require('../../controllers/checkinController');
const { protect, authorize } = require('../../middleware/authMiddleware');

// Chỉ Lễ tân cho đúng endpoint check-in/check-out
router.post('/checkin', protect, authorize('receptionist'), checkIn);
router.post('/checkout', protect, authorize('receptionist'), checkOut);

module.exports = router;