// routes/api/invoiceRoutes.js
const express = require('express');
const router = express.Router();
const {
    getAllInvoices,
    getInvoiceById,
    getGuestInvoiceView,
    getFinancialInvoiceView
} = require('../../controllers/invoiceController');
const { protect, authorize } = require('../../middleware/authMiddleware');

// Kế toán, Lễ tân, Quản lý
const R_M_A = ['receptionist', 'manager', 'accountant'];
router.use(protect, authorize(...R_M_A));

router.route('/').get(getAllInvoices);
router.route('/:invoiceId').get(getInvoiceById);

// Routes xem theo Booking ID
router.get('/guest/:bookingId', getGuestInvoiceView);
router.get('/financial/:bookingId', authorize('accountant'), getFinancialInvoiceView); // View tài chính chỉ cho Kế toán

module.exports = router;