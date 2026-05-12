const { body } = require('express-validator');

const bookingIdRule = body('bookingId')
  .notEmpty().withMessage('bookingId is required')
  .isMongoId().withMessage('bookingId must be a valid Mongo ID');

const checkInRules = [bookingIdRule];
const checkOutRules = [bookingIdRule];

module.exports = {
  checkInRules,
  checkOutRules,
};
