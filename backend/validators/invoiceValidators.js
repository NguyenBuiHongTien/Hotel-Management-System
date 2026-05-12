const { body } = require('express-validator');

const createInvoiceRules = [
  body('totalAmount')
    .notEmpty().withMessage('Total amount is required')
    .isFloat({ min: 0 }).withMessage('Total amount must be a non-negative number'),

  body('paymentStatus')
    .optional()
    .isIn(['pending', 'paid', 'cancelled']).withMessage('Invalid payment status'),

  body('paymentMethod')
    .optional()
    .isIn(['cash', 'card', 'bank_transfer', 'online']).withMessage('Invalid payment method'),
];

module.exports = { createInvoiceRules };
