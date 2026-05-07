const { body } = require('express-validator');

const createBookingRules = [
  body('roomId')
    .notEmpty().withMessage('Room ID là bắt buộc')
    .isMongoId().withMessage('Room ID không hợp lệ'),
  
  body('checkInDate')
    .notEmpty().withMessage('Ngày check-in là bắt buộc')
    .isISO8601().withMessage('Ngày check-in không đúng format')
    .custom((value) => {
      const inDay = new Date(value);
      inDay.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (inDay < today) {
        throw new Error('Ngày check-in không thể trước hôm nay');
      }
      return true;
    }),
  
  body('checkOutDate')
    .notEmpty().withMessage('Ngày check-out là bắt buộc')
    .isISO8601().withMessage('Ngày check-out không đúng format')
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.checkInDate)) {
        throw new Error('Ngày check-out phải sau ngày check-in');
      }
      return true;
    }),
  
  body('numberOfGuests')
    .optional()
    .isInt({ min: 1, max: 10 }).withMessage('Số khách phải từ 1-10'),
  
  body('guestInfo.fullName')
    .if(body('customerId').isEmpty())
    .notEmpty().withMessage('Họ tên là bắt buộc'),
  
  body('guestInfo.phoneNumber')
    .if(body('customerId').isEmpty())
    .notEmpty().withMessage('Số điện thoại là bắt buộc')
    .matches(/^[0-9]{10,11}$/).withMessage('Số điện thoại không hợp lệ'),
  
  body('guestInfo.email')
    .optional()
    .isEmail().withMessage('Email không hợp lệ')
];

module.exports = { createBookingRules };