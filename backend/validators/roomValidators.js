const { body } = require('express-validator');

const createRoomRules = [
  body('roomNumber')
    .notEmpty().withMessage('Số phòng là bắt buộc')
    .isString().withMessage('Số phòng không hợp lệ')
    .trim(),
  
  body('roomTypeId')
    .notEmpty().withMessage('ID loại phòng là bắt buộc')
    .isMongoId().withMessage('ID loại phòng không đúng format'),

  body('floor')
    .notEmpty().withMessage('Tầng là bắt buộc')
    .isString().withMessage('Tầng không đúng format'),

  body('status')
    .optional()
    .isIn(['available', 'occupied', 'dirty', 'cleaning', 'maintenance']).withMessage('Trạng thái không hợp lệ')
];

const updateRoomRules = [
  body('roomNumber')
    .optional()
    .isString().withMessage('Số phòng không hợp lệ')
    .trim(),
  body('roomTypeId')
    .optional()
    .isMongoId().withMessage('ID loại phòng không đúng format'),
  body('floor')
    .optional()
    .isString().withMessage('Tầng không đúng format'),
];

const updateRoomStatusRules = [
  body('status')
    .notEmpty().withMessage('Trạng thái là bắt buộc')
    .isIn(['available', 'occupied', 'dirty', 'cleaning', 'maintenance']).withMessage('Trạng thái không hợp lệ')
];

module.exports = { createRoomRules, updateRoomRules, updateRoomStatusRules };