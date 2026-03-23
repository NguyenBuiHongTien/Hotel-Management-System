const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

// Hàm helper để tạo token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

/**
 * @desc    Đăng nhập (xác thực) người dùng
 * @route   POST /api/auth/login
 * @access  Public
 */
const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body; // Dùng email theo userModel

    if (!email || !password) {
        res.status(400);
        throw new Error('Vui lòng cung cấp email và mật khẩu');
    }

    const user = await User.findOne({ email }).select('+password');

    if (user && (await user.matchPassword(password))) {
        res.json({
            _id: user._id,
            name: user.name, // Khớp với userModel
            email: user.email,
            role: user.role,
            token: generateToken(user._id),
        });
    } else {
        res.status(401);
        throw new Error('Email hoặc mật khẩu không hợp lệ');
    }
});

/**
 * @desc    Lấy thông tin profile của user đang đăng nhập
 * @route   GET /api/auth/profile
 * @access  Private
 */
const getProfile = asyncHandler(async (req, res) => {
    // req.user được gán từ middleware 'protect'
    const user = await User.findById(req.user._id).select('-password');
    
    if (user) {
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
        });
    } else {
        res.status(404);
        throw new Error('Không tìm thấy người dùng');
    }
});

/**
 * @desc    Đăng xuất người dùng
 * @route   POST /api/auth/logout
 * @access  Private
 */
const logoutUser = asyncHandler(async (req, res) => {
  // Với JWT, client chỉ cần xóa token.
  // Nếu dùng cookie, bạn sẽ xóa cookie tại đây.
  res.status(200).json({ message: 'Đăng xuất thành công' });
});

module.exports = { 
  loginUser, 
  getProfile, 
  logoutUser
};