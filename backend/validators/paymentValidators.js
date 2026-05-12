const { body, query } = require('express-validator');

const PAYMENT_METHODS = ['cash', 'card', 'bank_transfer', 'online'];

const createPaymentRules = [
  body('invoiceId')
    .notEmpty().withMessage('invoiceId is required')
    .isMongoId().withMessage('invoiceId must be a valid Mongo ID'),
  body('paymentMethod')
    .notEmpty().withMessage('paymentMethod is required')
    .isIn(PAYMENT_METHODS).withMessage('Invalid paymentMethod'),
];

const transactionQueryRules = [
  query('fromDate')
    .optional()
    .isISO8601().withMessage('fromDate must be a valid ISO date'),
  query('toDate')
    .optional()
    .isISO8601().withMessage('toDate must be a valid ISO date'),
  query('method')
    .optional()
    .isIn(PAYMENT_METHODS).withMessage('Invalid method'),
];

module.exports = {
  createPaymentRules,
  transactionQueryRules,
};
