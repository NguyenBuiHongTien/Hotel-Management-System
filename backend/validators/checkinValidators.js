const { body } = require('express-validator');

const bookingIdRule = body('bookingId')
  .notEmpty().withMessage('bookingId là bắt buộc')
  .isMongoId().withMessage('bookingId không đúng định dạng');

const checkInRules = [bookingIdRule];
const checkOutRules = [bookingIdRule];

module.exports = {
  checkInRules,
  checkOutRules,
};
