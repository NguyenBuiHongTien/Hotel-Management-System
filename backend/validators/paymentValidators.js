const { body, query } = require('express-validator');

const PAYMENT_METHODS = ['cash', 'card', 'bank_transfer', 'online'];

const createPaymentRules = [
  body('invoiceId')
    .notEmpty().withMessage('invoiceId là bắt buộc')
    .isMongoId().withMessage('invoiceId không đúng định dạng'),
  body('paymentMethod')
    .notEmpty().withMessage('paymentMethod là bắt buộc')
    .isIn(PAYMENT_METHODS).withMessage('paymentMethod không hợp lệ'),
];

const transactionQueryRules = [
  query('fromDate')
    .optional()
    .isISO8601().withMessage('fromDate phải đúng định dạng ngày ISO'),
  query('toDate')
    .optional()
    .isISO8601().withMessage('toDate phải đúng định dạng ngày ISO'),
  query('method')
    .optional()
    .isIn(PAYMENT_METHODS).withMessage('method không hợp lệ'),
];

module.exports = {
  createPaymentRules,
  transactionQueryRules,
};
