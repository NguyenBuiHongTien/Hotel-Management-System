// routes/api/roomRoutes.js

const { createRoomRules, updateRoomRules, updateRoomStatusRules } = require('../../validators/roomValidators');
const { validate } = require('../../middleware/validationMiddleware');


const express = require('express');
const router = express.Router();
const {
    getAllRooms,
    getRoomById,
    createRoom,
    updateRoomInfo,
    deleteRoom,
    updateRoomStatus,
    searchAvailableRooms,
    getCleaningRooms,
    getMaintenanceRooms
} = require('../../controllers/roomController');
const { getRealtimeRoomStatus } = require('../../controllers/dashboardController');
const { protect, authorize } = require('../../middleware/authMiddleware');

router.get('/', protect, getAllRooms);

// Static routes MUST come before dynamic routes
router.get('/available', protect, authorize('receptionist'), searchAvailableRooms);

router.get('/cleaning', protect, authorize('housekeeper'), getCleaningRooms);

router.get('/maintenance', protect, authorize('maintenance', 'receptionist'), getMaintenanceRooms);

router.get('/status/realtime', protect, authorize('receptionist', 'manager'), getRealtimeRoomStatus);

// Dynamic route must come after all static routes
router.get('/:roomId', protect, getRoomById);

router.put('/:roomId/status', protect, authorize('receptionist', 'housekeeper', 'maintenance'), updateRoomStatusRules, validate, updateRoomStatus);

router.post('/', protect, authorize('manager'), createRoomRules, validate, createRoom);
router.put('/:roomId', protect, authorize('manager'), updateRoomRules, validate, updateRoomInfo);
router.delete('/:roomId', protect, authorize('manager'), deleteRoom);

module.exports = router;