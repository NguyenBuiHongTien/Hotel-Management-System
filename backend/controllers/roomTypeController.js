const asyncHandler = require('express-async-handler');
const RoomType = require('../models/roomTypeModel');
const Room = require('../models/roomModel');
const { getCache, setCache, deleteCache } = require('../services/cacheService');

const ROOM_TYPES_CACHE_KEY = 'roomTypes:all';

/**
 * @desc    Tạo loại phòng mới
 * @route   POST /api/room-types
 * @access  Private/Manager
 */
const createRoomType = asyncHandler(async (req, res) => {
  const { typeName, description, basePrice, capacity, amenities } = req.body;
  
  const typeExists = await RoomType.findOne({ typeName });
  if(typeExists) {
      res.status(400);
      throw new Error('Loại phòng này đã tồn tại');
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
 * @desc    Lấy tất cả loại phòng
 * @route   GET /api/room-types
 * @access  Private/Manager
 */
const getAllRoomTypes = asyncHandler(async (req, res) => {
  const cacheKey = ROOM_TYPES_CACHE_KEY;
  
  // Kiểm tra cache
  const cached = getCache(cacheKey);
  if (cached) {
    return res.json(cached);
  }
  
  // Nếu không có cache, query database
  const roomTypes = await RoomType.find();
  
  // Lưu vào cache
  setCache(cacheKey, roomTypes, 600); // 10 phút
  
  res.json(roomTypes);
});

/**
 * @desc    Lấy chi tiết loại phòng
 * @route   GET /api/room-types/:id
 * @access  Private/Manager
 */
const getRoomTypeById = asyncHandler(async (req, res) => {
  const roomType = await RoomType.findById(req.params.id);
  if (!roomType) {
    res.status(404);
    throw new Error('Không tìm thấy loại phòng');
  }
  res.json(roomType);
});

/**
 * @desc    Cập nhật loại phòng
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
        throw new Error('Không tìm thấy loại phòng');
    }
    deleteCache(ROOM_TYPES_CACHE_KEY);
    res.json(roomType);
});

/**
 * @desc    Xóa loại phòng
 * @route   DELETE /api/room-types/:id
 * @access  Private/Manager
 */
const deleteRoomType = asyncHandler(async (req, res) => {
  const roomType = await RoomType.findById(req.params.id);
  if (!roomType) {
    res.status(404);
    throw new Error('Không tìm thấy loại phòng');
  }
  
  const roomExists = await Room.findOne({ roomType: req.params.id });
  if (roomExists) {
    res.status(400);
    throw new Error('Không thể xóa. Loại phòng đang được sử dụng.');
  }

  await RoomType.deleteOne({ _id: roomType._id });
  deleteCache(ROOM_TYPES_CACHE_KEY);
  res.json({ message: 'Đã xóa loại phòng' });
});

module.exports = { 
  createRoomType, 
  getAllRoomTypes,
  getRoomTypeById,
  updateRoomType,
  deleteRoomType
};