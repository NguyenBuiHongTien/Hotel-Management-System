// routes/api/checkinRoutes.js
const express = require('express');
const router = express.Router();
const {
    checkIn,
    checkOut
} = require('../../controllers/checkinController');
const { protect, authorize } = require('../../middleware/authMiddleware');

// Chỉ Lễ tân
router.use(protect, authorize('receptionist'));

router.post('/checkin', checkIn);
router.post('/checkout', checkOut);

module.exports = router;