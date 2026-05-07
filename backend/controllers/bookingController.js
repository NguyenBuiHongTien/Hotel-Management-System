const asyncHandler = require('express-async-handler');
const Booking = require('../models/bookingModel');
const Room = require('../models/roomModel');
const Guest = require('../models/guestModel');
const RoomType = require('../models/roomTypeModel');
const { sendBookingConfirmation } = require('./notificationController');
const { startOfDay, endOfDay } = require('../utils/dateRange');

/**
 * @desc    Tạo booking mới
 * @route   POST /api/bookings
 * @access  Private (Receptionist, Manager)
 */
const createBooking = asyncHandler(async (req, res) => {
  const { 
    customerId, // ID của Guest nếu đã tồn tại
    guestInfo,  // Thông tin guest mới { fullName, phoneNumber, email }
    roomId, 
    checkInDate, 
    checkOutDate, 
    numberOfGuests
    // 'specialRequest' không có trong bookingModel
  } = req.body;

  let guest;
  // 1. Tìm hoặc tạo Guest
  if (customerId) {
    guest = await Guest.findById(customerId);
    if (!guest) {
      res.status(404); throw new Error('Không tìm thấy Guest ID');
    }
  } else if (guestInfo && guestInfo.fullName && guestInfo.phoneNumber) {
    const guestUpdate = {
      $setOnInsert: {
        fullName: guestInfo.fullName,
        phoneNumber: guestInfo.phoneNumber,
      },
    };
    if (guestInfo.email) guestUpdate.$set = { ...(guestUpdate.$set || {}), email: guestInfo.email };
    if (guestInfo.address) guestUpdate.$set = { ...(guestUpdate.$set || {}), address: guestInfo.address };
    if (guestInfo.fullName) guestUpdate.$set = { ...(guestUpdate.$set || {}), fullName: guestInfo.fullName };

    guest = await Guest.findOneAndUpdate(
      { phoneNumber: guestInfo.phoneNumber }, // Dùng SĐT làm key
      guestUpdate,
      { upsert: true, new: true, runValidators: true }
    );
  } else {
    res.status(400);
    throw new Error('Cần thông tin customerId hoặc guestInfo');
  }

  // 2. Kiểm tra phòng và lấy giá
  const room = await Room.findById(roomId);
  if (!room) {
    res.status(404); throw new Error('Không tìm thấy phòng');
  }
  const roomType = await RoomType.findById(room.roomType);
  if (!roomType) {
    res.status(404); throw new Error('Không tìm thấy loại phòng liên kết');
  }

  // 3. Kiểm tra xung đột lịch
  const conflict = await Booking.findOne({
    room: roomId,
    status: { $in: ['confirmed', 'checked_in'] },
    $or: [
      // Case 1: Check-in mới nằm trong khoảng booking cũ
      {
        checkInDate: { $lte: new Date(checkInDate) },
        checkOutDate: { $gt: new Date(checkInDate) }
      },
      // Case 2: Check-out mới nằm trong khoảng booking cũ
      {
        checkInDate: { $lt: new Date(checkOutDate) },
        checkOutDate: { $gte: new Date(checkOutDate) }
      },
      // Case 3: Booking mới bao trùm booking cũ
      {
        checkInDate: { $gte: new Date(checkInDate) },
        checkOutDate: { $lte: new Date(checkOutDate) }
      }
    ]
  });
  if (conflict) {
    res.status(400);
    throw new Error('Phòng đã được đặt trong khoảng ngày này');
  }

  // 4. Tính tiền (ưu tiên basePrice từ roomTypeModel)
  const nights = Math.ceil((new Date(checkOutDate) - new Date(checkInDate)) / (1000 * 60 * 60 * 24));
  if (nights <= 0) {
    res.status(400);
    throw new Error('Ngày check-out phải sau ngày check-in');
  }
  const totalPrice = roomType.basePrice * nights;

  // 5. Tạo booking
  const booking = await Booking.create({
    guest: guest._id,
    room: roomId,
    createdBy: req.user._id,
    checkInDate,
    checkOutDate,
    numberOfGuests: numberOfGuests || 1,
    totalPrice, // Tính toán từ logic
    status: 'confirmed' // Doc yêu cầu tạo là 'confirmed'
  });
  
  // (Không cần cập nhật trạng thái phòng ngay, vì phòng vẫn 'available' cho đến khi check-in)

  const populatedBooking = await booking.populate([
      { path: 'guest' },
      { path: 'room', populate: { path: 'roomType' } },
      { path: 'createdBy', select: 'name role' }
  ]);

  const emailResult = await sendBookingConfirmation(populatedBooking);
  res.status(201).json({
    ...populatedBooking.toObject(),
    email: emailResult,
  });
});

/**
 * @desc    Lấy tất cả booking (kèm filter)
 * @route   GET /api/bookings
 * @access  Private (Receptionist, Manager, Accountant)
 */
