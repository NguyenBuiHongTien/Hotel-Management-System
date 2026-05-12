const { body, param } = require('express-validator');

const USER_ROLES = ['receptionist', 'housekeeper', 'maintenance', 'accountant', 'manager'];

const passwordStrong = () =>
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be 8–128 characters')
    .matches(/^(?=.*[A-Za-z])(?=.*\d)/)
    .withMessage('Password must include at least one letter and one number');

const passwordStrongOptional = () =>
  body('password')
    .optional({ values: 'undefined' })
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be 8–128 characters')
    .matches(/^(?=.*[A-Za-z])(?=.*\d)/)
    .withMessage('Password must include at least one letter and one number');

const createEmployeeRules = [
  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .isString()
    .trim()
    .isLength({ max: 120 })
    .withMessage('Name is too long'),
  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email')
    .normalizeEmail(),
  passwordStrong(),
  body('role')
    .notEmpty()
    .withMessage('Role is required')
    .isIn(USER_ROLES)
    .withMessage(`Role must be one of: ${USER_ROLES.join(', ')}`),
];

const updateEmployeeRules = [
  param('id').isMongoId().withMessage('Invalid employee id'),
  body('name')
    .optional({ values: 'undefined' })
    .isString()
    .trim()
    .isLength({ min: 1, max: 120 })
    .withMessage('Invalid name'),
  body('email')
    .optional({ values: 'undefined' })
    .isEmail()
    .withMessage('Invalid email')
    .normalizeEmail(),
  body('role')
    .optional({ values: 'undefined' })
    .isIn(USER_ROLES)
    .withMessage(`Role must be one of: ${USER_ROLES.join(', ')}`),
  passwordStrongOptional(),
];

const employeeIdParam = [param('id').isMongoId().withMessage('Invalid employee id')];

module.exports = {
  createEmployeeRules,
  updateEmployeeRules,
  employeeIdParam,
};
