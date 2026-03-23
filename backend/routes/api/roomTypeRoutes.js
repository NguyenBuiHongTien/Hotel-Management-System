// routes/api/roomTypeRoutes.js
const express = require('express');
const router = express.Router();
const {
    createRoomType,
    getAllRoomTypes,
    getRoomTypeById,
    updateRoomType,
    deleteRoomType
} = require('../../controllers/roomTypeController');
const { protect, authorize } = require('../../middleware/authMiddleware');

router.route('/')
    .post(protect, authorize('manager'), createRoomType)
    .get(protect, authorize('manager', 'receptionist'), getAllRoomTypes); // Cho phép Lễ tân xem

router.route('/:id')
    .get(protect, authorize('manager', 'receptionist'), getRoomTypeById)
    .put(protect, authorize('manager'), updateRoomType)
    .delete(protect, authorize('manager'), deleteRoomType);

module.exports = router;