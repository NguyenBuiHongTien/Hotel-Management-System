// routes/api/paymentRoutes.js
const express = require('express');
const router = express.Router();
const {
    recordPayment,
    getTransactionHistory
} = require('../../controllers/paymentController');
const { protect, authorize } = require('../../middleware/authMiddleware');

// Test endpoint để debug user role
router.get('/test-user', protect, (req, res) => {
    const userRole = (req.user.role || '').toString().trim().toLowerCase();
    const isAccountant = userRole === 'accountant';
    
    console.log('[TEST_USER] Request from:', req.user.email);
    console.log('[TEST_USER] Role raw:', req.user.role);
    console.log('[TEST_USER] Role normalized:', userRole);
    console.log('[TEST_USER] Is accountant:', isAccountant);
    
    res.json({
        user: {
            _id: req.user._id,
            email: req.user.email,
            name: req.user.name,
            role: req.user.role,
            roleType: typeof req.user.role,
            roleLength: req.user.role?.length,
            roleNormalized: userRole,
            roleEqualsAccountant: req.user.role === 'accountant',
            roleLowercaseEquals: isAccountant,
            canAccessTransactions: isAccountant || userRole === 'manager'
        }
    });
});

// Test endpoint để kiểm tra authorize middleware
router.get('/test-transactions-auth', protect, authorize('accountant', 'manager'), (req, res) => {
    res.json({
        success: true,
        message: 'Authorization passed!',
        user: {
            email: req.user.email,
            role: req.user.role
        }
    });
});

// Ghi nhận thanh toán (Lễ tân, Kế toán)
router.post('/payments',
    protect,
    authorize('receptionist', 'accountant'),
    recordPayment
);

// Xem giao dịch (Kế toán, Quản lý)
router.get('/transactions',
    protect,
    (req, res, next) => {
        console.log('[TRANSACTIONS_ROUTE] Middleware check - User:', req.user?.email, 'Role:', req.user?.role);
        console.log('[TRANSACTIONS_ROUTE] Role type:', typeof req.user?.role);
        console.log('[TRANSACTIONS_ROUTE] Role normalized:', (req.user?.role || '').toString().trim().toLowerCase());
        next();
    },
    authorize('accountant', 'manager'),
    getTransactionHistory
);

module.exports = router;