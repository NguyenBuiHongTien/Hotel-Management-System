const { body } = require('express-validator');

const loginRules = [
  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isString()
    .isLength({ max: 256 })
    .withMessage('Invalid password'),
];

module.exports = { loginRules };
