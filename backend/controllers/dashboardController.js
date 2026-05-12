const asyncHandler = require('express-async-handler');
const Room = require('../models/roomModel');
const Invoice = require('../models/invoiceModel');
const { startOfDay, endOfDay } = require('../utils/dateRange');

/**
 * @desc    Revenue summary for dashboard
 * @route   GET /api/dashboard/revenue
 * @access  Private (Manager)
 */
const getRevenueDashboard = asyncHandler(async (req, res, next) => {
    const { fromDate, toDate } = req.query;

    const matchFilter = { paymentStatus: 'paid' };
    if (fromDate || toDate) {
        matchFilter.updatedAt = {};
        if (fromDate) {
            matchFilter.updatedAt.$gte = startOfDay(fromDate);
        }
        if (toDate) {
            matchFilter.updatedAt.$lte = endOfDay(toDate);
        }
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
 * @desc    Real-time room status counts
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
