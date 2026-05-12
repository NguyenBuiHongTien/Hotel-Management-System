const asyncHandler = require('express-async-handler');
const RoomType = require('../models/roomTypeModel');
const Room = require('../models/roomModel');
const { getCache, setCache, deleteCache } = require('../services/cacheService');

const ROOM_TYPES_CACHE_KEY = 'roomTypes:all';

/**
 * @desc    Create room type
 * @route   POST /api/room-types
 * @access  Private/Manager
 */
const createRoomType = asyncHandler(async (req, res) => {
  const { typeName, description, basePrice, capacity, amenities } = req.body;
  
  const typeExists = await RoomType.findOne({ typeName });
  if(typeExists) {
      res.status(400);
      throw new Error('A room type with this name already exists');
  }

  const type = await RoomType.create({
    typeName,
    description,
    basePrice,
    capacity,
    amenities
  });
  deleteCache(ROOM_TYPES_CACHE_KEY);
  res.status(201).json(type);
});

/**
 * @desc    List all room types
 * @route   GET /api/room-types
 * @access  Private/Manager
 */
const getAllRoomTypes = asyncHandler(async (req, res) => {
  const cacheKey = ROOM_TYPES_CACHE_KEY;

  const cached = getCache(cacheKey);
  if (cached) {
    return res.json(cached);
  }

  const roomTypes = await RoomType.find();

  setCache(cacheKey, roomTypes, 600);
  
  res.json(roomTypes);
});

/**
 * @desc    Get room type by ID
 * @route   GET /api/room-types/:id
 * @access  Private/Manager
 */
const getRoomTypeById = asyncHandler(async (req, res) => {
  const roomType = await RoomType.findById(req.params.id);
  if (!roomType) {
    res.status(404);
    throw new Error('Room type not found');
  }
  res.json(roomType);
});

/**
 * @desc    Update room type
 * @route   PUT /api/room-types/:id
 * @access  Private/Manager
 */
const updateRoomType = asyncHandler(async (req, res) => {
    const { typeName, description, basePrice, capacity, amenities } = req.body;

    const roomType = await RoomType.findByIdAndUpdate(req.params.id, {
        typeName,
        description,
        basePrice,
        capacity,
        amenities
    }, { new: true, runValidators: true });

    if (!roomType) {
        res.status(404);
        throw new Error('Room type not found');
    }
    deleteCache(ROOM_TYPES_CACHE_KEY);
    res.json(roomType);
});

/**
 * @desc    Delete room type
 * @route   DELETE /api/room-types/:id
 * @access  Private/Manager
 */
const deleteRoomType = asyncHandler(async (req, res) => {
  const roomType = await RoomType.findById(req.params.id);
  if (!roomType) {
    res.status(404);
    throw new Error('Room type not found');
  }
  
  const roomExists = await Room.findOne({ roomType: req.params.id });
  if (roomExists) {
    res.status(400);
    throw new Error('Cannot delete: this room type is in use.');
  }

  await RoomType.deleteOne({ _id: roomType._id });
  deleteCache(ROOM_TYPES_CACHE_KEY);
  res.json({ message: 'Room type deleted' });
});

module.exports = { 
  createRoomType, 
  getAllRoomTypes,
  getRoomTypeById,
  updateRoomType,
  deleteRoomType
};