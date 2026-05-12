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

router.post('/issues',
    authorize('housekeeper', 'receptionist', 'manager'),
    reportMaintenanceIssue
);

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

router.put('/:requestId/complete',
    authorize(...M_M),
    completeMaintenanceTask
);

module.exports = router;