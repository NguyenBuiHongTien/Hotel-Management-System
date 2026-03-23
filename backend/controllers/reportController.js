const asyncHandler = require('express-async-handler');
const Report = require('../models/reportModel');
const Room = require('../models/roomModel');
const Invoice = require('../models/invoiceModel');

/**
 * @desc    Tạo báo cáo tỷ lệ lấp đầy (VÀ LƯU LẠI)
 * @route   GET /api/reports/occupancy
 * @access  Private (Manager)
 */
const generateOccupancyReport = asyncHandler(async (req, res, next) => {
  const { fromDate, toDate } = req.query;
  if (!fromDate || !toDate) {
      res.status(400); throw new Error('Cần có fromDate và toDate');
  }
  
  // 1. Tính toán
  const totalRooms = await Room.countDocuments();
  const roomStats = await Room.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);
  const data = { totalRooms, statsByStatus: roomStats };

  // 2. Lưu báo cáo (theo reportModel)
  const report = await Report.create({
      reportType: 'occupancy',
      reportName: `Báo cáo Tỷ lệ lấp đầy ${fromDate} - ${toDate}`,
      startDate: fromDate,
      endDate: toDate,
      data: data,
      generatedBy: req.user._id
  });

  res.status(201).json(report);
});

/**
 * @desc    Tạo báo cáo doanh thu (VÀ LƯU LẠI)
 * @route   GET /api/reports/revenue
 * @access  Private (Manager, Accountant)
 */
const generateRevenueReport = asyncHandler(async (req, res, next) => {
    const { fromDate, toDate } = req.query;
    if (!fromDate || !toDate) {
        res.status(400); throw new Error('Cần có fromDate và toDate');
    }

    // 1. Tính toán
    const revenueData = await Invoice.aggregate([
        {
            $match: {
                paymentStatus: 'paid',
                updatedAt: { $gte: new Date(fromDate), $lte: new Date(toDate) } // Giả sử ngày thanh toán là ngày update
            }
        },
        {
            $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$updatedAt" } },
                totalRevenue: { $sum: "$totalAmount" },
                count: { $sum: 1 }
            }
        },
        { $sort: { _id: 1 } }
    ]);
    const total = revenueData.reduce((sum, day) => sum + day.totalRevenue, 0);

    // 2. Lưu báo cáo
    const report = await Report.create({
        reportType: 'revenue',
        reportName: `Báo cáo Doanh thu ${fromDate} - ${toDate}`,
        startDate: fromDate,
        endDate: toDate,
        data: { totalRevenue: total, dailyBreakdown: revenueData },
        generatedBy: req.user._id
    });

    res.status(201).json(report);
});

/**
 * @desc    Lấy danh sách các báo cáo đã tạo
 * @route   GET /api/reports
 * @access  Private (Manager, Accountant)
 */
const listGeneratedReports = asyncHandler(async (req, res, next) => {
    const filter = {};
    if (req.query.type) filter.reportType = req.query.type;
    
    const reports = await Report.find(filter)
        .populate('generatedBy', 'name')
        .sort('-generatedDate');
    res.json(reports);
});

/**
 * @desc    Lấy chi tiết 1 báo cáo đã lưu
 * @route   GET /api/reports/:reportId
 * @access  Private (Manager, Accountant)
 */
const getGeneratedReportById = asyncHandler(async (req, res, next) => {
    // reportId của Doc là _id của model
    const report = await Report.findById(req.params.reportId)
        .populate('generatedBy', 'name');
    if (!report) {
        res.status(404);
        throw new Error('Không tìm thấy báo cáo');
    }
    res.json(report);
});

/**
 * @desc    Xuất báo cáo tổng hợp (Placeholder)
 * @route   GET /api/reports/comprehensive/export
 * @access  Private (Manager)
 */
const exportComprehensiveReport = asyncHandler(async (req, res, next) => {
    // TODO: Logic phức tạp kết hợp revenue và occupancy
    res.status(501).json({ message: 'Chưa cài đặt (Not Implemented)' });
});


module.exports = {
    generateOccupancyReport,
    generateRevenueReport,
    listGeneratedReports,
    getGeneratedReportById,
    exportComprehensiveReport
};