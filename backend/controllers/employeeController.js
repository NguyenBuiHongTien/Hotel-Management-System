const asyncHandler = require('express-async-handler');
const User = require('../models/userModel');

/**
 * @desc    Tạo tài khoản nhân viên mới
 * @route   POST /api/employees
 * @access  Private/Manager
 */
const createEmployee = asyncHandler(async (req, res) => {
    const { name, email, password, role } = req.body; // Khớp với userModel

    const userExists = await User.findOne({ email });
    if (userExists) {
        res.status(400); 
        throw new Error('Email đã tồn tại');
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
        throw new Error('Dữ liệu người dùng không hợp lệ');
    }
});

/**
 * @desc    Lấy danh sách nhân viên
 * @route   GET /api/employees
 * @access  Private/Manager
 */
const getAllEmployees = asyncHandler(async (req, res) => {
    const filter = {};
    if (req.query.role) {
        filter.role = req.query.role;
    }
    // userModel không có 'status', nên bỏ qua filter 'status'
    
    const users = await User.find(filter).select('-password');
    res.json(users);
});

/**
 * @desc    Lấy chi tiết 1 nhân viên
 * @route   GET /api/employees/:id
 * @access  Private/Manager
 */
const getEmployeeById = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id).select('-password');
    if (user) {
        res.json(user);
    } else {
        res.status(404);
        throw new Error('Không tìm thấy nhân viên');
    }
});

/**
 * @desc    Cập nhật thông tin nhân viên
 * @route   PUT /api/employees/:id
 * @access  Private/Manager
 */
const updateEmployee = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (user) {
        const { name, email, role } = req.body; // userModel không có 'status' hay 'phoneNumber'

        user.name = name || user.name;
        user.role = role || user.role;
        
        if (email && email !== user.email) {
            const emailExists = await User.findOne({ email });
            if (emailExists) {
                res.status(400);
                throw new Error('Email đã được sử dụng');
            }
            user.email = email;
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
        throw new Error('Không tìm thấy nhân viên');
    }
});

/**
 * @desc    Xóa nhân viên
 * @route   DELETE /api/employees/:id
 * @access  Private/Manager
 */
const deleteEmployee = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    
    if (user) {
        // userModel không có 'status', nên phải xóa cứng
        await User.deleteOne({ _id: user._id });
        res.json({ message: 'Nhân viên đã được xóa' });
    } else {
        res.status(404);
        throw new Error('Không tìm thấy nhân viên');
    }
});

module.exports = { 
  createEmployee,
  getAllEmployees, 
  getEmployeeById, 
  updateEmployee, 
  deleteEmployee 
};