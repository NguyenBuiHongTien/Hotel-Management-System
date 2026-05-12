const { body } = require('express-validator');
const { normalizePhoneVN } = require('../utils/phoneNormalize');

const createGuestRules = [
   body('fullName')
    .notEmpty().withMessage('Full name is required')
    .isString().withMessage('Full name must be a string')
    .trim(),

  body('phoneNumber')
    .customSanitizer(normalizePhoneVN)
    .notEmpty().withMessage('Phone number is required')
    .matches(/^[0-9]{10,11}$/).withMessage('Phone number must be 10–11 digits (e.g. 0901234567 or +84 901 234 567)'),

  body('email')
    .optional({ values: 'falsy' })
    .isEmail().withMessage('Invalid email')
    .normalizeEmail(),

  body('address')
    .optional()
    .isString().withMessage('Address must be a string')
    .trim()
];

const updateGuestRules = [
  body('fullName')
    .notEmpty().withMessage('Full name is required')
    .isString().trim(),
  body('phoneNumber')
    .customSanitizer(normalizePhoneVN)
    .notEmpty().withMessage('Phone number is required')
    .matches(/^[0-9]{10,11}$/).withMessage('Phone number must be 10–11 digits (e.g. 0901234567 or +84 901 234 567)'),
  body('email').optional({ values: 'falsy' }).isEmail().normalizeEmail(),
  body('address').optional().isString().trim()
];

module.exports = { createGuestRules, updateGuestRules };
