const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
    reportId: {
        type: String,
        required: true,
        unique: true,
        default: () => `REP_${Date.now()}`
    },
    reportType: {
        type: String,
        enum: ['revenue', 'occupancy', 'maintenance', 'guest'],
        required: true
    },
    reportName: { 
        type: String, 
        required: true 
    },
    startDate: { 
        type: Date, 
        required: true 
    },
    endDate: { 
        type: Date, 
        required: true 
    },
    generatedDate: { 
        type: Date, 
        default: Date.now 
    },
    data: { 
        type: mongoose.Schema.Types.Mixed 
    }, // JSON result
    generatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Report', reportSchema);