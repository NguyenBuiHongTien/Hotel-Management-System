// models/roomModel.js
const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
    roomNumber: { 
        type: String, 
        required: true, 
        unique: true 
    },
    floor: { 
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['available', 'occupied', 'dirty', 'cleaning', 'maintenance'],
        default: 'available'
    },
    roomType: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'RoomType',
        required: true
    },
    bookingVersion: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

roomSchema.index({ status: 1 });
roomSchema.index({ roomType: 1 });

module.exports = mongoose.model('Room', roomSchema);