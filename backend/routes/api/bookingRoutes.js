// routes/api/bookingRoutes.js
const { createBookingRules, updateBookingRules } = require('../../validators/bookingValidators');
const { validate } = require('../../middleware/validationMiddleware');

const express = require('express');
const router = express.Router();
const {
    createBooking,
    getAllBookings,
    getBookingById,
    updateBooking,
    cancelBooking
} = require('../../controllers/bookingController');
// Lấy hàm tạo hóa đơn
const { generateInvoiceForBooking } = require('../../controllers/invoiceController');
const { protect, authorize } = require('../../middleware/authMiddleware');

const R_M = ['receptionist', 'manager'];
const R_M_A = ['receptionist', 'manager', 'accountant'];

router.route('/')
    .post(protect, authorize(...R_M),createBookingRules, validate, createBooking)
    .get(protect, authorize(...R_M_A), getAllBookings);

router.route('/:bookingId')
    .get(protect, authorize(...R_M_A), getBookingById)
    .put(protect, authorize(...R_M), updateBookingRules, validate, updateBooking);

router.post('/:bookingId/cancel', protect, authorize(...R_M), cancelBooking);

// Route tạo hóa đơn (theo file Doc)
router.post('/:bookingId/invoice', protect, authorize(...R_M_A), generateInvoiceForBooking);

module.exports = router;