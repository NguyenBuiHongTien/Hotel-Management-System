const { body } = require('express-validator');

const createRoomRules = [
  body('roomNumber')
    .trim()
    .notEmpty().withMessage('Room number is required')
    .isString().withMessage('Invalid room number'),

  body('roomTypeId')
    .trim()
    .notEmpty().withMessage('Room type ID is required')
    .isMongoId().withMessage('Invalid room type ID format'),

  body('floor')
    .trim()
    .notEmpty().withMessage('Floor is required')
    .isString().withMessage('Invalid floor format'),
];

const updateRoomRules = [
  body('roomNumber')
    .optional({ values: 'falsy' })
    .trim()
    .isString().withMessage('Invalid room number'),
  body('roomTypeId')
    .optional({ values: 'falsy' })
    .trim()
    .isMongoId().withMessage('Invalid room type ID format'),
  body('floor')
    .optional({ values: 'falsy' })
    .trim()
    .isString().withMessage('Invalid floor format'),
];

const updateRoomStatusRules = [
  body('status')
    .notEmpty().withMessage('Status is required')
    .isIn(['available', 'occupied', 'dirty', 'cleaning', 'maintenance']).withMessage('Invalid status')
];

module.exports = { createRoomRules, updateRoomRules, updateRoomStatusRules };
