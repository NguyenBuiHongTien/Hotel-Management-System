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
    updateRoomStatus,
    searchAvailableRooms,
    getCleaningRooms,
    getMaintenanceRooms
} = require('../../controllers/roomController');
// Lấy hàm từ dashboardController
const { getRealtimeRoomStatus } = require('../../controllers/dashboardController');
const { protect, authorize } = require('../../middleware/authMiddleware');

// Routes công khai (hoặc cho mọi nhân viên đã đăng nhập)
router.get('/', protect, getAllRooms);

// Static routes MUST come before dynamic routes
// Routes cho Lễ tân
router.get('/available', protect, authorize('receptionist'), searchAvailableRooms);

// Routes cho Buồng phòng
router.get('/cleaning', protect, authorize('housekeeper'), getCleaningRooms);

// Routes cho Bảo trì
router.get('/maintenance', protect, authorize('maintenance', 'receptionist'), getMaintenanceRooms);

// Routes cho Dashboard (Lễ tân, Quản lý)
router.get('/status/realtime', protect, authorize('receptionist', 'manager'), getRealtimeRoomStatus);

// Dynamic route must come after all static routes
router.get('/:roomId', protect, getRoomById);

// Route cập nhật trạng thái (Nhiều vai trò)
router.put('/:roomId/status', protect, authorize('manager', 'receptionist', 'housekeeper', 'maintenance'), updateRoomStatusRules, validate, updateRoomStatus);

// Routes chỉ cho Quản lý
router.post('/', protect, authorize('manager'), createRoomRules, validate, createRoom);
router.put('/:roomId', protect, authorize('manager'), updateRoomRules, validate, updateRoomInfo); // Cập nhật thông tin

module.exports = router;