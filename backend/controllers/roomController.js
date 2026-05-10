const asyncHandler = require('express-async-handler');
const Room = require('../models/roomModel');
const RoomType = require('../models/roomTypeModel');
const Booking = require('../models/bookingModel');
const { buildBookingOverlapFilter } = require('../utils/bookingOverlap');

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
 * @access  Private (Receptionist, Housekeeper, Maintenance) — không Quản lý (đổi trạng thái vận hành)
 */
const updateRoomStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['available', 'occupied', 'dirty', 'cleaning', 'maintenance'];
  if (!status || !validStatuses.includes(status)) {
    res.status(400);
    throw new Error('Trạng thái không hợp lệ');
  }
  
  const room = await Room.findById(req.params.roomId).populate('roomType');

  if (!room) {
    res.status(404);
    throw new Error('Không tìm thấy phòng');
  }

  const role = (req.user?.role || '').toString().trim().toLowerCase();
  const allowedForOps = ['dirty', 'cleaning', 'maintenance'];

  // occupied chỉ được set qua luồng check-in để đồng bộ với booking.
  if (status === 'occupied') {
    res.status(403);
    throw new Error('Trạng thái occupied chỉ được cập nhật qua nghiệp vụ check-in');
  }

  // available chỉ nên được housekeeping xác nhận sau khi hoàn tất dọn phòng.
  if (status === 'available' && role !== 'housekeeper') {
    res.status(403);
    throw new Error('Chỉ bộ phận buồng phòng mới có thể chuyển phòng sang trạng thái available');
  }

  if (status !== 'available' && !allowedForOps.includes(status)) {
    res.status(403);
    throw new Error('Chỉ được cập nhật các trạng thái vận hành: dirty, cleaning, maintenance');
  }

  room.status = status;
  await room.save();
  res.json(room);
});

/**
 * @desc    Tìm phòng trống
 * @route   GET /api/rooms/available
 * @access  Private (Receptionist)
 */
const searchAvailableRooms = asyncHandler(async (req, res) => {
  const { checkInDate, checkOutDate, roomTypeId, capacity,  excludeBookingId } = req.query;

  if (!checkInDate || !checkOutDate) {
    res.status(400);
    throw new Error('Ngày check-in và check-out là bắt buộc');
  }
  const checkIn = new Date(checkInDate);
  const checkOut = new Date(checkOutDate);
  if (Number.isNaN(checkIn.getTime()) || Number.isNaN(checkOut.getTime())) {
    res.status(400);
    throw new Error('Ngày check-in/check-out không hợp lệ');
  }
  if (checkOut <= checkIn) {
    res.status(400);
    throw new Error('Ngày check-out phải sau ngày check-in');
  }

  // 1. Booking trùng khoảng ngày (cùng công thức với create/update booking)
  const conflictFilter = buildBookingOverlapFilter({
    checkInDate: checkIn,
    checkOutDate: checkOut,
    excludeBookingId,
  });
  const conflicts = await Booking.find(conflictFilter).select('room');
  const bookedRoomIds = conflicts.map((b) => b.room);

  // 2. Xây dựng bộ lọc cho Room — phòng có thể đặt trước nếu sẵn sàng hoặc đang/ sẽ dọn (không maintenance/occupied)
  const roomFilter = {
    _id: { $nin: bookedRoomIds },
    status: { $in: ['available', 'dirty', 'cleaning'] },
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