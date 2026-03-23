const asyncHandler = require('express-async-handler');
const Maintenance = require('../models/maintenanceModel');
const Room = require('../models/roomModel');

/**
 * @desc    Báo cáo sự cố bảo trì
 * @route   POST /api/maintenance/issues
 * @access  Private (Housekeeping, Receptionist, Manager)
 */
const reportMaintenanceIssue = asyncHandler(async (req, res, next) => {
  const { roomId, description, priority } = req.body;

  const newRequest = await Maintenance.create({
    room: roomId,
    issueDescription: description, // Khớp với model
    priority,
    reportedBy: req.user._id,
  });
  
  // KHÔNG CẦN CẬP NHẬT TRẠNG THÁI PHÒNG
  // maintenanceModel có pre-save hook tự động làm việc này.
  
  res.status(201).json(newRequest);
});

/**
 * @desc    Lấy tất cả yêu cầu bảo trì
 * @route   GET /api/maintenance/requests
 * @access  Private (Maintenance, Manager)
 */
const getAllMaintenanceRequests = asyncHandler(async (req, res, next) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.roomId) filter.room = req.query.roomId;
  if (req.query.assignedToUserId) filter.assignedTo = req.query.assignedToUserId;

  const requests = await Maintenance.find(filter)
    .populate('room', 'roomNumber floor')
    .populate('reportedBy', 'name')
    .populate('assignedTo', 'name')
    .sort('-createdAt');

  res.status(200).json(requests);
});

/**
 * @desc    Lấy chi tiết 1 yêu cầu bảo trì
 * @route   GET /api/maintenance/requests/:requestId
 * @access  Private (Maintenance, Manager)
 */
const getMaintenanceRequestById = asyncHandler(async (req, res, next) => {
  const request = await Maintenance.findById(req.params.requestId);
  if (!request) {
    res.status(404);
    throw new Error('Không tìm thấy yêu cầu bảo trì');
  }
  res.json(request);
});

/**
 * @desc    Cập nhật yêu cầu bảo trì (gán việc, trạng thái)
 * @route   PUT /api/maintenance/:requestId
 * @access  Private (Maintenance, Manager)
 */
const updateMaintenanceRequest = asyncHandler(async (req, res, next) => {
  // Ưu tiên các trường trong model
  const { status, assignedTo } = req.body; 
  // 'progressNotes' không có trong model

  const updateData = {};
  if (status) updateData.status = status;
  if (assignedTo) updateData.assignedTo = assignedTo;
  
  const request = await Maintenance.findByIdAndUpdate(
    req.params.requestId,
    updateData,
    { new: true, runValidators: true }
  );

  if (!request) {
    res.status(404);
    throw new Error('Không tìm thấy yêu cầu bảo trì');
  }
  res.status(200).json(request);
});

/**
 * @desc    Hoàn thành tác vụ bảo trì
 * @route   PUT /api/maintenance/:requestId/complete
 * @access  Private (Maintenance, Manager)
 */
const completeMaintenanceTask = asyncHandler(async (req, res, next) => {
  const request = await Maintenance.findById(req.params.requestId);
  if (!request) {
    res.status(404);
    throw new Error('Không tìm thấy yêu cầu bảo trì');
  }

  request.status = 'completed';
  request.completedAt = Date.now();
  // 'completionNotes' không có trong model
  await request.save();

  // Cập nhật trạng thái phòng (Model không tự làm việc này khi complete)
  // Giả sử sửa xong cần dọn dẹp
  await Room.findByIdAndUpdate(request.room, { status: 'dirty' });

  res.status(200).json(request);
});

module.exports = {
  reportMaintenanceIssue,
  getAllMaintenanceRequests,
  getMaintenanceRequestById,
  updateMaintenanceRequest,
  completeMaintenanceTask,
};