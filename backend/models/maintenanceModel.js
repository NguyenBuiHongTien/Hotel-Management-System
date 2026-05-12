const mongoose = require('mongoose');
const Room = require('./roomModel');

const maintenanceSchema = new mongoose.Schema({
  room: {
    type: mongoose.Schema.ObjectId,
    ref: 'Room',
    required: [true, 'A maintenance request must be linked to a specific room.'],
  },
  reportedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Reporter is required.'],
  },
  assignedTo: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  },
  issueDescription: {
    type: String,
    trim: true,
    required: [true, 'Please describe the issue.'],
  },
  status: {
    type: String,
    enum: ['reported', 'in_progress', 'completed', 'cancelled'],
    default: 'reported',
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  completedAt: {
    type: Date,
  },
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Populate room and reporter
maintenanceSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'room',
    select: 'roomNumber roomType'
  }).populate({
    path: 'reportedBy',
    select: 'name email'
  });
  next();
});

// On create, set room status to maintenance
maintenanceSchema.pre('save', async function (next) {
  if (!this.isNew) return next();

  await Room.findByIdAndUpdate(this.room, { status: 'maintenance' });
  next();
});

const Maintenance = mongoose.model('Maintenance', maintenanceSchema);

module.exports = Maintenance;