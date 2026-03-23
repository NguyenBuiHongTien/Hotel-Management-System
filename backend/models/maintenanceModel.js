const mongoose = require('mongoose');
const Room = require('./roomModel'); // Import Room model để cập nhật trạng thái

const maintenanceSchema = new mongoose.Schema({
  room: {
    type: mongoose.Schema.ObjectId,
    ref: 'Room',
    required: [true, 'Một yêu cầu bảo trì phải gắn với một phòng cụ thể.'],
  },
  reportedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User', // Nhân viên (Housekeeping, Receptionist) báo cáo
    required: [true, 'Phải có người báo cáo sự cố.'],
  },
  assignedTo: {
    type: mongoose.Schema.ObjectId,
    ref: 'User', // Nhân viên bảo trì được gán
  },
  issueDescription: {
    type: String,
    trim: true,
    required: [true, 'Vui lòng mô tả sự cố.'],
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

// Populate thông tin phòng và người báo cáo
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

// Middleware: Khi một yêu cầu được tạo, cập nhật trạng thái phòng thành "maintenance"
maintenanceSchema.pre('save', async function (next) {
  if (!this.isNew) return next();
  
  // Cập nhật trạng thái phòng
  await Room.findByIdAndUpdate(this.room, { status: 'maintenance' });
  next();
});

const Maintenance = mongoose.model('Maintenance', maintenanceSchema);

module.exports = Maintenance;