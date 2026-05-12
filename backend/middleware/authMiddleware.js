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

// 1. PROTECT — JWT errors use TokenExpiredError / JsonWebTokenError so errorMiddleware returns clear 401 messages.
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
            const e = new Error('Token has expired');
            e.name = 'TokenExpiredError';
            throw e;
        }
        if (error.name === 'JsonWebTokenError') {
            const e = new Error('Invalid token');
            e.name = 'JsonWebTokenError';
            throw e;
        }
        throw new Error('Not authorized, token failed');
    }
});

// 2. AUTHORIZE — allow only listed roles (e.g. authorize('manager', 'receptionist')).
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
            throw new Error('You do not have permission to access this resource');
        }

        next();
    };
};

module.exports = {
    protect,
    authorize,
};