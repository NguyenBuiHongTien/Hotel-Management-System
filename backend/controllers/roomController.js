const asyncHandler = require('express-async-handler');
const Room = require('../models/roomModel');
const RoomType = require('../models/roomTypeModel');
const Booking = require('../models/bookingModel');
const Maintenance = require('../models/maintenanceModel');
const { buildBookingOverlapFilter } = require('../utils/bookingOverlap');

/**
 * @desc    List rooms (with filters)
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
 * @desc    Get room by ID
 * @route   GET /api/rooms/:roomId
 * @access  Public (All Staff)
 */
const getRoomById = asyncHandler(async (req, res) => {
  const room = await Room.findById(req.params.roomId)
    .populate('roomType');
  if (!room) {
    res.status(404);
    throw new Error('Room not found');
  }
  res.json(room);
});

/**
 * @desc    Create room
 * @route   POST /api/rooms
 * @access  Private/Manager
 */
const createRoom = asyncHandler(async (req, res) => {
  const roomNumber = String(req.body.roomNumber ?? '').trim();
  const roomTypeId = String(req.body.roomTypeId ?? '').trim();
  const floor = String(req.body.floor ?? '').trim();

  if (await Room.findOne({ roomNumber })) {
    res.status(400);
    throw new Error('Room number already exists');
  }
  if (!(await RoomType.findById(roomTypeId))) {
    res.status(400);
    throw new Error('Invalid room type ID');
  }

  const room = await Room.create({
    roomNumber,
    roomType: roomTypeId,
    floor,
    status: 'available',
  });
  const populated = await room.populate('roomType');
  res.status(201).json(populated);
});

/**
 * @desc    Update room details (manager)
 * @route   PUT /api/rooms/:roomId
 * @access  Private/Manager
 */
const updateRoomInfo = asyncHandler(async (req, res) => {
  const roomNumber =
    req.body.roomNumber !== undefined ? String(req.body.roomNumber).trim() : undefined;
  const roomTypeId =
    req.body.roomTypeId !== undefined ? String(req.body.roomTypeId).trim() : undefined;
  const floor = req.body.floor !== undefined ? String(req.body.floor).trim() : undefined;
  const room = await Room.findById(req.params.roomId);
  if (!room) {
    res.status(404);
    throw new Error('Room not found');
  }

  if (roomNumber !== undefined && roomNumber !== room.roomNumber) {
    if (await Room.findOne({ roomNumber })) {
      res.status(400);
      throw new Error('Room number already exists');
    }
    room.roomNumber = roomNumber;
  }
  if (roomTypeId !== undefined && roomTypeId !== '') {
    if (!(await RoomType.findById(roomTypeId))) {
      res.status(400);
      throw new Error('Invalid room type ID');
    }
    room.roomType = roomTypeId;
  }
  if (floor !== undefined) room.floor = floor;

  const updated = await room.save();
  const populated = await updated.populate('roomType');
  res.json(populated);
});

/**
 * @desc    Delete room (manager)
 * @route   DELETE /api/rooms/:roomId
 * @access  Private/Manager
 */
const deleteRoom = asyncHandler(async (req, res) => {
  const room = await Room.findById(req.params.roomId);
  if (!room) {
    res.status(404);
    throw new Error('Room not found');
  }

  const bookingExists = await Booking.findOne({ room: room._id });
  if (bookingExists) {
    res.status(400);
    throw new Error('Cannot delete a room that has bookings in the system');
  }

  const maintenanceExists = await Maintenance.findOne({ room: room._id });
  if (maintenanceExists) {
    res.status(400);
    throw new Error('Cannot delete a room that has maintenance requests');
  }

  await Room.deleteOne({ _id: room._id });
  res.json({ message: 'Room deleted successfully' });
});

/**
 * @desc    Update room status (staff)
 * @route   PUT /api/rooms/:roomId/status
 * @access  Private (Receptionist, Housekeeper, Maintenance) — not manager for operational status
 */
const updateRoomStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['available', 'occupied', 'dirty', 'cleaning', 'maintenance'];
  if (!status || !validStatuses.includes(status)) {
    res.status(400);
    throw new Error('Invalid status');
  }

  const room = await Room.findById(req.params.roomId).populate('roomType');

  if (!room) {
    res.status(404);
    throw new Error('Room not found');
  }

  const role = (req.user?.role || '').toString().trim().toLowerCase();
  const allowedForOps = ['dirty', 'cleaning', 'maintenance'];

  if (status === 'occupied') {
    res.status(403);
    throw new Error('Occupied status can only be set via the check-in flow');
  }

  if (status === 'available' && role !== 'housekeeper') {
    res.status(403);
    throw new Error('Only housekeeping can set a room to available');
  }

  if (status !== 'available' && !allowedForOps.includes(status)) {
    res.status(403);
    throw new Error('You may only set operational statuses: dirty, cleaning, maintenance');
  }

  room.status = status;
  await room.save();
  res.json(room);
});

/**
 * @desc    Search available rooms
 * @route   GET /api/rooms/available
 * @access  Private (Receptionist)
 */
const searchAvailableRooms = asyncHandler(async (req, res) => {
  const { checkInDate, checkOutDate, roomTypeId, capacity,  excludeBookingId } = req.query;

  if (!checkInDate || !checkOutDate) {
    res.status(400);
    throw new Error('Check-in and check-out dates are required');
  }
  const checkIn = new Date(checkInDate);
  const checkOut = new Date(checkOutDate);
  if (Number.isNaN(checkIn.getTime()) || Number.isNaN(checkOut.getTime())) {
    res.status(400);
    throw new Error('Invalid check-in or check-out date');
  }
  if (checkOut <= checkIn) {
    res.status(400);
    throw new Error('Check-out must be after check-in');
  }

  const conflictFilter = buildBookingOverlapFilter({
    checkInDate: checkIn,
    checkOutDate: checkOut,
    excludeBookingId,
  });
  const conflicts = await Booking.find(conflictFilter).select('room');
  const bookedRoomIds = conflicts.map((b) => b.room);

  const roomFilter = {
    _id: { $nin: bookedRoomIds },
    status: { $in: ['available', 'dirty', 'cleaning'] },
  };
  if (roomTypeId) roomFilter.roomType = roomTypeId;

  let availableRooms = await Room.find(roomFilter).populate('roomType');

  if (capacity) {
    availableRooms = availableRooms.filter(
      room => room.roomType && room.roomType.capacity >= Number(capacity)
    );
  }
  res.json(availableRooms);
});

/**
 * @desc    Rooms needing cleaning
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
 * @desc    Rooms under maintenance
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
  deleteRoom,
  updateRoomStatus,
  searchAvailableRooms,
  getCleaningRooms,
  getMaintenanceRooms,
};
