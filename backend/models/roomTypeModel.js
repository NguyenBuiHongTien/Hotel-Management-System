const mongoose = require('mongoose');

const roomTypeSchema = new mongoose.Schema({
    roomTypeId: {
        type: String,
        required: true,
        unique: true,
        default: () => `RT_${Date.now()}${Math.random().toString(36).slice(2,8)}`
    },
    typeName: { 
        type: String, 
        required: true, 
        unique: true 
    }, // Single, Double, Suite...
    description: { 
        type: String 
    },
    basePrice: { 
        type: Number, 
        required: true, 
        min: 0 
    },
    capacity: { 
        type: Number, 
        required: true, 
        min: 1 
    },
    amenities: [{ 
        type: String 
    }] // ["wifi", "tv", "ac", "bathtub"]
}, { timestamps: true });

module.exports = mongoose.model('RoomType', roomTypeSchema);