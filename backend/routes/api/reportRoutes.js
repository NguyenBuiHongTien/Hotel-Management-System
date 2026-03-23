// routes/api/reportRoutes.js
const express = require('express');
const router = express.Router();
const {
    generateOccupancyReport,
    generateRevenueReport,
    listGeneratedReports,
    getGeneratedReportById,
    exportComprehensiveReport
} = require('../../controllers/reportController');
const { protect, authorize } = require('../../middleware/authMiddleware');

// Chỉ Quản lý và Kế toán
router.use(protect, authorize('manager', 'accountant'));

// Tạo báo cáo (Generate)
router.get('/occupancy', generateOccupancyReport);
router.get('/revenue', generateRevenueReport);
router.get('/comprehensive/export', exportComprehensiveReport);

// Xem báo cáo đã lưu (List/Get)
router.get('/', listGeneratedReports);
router.get('/:reportId', getGeneratedReportById);

module.exports = router;