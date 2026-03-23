// routes/api/maintenanceRoutes.js
const express = require('express');
const router = express.Router();
const {
    reportMaintenanceIssue,
    getAllMaintenanceRequests,
    getMaintenanceRequestById,
    updateMaintenanceRequest,
    completeMaintenanceTask
} = require('../../controllers/maintenanceController');
const { protect, authorize } = require('../../middleware/authMiddleware');

router.use(protect);

// Buồng phòng, Lễ tân, Quản lý có thể báo cáo
router.post('/issues',
    authorize('housekeeper', 'receptionist', 'manager'),
    reportMaintenanceIssue
);

// Chỉ Bảo trì và Quản lý xem và xử lý
const M_M = ['maintenance', 'manager'];

router.get('/requests',
    authorize(...M_M),
    getAllMaintenanceRequests
);

router.get('/requests/:requestId',
    authorize(...M_M),
    getMaintenanceRequestById
);

router.put('/:requestId',
    authorize(...M_M),
    updateMaintenanceRequest
);

router.put('/:requestId/complete', // Đổi sang PUT cho nhất quán
    authorize(...M_M),
    completeMaintenanceTask
);

module.exports = router;