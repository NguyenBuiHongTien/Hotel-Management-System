const asyncHandler = require('express-async-handler');
const User = require('../models/userModel');

/**
 * @desc    Create staff account
 * @route   POST /api/employees
 * @access  Private/Manager
 */
const createEmployee = asyncHandler(async (req, res) => {
    const { name, email, password, role } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
        res.status(400);
        throw new Error('Email already exists');
    }

    const user = await User.create({
        name,
        email,
        password,
        role,
    });

    if (user) {
        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
        });
    } else {
        res.status(400);
        throw new Error('Invalid user data');
    }
});

/**
 * @desc    List employees
 * @route   GET /api/employees
 * @access  Private/Manager
 */
const getAllEmployees = asyncHandler(async (req, res) => {
    const filter = {};
    if (req.query.role) {
        filter.role = req.query.role;
    }

    const users = await User.find(filter).select('-password');
    res.json(users);
});

/**
 * @desc    Get employee by ID
 * @route   GET /api/employees/:id
 * @access  Private/Manager
 */
const getEmployeeById = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id).select('-password');
    if (user) {
        res.json(user);
    } else {
        res.status(404);
        throw new Error('Employee not found');
    }
});

/**
 * @desc    Update employee
 * @route   PUT /api/employees/:id
 * @access  Private/Manager
 */
const updateEmployee = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id).select('+password');

    if (user) {
        const { name, email, role, password } = req.body;

        if (name !== undefined) user.name = name;
        if (role !== undefined) user.role = role;

        if (email && email !== user.email) {
            const emailExists = await User.findOne({ email });
            if (emailExists) {
                res.status(400);
                throw new Error('Email is already in use');
            }
            user.email = email;
        }

        if (password) {
            user.password = password;
        }

        const updatedUser = await user.save();
        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
        });
    } else {
        res.status(404);
        throw new Error('Employee not found');
    }
});

/**
 * @desc    Delete employee
 * @route   DELETE /api/employees/:id
 * @access  Private/Manager
 */
const deleteEmployee = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (user) {
        await User.deleteOne({ _id: user._id });
        res.json({ message: 'Employee deleted' });
    } else {
        res.status(404);
        throw new Error('Employee not found');
    }
});

module.exports = {
  createEmployee,
  getAllEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee
};
