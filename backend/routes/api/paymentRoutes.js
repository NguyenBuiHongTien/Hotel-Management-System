// routes/api/paymentRoutes.js
const express = require('express');
const router = express.Router();
const {
    recordPayment,
    getTransactionHistory
} = require('../../controllers/paymentController');
const { protect, authorize } = require('../../middleware/authMiddleware');
const { createPaymentRules, transactionQueryRules } = require('../../validators/paymentValidators');
const { validate } = require('../../middleware/validationMiddleware');

// Record payment (receptionist, accountant)
router.post('/payments',
    protect,
    authorize('receptionist', 'accountant'),
    createPaymentRules,
    validate,
    recordPayment
);

// Transaction history (accountant, manager)
router.get('/transactions',
    protect,
    authorize('accountant', 'manager'),
    transactionQueryRules,
    validate,
    getTransactionHistory
);

module.exports = router;