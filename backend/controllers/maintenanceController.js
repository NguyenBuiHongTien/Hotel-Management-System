const asyncHandler = require('express-async-handler');
const Maintenance = require('../models/maintenanceModel');
const Room = require('../models/roomModel');

/**
 * @desc    Report a maintenance issue
 * @route   POST /api/maintenance/issues
 * @access  Private (Housekeeping, Receptionist, Manager)
 */
const reportMaintenanceIssue = asyncHandler(async (req, res, next) => {
  const { roomId, description, priority } = req.body;

  if (!roomId) {
    res.status(400);
    throw new Error('roomId is required');
  }
  const roomExists = await Room.findById(roomId).select('_id');
  if (!roomExists) {
    res.status(404);
    throw new Error('Room not found');
  }

  const newRequest = await Maintenance.create({
    room: roomId,
    issueDescription: description,
    priority,
    reportedBy: req.user._id,
  });

  res.status(201).json(newRequest);
});

/**
 * @desc    List maintenance requests
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
 * @desc    Get maintenance request by ID
 * @route   GET /api/maintenance/requests/:requestId
 * @access  Private (Maintenance, Manager)
 */
const getMaintenanceRequestById = asyncHandler(async (req, res, next) => {
  const request = await Maintenance.findById(req.params.requestId);
  if (!request) {
    res.status(404);
    throw new Error('Maintenance request not found');
  }
  res.json(request);
});

/**
 * @desc    Update maintenance request (assign, status)
 * @route   PUT /api/maintenance/:requestId
 * @access  Private (Maintenance, Manager)
 */
const updateMaintenanceRequest = asyncHandler(async (req, res, next) => {
  const { status, assignedTo } = req.body;

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
    throw new Error('Maintenance request not found');
  }
  res.status(200).json(request);
});

/**
 * @desc    Complete maintenance task
 * @route   PUT /api/maintenance/:requestId/complete
 * @access  Private (Maintenance, Manager)
 */
const completeMaintenanceTask = asyncHandler(async (req, res, next) => {
  const request = await Maintenance.findById(req.params.requestId);
  if (!request) {
    res.status(404);
    throw new Error('Maintenance request not found');
  }

  request.status = 'completed';
  request.completedAt = Date.now();
  await request.save();

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
