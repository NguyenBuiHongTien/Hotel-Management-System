// routes/api/checkinRoutes.js
const express = require('express');
const router = express.Router();
const {
    checkIn,
    checkOut
} = require('../../controllers/checkinController');
const { protect, authorize } = require('../../middleware/authMiddleware');
const { checkInRules, checkOutRules } = require('../../validators/checkinValidators');
const { validate } = require('../../middleware/validationMiddleware');

// Receptionist only
router.post('/checkin', protect, authorize('receptionist'), checkInRules, validate, checkIn);
router.post('/checkout', protect, authorize('receptionist'), checkOutRules, validate, checkOut);

module.exports = router;