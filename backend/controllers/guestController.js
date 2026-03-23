const asyncHandler = require('express-async-handler');
const Guest = require('../models/guestModel');

/**
 * @desc    Lấy danh sách khách
 * @route   GET /api/guests
 * @access  Private (Receptionist, Manager)
 */
const getAllGuests = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.name) {
    filter.fullName = { $regex: req.query.name, $options: 'i' };
  }
  if (req.query.phoneNumber) {
    // Sửa: Tìm kiếm chính xác hoặc regex tùy logic
    filter.phoneNumber = req.query.phoneNumber;
  }
  
  const guests = await Guest.find(filter);
  res.status(200).json(guests);
});

/**
 * @desc    Lấy chi tiết khách
 * @route   GET /api/guests/:guestId
 * @access  Private (Receptionist, Manager)
 */
const getGuestById = asyncHandler(async (req, res) => {
  const guest = await Guest.findById(req.params.guestId);
  if (!guest) {
    res.status(404);
    throw new Error('Không tìm thấy khách');
  }
  res.status(200).json(guest);
});

/**
 * @desc    Tạo hồ sơ khách mới
 * @route   POST /api/guests
 * @access  Private (Receptionist)
 */
const createGuest = asyncHandler(async (req, res) => {
  const { fullName, phoneNumber, email, address } = req.body; // Khớp với guestModel

  if (!fullName || !phoneNumber) {
    res.status(400);
    throw new Error('Họ tên và Số điện thoại là bắt buộc');
  }

  const guestExists = await Guest.findOne({ phoneNumber });
  if (guestExists) {
      res.status(400);
      throw new Error('Khách đã tồn tại với SĐT này');
  }

  const newGuest = await Guest.create({
    fullName,
    phoneNumber,
    email,
    address
  });

  res.status(201).json(newGuest);
});

/**
 * @desc    Cập nhật thông tin khách (PUT - Thay thế)
 * @route   PUT /api/guests/:guestId
 * @access  Private (Receptionist)
 */
const updateGuest = asyncHandler(async (req, res) => {
  const guest = await Guest.findById(req.params.guestId);
  if (!guest) {
    res.status(404);
    throw new Error('Không tìm thấy khách');
  }

  const { fullName, phoneNumber, email, address } = req.body;

  // Logic PUT: Yêu cầu các trường chính
  if (!fullName || !phoneNumber) {
    res.status(400);
    throw new Error('Họ tên và SĐT là bắt buộc (PUT)');
  }
  
  // Thực hiện thay thế
  guest.fullName = fullName;
  guest.phoneNumber = phoneNumber;
  guest.email = email; // Sẽ là undefined nếu không được gửi
  guest.address = address; // Sẽ là undefined nếu không được gửi

  const updatedGuest = await guest.save();
  res.status(200).json(updatedGuest);
});

module.exports = {
  getAllGuests,
  getGuestById, // Sửa tên hàm
  createGuest,
  updateGuest,
};