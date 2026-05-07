// routes/api/guestRoutes.js
const { createGuestRules, updateGuestRules } = require('../../validators/guestValidators');
const { validate } = require('../../middleware/validationMiddleware');
const express = require('express');
const router = express.Router();
const {
    getAllGuests,
    getGuestById,
    createGuest,
    updateGuest,
    deleteGuest
} = require('../../controllers/guestController');
const { protect, authorize } = require('../../middleware/authMiddleware');

// Chỉ Lễ tân hoặc Quản lý
router.use(protect, authorize('receptionist', 'manager'));

router.route('/')
    .get(getAllGuests)
    .post(createGuestRules, validate, createGuest);

router.route('/:guestId') // Khớp với param 'guestId' trong Doc
    .get(getGuestById)
    .put(updateGuestRules, validate, updateGuest) // Đổi sang PUT
    .delete(authorize('manager'), deleteGuest);

module.exports = router;