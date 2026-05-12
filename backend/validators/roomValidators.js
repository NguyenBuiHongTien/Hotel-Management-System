const { body } = require('express-validator');

const createRoomRules = [
  body('roomNumber')
    .notEmpty().withMessage('Room number is required')
    .isString().withMessage('Invalid room number')
    .trim(),

  body('roomTypeId')
    .notEmpty().withMessage('Room type ID is required')
    .isMongoId().withMessage('Invalid room type ID format'),

  body('floor')
    .notEmpty().withMessage('Floor is required')
    .isString().withMessage('Invalid floor format'),

  body('status')
    .optional()
    .isIn(['available', 'occupied', 'dirty', 'cleaning', 'maintenance']).withMessage('Invalid status')
];

const updateRoomRules = [
  body('roomNumber')
    .optional()
    .isString().withMessage('Invalid room number')
    .trim(),
  body('roomTypeId')
    .optional()
    .isMongoId().withMessage('Invalid room type ID format'),
  body('floor')
    .optional()
    .isString().withMessage('Invalid floor format'),
];

const updateRoomStatusRules = [
  body('status')
    .notEmpty().withMessage('Status is required')
    .isIn(['available', 'occupied', 'dirty', 'cleaning', 'maintenance']).withMessage('Invalid status')
];

module.exports = { createRoomRules, updateRoomRules, updateRoomStatusRules };
