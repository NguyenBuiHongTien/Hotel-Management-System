const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/userModel');

// 1. HÀM 'PROTECT' (Giữ nguyên - Vẫn hoàn hảo)
// Bảo vệ route, kiểm tra user đã đăng nhập chưa
const protect = asyncHandler(async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select('-password');
            
            if (!req.user) {
                console.error('[PROTECT] User not found in database');
                res.status(401);
                return res.json({ message: 'User not found' });
            }
            
            console.log(`[PROTECT] User authenticated: ${req.user.email}, Role: ${req.user.role}`);
            next();
        } catch (error) {
            console.error('[PROTECT] Token verification failed:', error.message);
            res.status(401);
            return res.json({ message: 'Not authorized, token failed' });
        }
    } else {
        console.error('[PROTECT] No token provided');
        res.status(401);
        return res.json({ message: 'Not authorized, no token' });
    }
});

// 2. HÀM 'AUTHORIZE' (Nâng cấp)
// Thay thế cho 'admin' và 'staff'
// Nó nhận vào một danh sách các vai trò được phép
// Ví dụ: authorize('hotel manager', 'receptionist')
const authorize = (...roles) => {
    return (req, res, next) => {
        // req.user được gán từ middleware 'protect'
        if (!req.user) {
            console.error('[AUTHORIZE] req.user is missing');
            res.status(403);
            return res.json({ message: 'User not authenticated' });
        }
        
        // Normalize user role (trim và lowercase để đảm bảo so sánh chính xác)
        const userRole = (req.user.role || '').toString().trim().toLowerCase();
        const allowedRoles = roles.map(r => (r || '').toString().trim().toLowerCase());
        
        // Debug logging với thông tin chi tiết
        console.log(`[AUTHORIZE] User: ${req.user.email}`);
        console.log(`[AUTHORIZE] User role (normalized): '${userRole}'`);
        console.log(`[AUTHORIZE] User role (raw): '${req.user.role}'`);
        console.log(`[AUTHORIZE] Allowed roles (normalized): [${allowedRoles.join(', ')}]`);
        console.log(`[AUTHORIZE] Allowed roles (raw): [${roles.join(', ')}]`);
        
        if (!allowedRoles.includes(userRole)) {
            console.error(`[AUTHORIZE] Access denied: User role '${userRole}' (raw: '${req.user.role}') not in allowed roles [${allowedRoles.join(', ')}] (raw: [${roles.join(', ')}])`);
            res.status(403); // 403 Forbidden
            return res.json({ 
                message: `User role '${req.user.role}' is not authorized to access this resource`,
                error: `User role '${req.user.role}' is not authorized to access this resource`
            });
        }
        // Nếu role hợp lệ, cho đi tiếp
        console.log(`[AUTHORIZE] ✅ Access granted for role: ${userRole} (raw: ${req.user.role})`);
        next();
    };
};

// 3. EXPORT MỚI
module.exports = {
    protect,
    authorize, // <-- Chúng ta sẽ dùng hàm này thay vì 'admin' và 'staff'
};