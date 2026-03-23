const asyncHandler = require('express-async-handler');
const Room = require('../models/roomModel');
const RoomType = require('../models/roomTypeModel');
const Booking = require('../models/bookingModel');

/**
 * @desc    Lấy danh sách phòng (kèm filter)
 * @route   GET /api/rooms
 * @access  Public (All Staff)
 */
const getAllRooms = asyncHandler(async (req, res) => {
  const { status, roomTypeId, floor } = req.query;
  const filter = {};

  if (status) filter.status = status;
  if (roomTypeId) filter.roomType = roomTypeId;
  if (floor) filter.floor = floor;

  const rooms = await Room.find(filter)
    .populate('roomType', 'typeName basePrice capacity')
    .sort('roomNumber');
  res.json(rooms);
});

/**
 * @desc    Lấy chi tiết phòng
 * @route   GET /api/rooms/:roomId
 * @access  Public (All Staff)
 */
const getRoomById = asyncHandler(async (req, res) => {
  const room = await Room.findById(req.params.roomId)
    .populate('roomType');
  if (!room) {
    res.status(404);
    throw new Error('Không tìm thấy phòng');
  }
  res.json(room);
});

/**
 * @desc    Tạo phòng mới
 * @route   POST /api/rooms
 * @access  Private/Manager
 */
const createRoom = asyncHandler(async (req, res) => {
  const { roomNumber, roomTypeId, floor, status } = req.body;

  if (await Room.findOne({ roomNumber })) {
    res.status(400);
    throw new Error('Số phòng đã tồn tại');
  }
  if (!(await RoomType.findById(roomTypeId))) {
    res.status(400);
    throw new Error('RoomType ID không hợp lệ');
  }

  const room = await Room.create({
    roomNumber,
    roomType: roomTypeId,
    floor,
    status: status || 'available'
  });
  const populated = await room.populate('roomType');
  res.status(201).json(populated);
});

/**
 * @desc    Cập nhật thông tin phòng (Quản lý)
 * @route   PUT /api/rooms/:roomId
 * @access  Private/Manager
 */
const updateRoomInfo = asyncHandler(async (req, res) => {
  const { roomNumber, roomTypeId, floor } = req.body;
  const room = await Room.findById(req.params.roomId);
  if (!room) {
    res.status(404);
    throw new Error('Không tìm thấy phòng');
  }

  // Check roomNumber conflict if changed
  if (roomNumber && roomNumber !== room.roomNumber) {
    if (await Room.findOne({ roomNumber })) {
      res.status(400);
      throw new Error('Số phòng đã tồn tại');
    }
    room.roomNumber = roomNumber;
  }
  // Check RoomType if changed
  if (roomTypeId) {
    if (!(await RoomType.findById(roomTypeId))) {
      res.status(400);
      throw new Error('RoomType ID không hợp lệ');
    }
    room.roomType = roomTypeId;
  }
  if (floor !== undefined) room.floor = floor;

  const updated = await room.save();
  const populated = await updated.populate('roomType');
  res.json(populated);
});

/**
 * @desc    Cập nhật TRẠNG THÁI phòng (Nhân viên)
 * @route   PUT /api/rooms/:roomId/status
 * @access  Private (Receptionist, Housekeeping, Maintenance)
 */
const updateRoomStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['available', 'occupied', 'dirty', 'cleaning', 'maintenance'];
  if (!status || !validStatuses.includes(status)) {
    res.status(400);
    throw new Error('Trạng thái không hợp lệ');
  }
  
  const room = await Room.findByIdAndUpdate(
    req.params.roomId, 
    { status: status },
    { new: true, runValidators: true }
  ).populate('roomType');

  if (!room) {
    res.status(404);
    throw new Error('Không tìm thấy phòng');
  }
  res.json(room);
});

/**
 * @desc    Tìm phòng trống
 * @route   GET /api/rooms/available
 * @access  Private (Receptionist)
 */
const searchAvailableRooms = asyncHandler(async (req, res) => {
  const { checkInDate, checkOutDate, roomTypeId, capacity } = req.query;

  if (!checkInDate || !checkOutDate) {
    res.status(400);
    throw new Error('Ngày check-in và check-out là bắt buộc');
  }
  const checkIn = new Date(checkInDate);
  const checkOut = new Date(checkOutDate);

  // 1. Tìm các phòng đã bị đặt trong khoảng ngày đó
  const conflicts = await Booking.find({
    status: { $in: ['confirmed', 'checked_in'] },
    $or: [
      { checkInDate: { $lt: checkOut }, checkOutDate: { $gt: checkIn } }
    ]
  }).select('room');
  const bookedRoomIds = conflicts.map(b => b.room);

  // 2. Xây dựng bộ lọc cho Room
  const roomFilter = {
    _id: { $nin: bookedRoomIds },
    // Chỉ tìm phòng đang 'available' HOẶC 'dirty' (nếu có thể dọn kịp)
    // Để đơn giản, ta chỉ tìm 'available'
    status: 'available' 
  };
  if (roomTypeId) roomFilter.roomType = roomTypeId;

  // 3. Tìm phòng và populate roomType để lọc capacity
  let availableRooms = await Room.find(roomFilter).populate('roomType');
  
  if (capacity) {
    availableRooms = availableRooms.filter(
      room => room.roomType && room.roomType.capacity >= Number(capacity)
    );
  }
  res.json(availableRooms);
});

/**
 * @desc    Lấy danh sách phòng cần dọn
 * @route   GET /api/rooms/cleaning
 * @access  Private (Housekeeping)
 */
const getCleaningRooms = asyncHandler(async (req, res) => {
  const rooms = await Room.find({ status: 'dirty' })
    .populate('roomType', 'typeName')
    .sort('floor roomNumber');
  res.json(rooms);
});

/**
 * @desc    Lấy danh sách phòng đang bảo trì
 * @route   GET /api/rooms/maintenance
 * @access  Private (Maintenance, Receptionist)
 */
const getMaintenanceRooms = asyncHandler(async (req, res) => {
  const rooms = await Room.find({ status: 'maintenance' })
    .populate('roomType', 'typeName')
    .sort('floor roomNumber');
  res.json(rooms);
});

module.exports = {
  getAllRooms,
  getRoomById,
  createRoom,
  updateRoomInfo,
  updateRoomStatus,
  searchAvailableRooms,
  getCleaningRooms,
  getMaintenanceRooms,
};