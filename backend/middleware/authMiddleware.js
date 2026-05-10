const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/userModel');

const ROLE_ALIASES = {
    accounttant: 'accountant',
};

const normalizeRole = (role) => {
    const normalized = (role || '')
        .toString()
        .normalize('NFKC')
        .replace(/[\u200B-\u200D\uFEFF]/g, '')
        .trim()
        .toLowerCase();

    return ROLE_ALIASES[normalized] || normalized;
};

// 1. HÀM 'PROTECT'
// JWT: ném lỗi có name TokenExpiredError / JsonWebTokenError để errorMiddleware trả 401 + message rõ ràng.
const protect = asyncHandler(async (req, res, next) => {
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) {
        res.status(401);
        throw new Error('Not authorized, no token');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        res.status(401);
        throw new Error('Not authorized, no token');
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id).select('-password');

        if (!req.user) {
            res.status(401);
            throw new Error('User not found');
        }

        next();
    } catch (error) {
        res.status(401);
        if (error.name === 'TokenExpiredError') {
            const e = new Error('Token đã hết hạn');
            e.name = 'TokenExpiredError';
            throw e;
        }
        if (error.name === 'JsonWebTokenError') {
            const e = new Error('Token không hợp lệ');
            e.name = 'JsonWebTokenError';
            throw e;
        }
        throw new Error('Not authorized, token failed');
    }
});

// 2. HÀM 'AUTHORIZE' (Nâng cấp)
// Thay thế cho 'admin' và 'staff'
// Nó nhận vào một danh sách các vai trò được phép
// Ví dụ: authorize('hotel manager', 'receptionist')
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(403);
            throw new Error('User not authenticated');
        }

        const userRole = normalizeRole(req.user.role);
        const allowedRoles = roles.map((role) => normalizeRole(role));

        if (!allowedRoles.includes(userRole)) {
            res.status(403);
            throw new Error('Không có quyền truy cập tài nguyên này');
        }

        next();
    };
};

// 3. EXPORT MỚI
module.exports = {
    protect,
    authorize, // <-- Chúng ta sẽ dùng hàm này thay vì 'admin' và 'staff'
};