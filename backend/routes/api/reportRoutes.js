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

// Previews (GET, no DB write)
router.get('/occupancy', getOccupancyReportPreview);
router.get('/revenue', getRevenueReportPreview);
router.get('/comprehensive/export', exportComprehensiveReport);

// Persisted reports (POST writes DB)
router.post('/occupancy/save', saveOccupancyReport);
router.post('/revenue/save', saveRevenueReport);

// List / detail saved reports
router.get('/', listGeneratedReports);
router.get('/:reportId', getGeneratedReportById);

module.exports = router;
