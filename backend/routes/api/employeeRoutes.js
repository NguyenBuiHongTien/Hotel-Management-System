const express = require('express');
const router = express.Router();
const {
  createEmployee,
  getAllEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee
} = require('../../controllers/employeeController');

const { protect, authorize } = require('../../middleware/authMiddleware');
const { validate } = require('../../middleware/validationMiddleware');
const {
  createEmployeeRules,
  updateEmployeeRules,
  employeeIdParam,
} = require('../../validators/employeeValidators');

router.use(protect, authorize('manager'));

router.route('/')
  .post(createEmployeeRules, validate, createEmployee)
  .get(getAllEmployees);

router.route('/:id')
  .get(employeeIdParam, validate, getEmployeeById)
  .put(updateEmployeeRules, validate, updateEmployee)
  .delete(employeeIdParam, validate, deleteEmployee);

module.exports = router;
