const asyncHandler = require('express-async-handler');
const Room = require('../models/roomModel');
const Invoice = require('../models/invoiceModel');

/**
 * @desc    Lấy số liệu doanh thu (nhanh) cho dashboard
 * @route   GET /api/dashboard/revenue
 * @access  Private (Manager)
 */
const getRevenueDashboard = asyncHandler(async (req, res, next) => {
    const { fromDate, toDate } = req.query; // (Tùy chọn)
    
    const matchFilter = { paymentStatus: 'paid' };
    if (fromDate && toDate) {
        matchFilter.updatedAt = { $gte: new Date(fromDate), $lte: new Date(toDate) };
    }

    const revenueAgg = await Invoice.aggregate([
        { $match: matchFilter },
        {
            $group: {
                _id: null,
                totalRevenue: { $sum: "$totalAmount" },
                totalInvoices: { $sum: 1 }
            }
        }
    ]);
    
    res.json(revenueAgg[0] || { totalRevenue: 0, totalInvoices: 0 });
});

/**
 * @desc    Lấy trạng thái phòng (real-time)
 * @route   GET /api/rooms/status/realtime
 * @access  Private (Manager, Receptionist)
 */
const getRealtimeRoomStatus = asyncHandler(async (req, res, next) => {
    const roomStats = await Room.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
    ]);
    
    const totalRooms = await Room.countDocuments();
    
    res.json({
        totalRooms,
        statsByStatus: roomStats
    });
});

module.exports = {
    getRevenueDashboard,
    getRealtimeRoomStatus
};