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

// Receptionist, manager, accountant
const R_M_A = ['receptionist', 'manager', 'accountant'];
router.use(protect, authorize(...R_M_A));

router.route('/').get(getAllInvoices);

router.get('/guest/:bookingId', getGuestInvoiceView);
router.get('/financial/:bookingId', authorize('accountant'), getFinancialInvoiceView);
router.route('/:invoiceId').get(getInvoiceById);

module.exports = router;