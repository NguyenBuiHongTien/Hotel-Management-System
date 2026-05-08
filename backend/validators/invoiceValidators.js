const { body } = require('express-validator');

const createInvoiceRules = [
  body('totalAmount')
    .notEmpty().withMessage('Tổng tiền là bắt buộc')
    .isFloat({ min: 0 }).withMessage('Tổng tiền phải là số không âm'),

  body('paymentStatus')
    .optional()
    .isIn(['pending', 'paid', 'cancelled']).withMessage('Trạng thái thanh toán không hợp lệ'),

  body('paymentMethod')
    .optional()
    .isIn(['cash', 'card', 'bank_transfer', 'online']).withMessage('Phương thức thanh toán không hợp lệ'),
];

module.exports = { createInvoiceRules };

