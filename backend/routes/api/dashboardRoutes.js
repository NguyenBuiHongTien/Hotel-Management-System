// routes/api/dashboardRoutes.js
const express = require('express');
const router = express.Router();
const {
    getRevenueDashboard
} = require('../../controllers/dashboardController');
const { protect, authorize } = require('../../middleware/authMiddleware');

// Manager only
router.use(protect, authorize('manager'));

router.get('/revenue', getRevenueDashboard);

module.exports = router;