const { body } = require('express-validator');
const { normalizePhoneVN } = require('../utils/phoneNormalize');

const createBookingRules = [
  body('roomId')
    .notEmpty().withMessage('Room ID is required')
    .isMongoId().withMessage('Invalid room ID'),

  body('checkInDate')
    .notEmpty().withMessage('Check-in date is required')
    .isISO8601().withMessage('Invalid check-in date format')
    .custom((value) => {
      const inDay = new Date(value);
      inDay.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (inDay < today) {
        throw new Error('Check-in date cannot be before today');
      }
      return true;
    }),

  body('checkOutDate')
    .notEmpty().withMessage('Check-out date is required')
    .isISO8601().withMessage('Invalid check-out date format')
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.checkInDate)) {
        throw new Error('Check-out date must be after check-in date');
      }
      return true;
    }),

  body('numberOfGuests')
    .optional()
    .isInt({ min: 1, max: 10 }).withMessage('Number of guests must be between 1 and 10'),

  body('guestInfo.fullName')
    .if(body('customerId').isEmpty())
    .notEmpty().withMessage('Full name is required'),

  body('guestInfo.phoneNumber')
    .if(body('customerId').isEmpty())
    .customSanitizer(normalizePhoneVN)
    .notEmpty().withMessage('Phone number is required')
    .matches(/^[0-9]{10,11}$/).withMessage('Phone number must be 10–11 digits (e.g. 0901234567 or +84 901 234 567)'),

  body('guestInfo.email')
    .optional({ values: 'falsy' })
    .isEmail().withMessage('Invalid email'),
];

const updateBookingRules = [
  body('roomId')
    .optional()
    .isMongoId().withMessage('Invalid room ID'),
  body('checkInDate')
    .optional()
    .isISO8601().withMessage('Invalid check-in date format'),
  body('checkOutDate')
    .optional()
    .isISO8601().withMessage('Invalid check-out date format'),
  body('checkOutDate')
    .optional()
    .custom((value, { req }) => {
      if (!req.body.checkInDate || !value) return true;
      if (new Date(value) <= new Date(req.body.checkInDate)) {
        throw new Error('Check-out date must be after check-in date');
      }
      return true;
    }),
  body('numberOfGuests')
    .optional()
    .isInt({ min: 1, max: 10 }).withMessage('Number of guests must be between 1 and 10'),
];

module.exports = { createBookingRules, updateBookingRules };