const getAllBookings = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.customerId) filter.guest = req.query.customerId;
  if (req.query.roomId) filter.room = req.query.roomId;
  if (req.query.fromDate) {
    filter.checkInDate = { ...filter.checkInDate, $gte: startOfDay(req.query.fromDate) };
  }
  if (req.query.toDate) {
    filter.checkOutDate = { ...filter.checkOutDate, $lte: endOfDay(req.query.toDate) };
  }

  // Pagination
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const bookings = await Booking.find(filter)
    .populate('guest', 'fullName phoneNumber')
    .populate('room', 'roomNumber')
    .populate('createdBy', 'name')
    .sort('-checkInDate')
    .skip(skip)
    .limit(limit);

  const total = await Booking.countDocuments(filter);

  res.json({
    bookings,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

/**
 * @desc    Lấy booking theo ID
 * @route   GET /api/bookings/:bookingId
 * @access  Private
 */
const getBookingById = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.bookingId)
    .populate('guest')
    .populate({ path: 'room', populate: { path: 'roomType' } })
    .populate('createdBy', 'name role');
  if (!booking) {
    res.status(404);
    throw new Error('Không tìm thấy booking');
  }
  res.json(booking);
});

/**
 * @desc    Cập nhật chi tiết booking
 * @route   PUT /api/bookings/:bookingId
 * @access  Private (Receptionist)
 */
const updateBooking = asyncHandler(async (req, res) => {
  const { roomId, checkInDate, checkOutDate, numberOfGuests } = req.body;
  const booking = await Booking.findById(req.params.bookingId);
  if (!booking) {
    res.status(404);
    throw new Error('Không tìm thấy booking');
  }

  const targetRoomId = roomId ? String(roomId) : String(booking.room);
  const targetCheckIn = checkInDate ? new Date(checkInDate) : booking.checkInDate;
  const targetCheckOut = checkOutDate ? new Date(checkOutDate) : booking.checkOutDate;

  const roomOrDatesChanged =
    targetRoomId !== String(booking.room) ||
    targetCheckIn.getTime() !== new Date(booking.checkInDate).getTime() ||
    targetCheckOut.getTime() !== new Date(booking.checkOutDate).getTime();

  if (roomOrDatesChanged) {
    if (booking.status === 'checked_in' || booking.status === 'checked_out') {
      res.status(400);
      throw new Error('Không thể đổi phòng hoặc ngày khi booking đã check-in hoặc check-out');
    }

    const nights = Math.ceil(
      (targetCheckOut - targetCheckIn) / (1000 * 60 * 60 * 24)
    );
    if (nights <= 0) {
      res.status(400);
      throw new Error('Ngày check-out phải sau ngày check-in');
    }

    const conflict = await Booking.findOne({
      _id: { $ne: booking._id },
      room: targetRoomId,
      status: { $in: ['confirmed', 'checked_in'] },
      $or: [
        {
          checkInDate: { $lte: targetCheckIn },
          checkOutDate: { $gt: targetCheckIn },
        },
        {
          checkInDate: { $lt: targetCheckOut },
          checkOutDate: { $gte: targetCheckOut },
        },
        {
          checkInDate: { $gte: targetCheckIn },
          checkOutDate: { $lte: targetCheckOut },
        },
      ],
    });
    if (conflict) {
      res.status(400);
      throw new Error('Phòng đã được đặt trong khoảng ngày này');
    }

    const room = await Room.findById(targetRoomId);
    if (!room) {
      res.status(404);
      throw new Error('Không tìm thấy phòng');
    }
    const roomType = await RoomType.findById(room.roomType);
    if (!roomType) {
      res.status(404);
      throw new Error('Không tìm thấy loại phòng liên kết');
    }

    booking.room = targetRoomId;
    booking.checkInDate = targetCheckIn;
    booking.checkOutDate = targetCheckOut;
    booking.totalPrice = roomType.basePrice * nights;
  }

  if (numberOfGuests !== undefined && numberOfGuests !== null) {
    booking.numberOfGuests = numberOfGuests;
  }

  const updated = await booking.save();
  const populated = await updated.populate([
    { path: 'guest' },
    { path: 'room', populate: { path: 'roomType' } },
    { path: 'createdBy', select: 'name role' },
  ]);
  res.json(populated);
});

/**
 * @desc    Hủy booking
 * @route   POST /api/bookings/:bookingId/cancel
 * @access  Private (Receptionist)
 */
const cancelBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.bookingId);
  if (!booking) {
    res.status(404);
    throw new Error('Không tìm thấy booking');
  }
  if (booking.status === 'checked_in' || booking.status === 'checked_out') {
    res.status(400);
    throw new Error('Không thể hủy booking đã check-in hoặc check-out');
  }

  booking.status = 'cancelled';
  // (Không cần cập nhật trạng thái phòng, vì nó chưa bao giờ bị set 'occupied')
  
  const updated = await booking.save();
  res.json(updated);
});

module.exports = {
  createBooking,
  getAllBookings,
  getBookingById,
  updateBooking,
  cancelBooking,
};