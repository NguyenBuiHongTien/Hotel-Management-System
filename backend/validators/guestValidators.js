const { body } = require('express-validator');

const createGuestRules = [
   body('fullName')
    .notEmpty().withMessage('Họ và tên là bắt buộc')
    .isString().withMessage('Họ và tên phải là chuỗi')
    .trim(),
  
  body('phoneNumber')
    .notEmpty().withMessage('Số điện thoại là bắt buộc')
    .matches(/^[0-9]{10,11}$/).withMessage('Số điện thoại phải có 10–11 chữ số'),

  body('email')
    .optional()
    .isEmail().withMessage('Email không hợp lệ')
    .normalizeEmail(),

  body('address')
    .optional()
    .isString().withMessage('Địa chỉ phải là chuỗi')
    .trim()
];

const updateGuestRules = [
  body('fullName')
    .notEmpty().withMessage('Họ và tên là bắt buộc')
    .isString().trim(),
  body('phoneNumber')
    .notEmpty().withMessage('Số điện thoại là bắt buộc')
    .matches(/^[0-9]{10,11}$/).withMessage('Số điện thoại phải có 10–11 chữ số'),
  body('email').optional().isEmail().normalizeEmail(),
  body('address').optional().isString().trim()
];

module.exports = { createGuestRules, updateGuestRules };