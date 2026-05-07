// routes/api/reportRoutes.js
const express = require('express');
const router = express.Router();
const {
  getOccupancyReportPreview,
  saveOccupancyReport,
  getRevenueReportPreview,
  saveRevenueReport,
  listGeneratedReports,
  getGeneratedReportById,
  exportComprehensiveReport,
} = require('../../controllers/reportController');
const { protect, authorize } = require('../../middleware/authMiddleware');

router.use(protect, authorize('manager', 'accountant'));

// Xem nhanh (GET — không ghi DB)
router.get('/occupancy', getOccupancyReportPreview);
router.get('/revenue', getRevenueReportPreview);
router.get('/comprehensive/export', exportComprehensiveReport);

// Lưu báo cáo (POST — có ghi DB)
router.post('/occupancy/save', saveOccupancyReport);
router.post('/revenue/save', saveRevenueReport);

// Danh sách / chi tiết báo cáo đã lưu
router.get('/', listGeneratedReports);
router.get('/:reportId', getGeneratedReportById);

module.exports = router;
