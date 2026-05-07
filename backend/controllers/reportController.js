const asyncHandler = require('express-async-handler');
const Report = require('../models/reportModel');
const Room = require('../models/roomModel');
const Invoice = require('../models/invoiceModel');
const Booking = require('../models/bookingModel');
const { parseInclusiveRange } = require('../utils/dateRange');

function validateDateRangeOrThrow(fromDate, toDate, res) {
  if (!fromDate || !toDate) {
    res.status(400);
    throw new Error('Cần có fromDate và toDate');
  }

  const from = new Date(fromDate);
  const to = new Date(toDate);

  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    res.status(400);
    throw new Error('fromDate hoặc toDate không đúng định dạng ngày');
  }

  if (from > to) {
    res.status(400);
    throw new Error('fromDate phải nhỏ hơn hoặc bằng toDate');
  }
}

/**
 * Dữ liệu công suất theo khoảng thời gian: booking overlap với [from, to].
 */
async function buildOccupancyPayload(fromDate, toDate) {
  const { from, to } = parseInclusiveRange(fromDate, toDate);

  const totalRooms = await Room.countDocuments();

  const overlapFilter = {
    status: { $in: ['confirmed', 'checked_in', 'checked_out'] },
    checkInDate: { $lt: to },
    checkOutDate: { $gt: from },
  };

  const bookingsOverlapping = await Booking.countDocuments(overlapFilter);

  const distinctRoomIds = await Booking.distinct('room', overlapFilter);
  const distinctRoomsWithOverlap = distinctRoomIds.filter((id) => id != null).length;

  const roomStats = await Room.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  const occupancyRate =
    totalRooms > 0
      ? Number(((distinctRoomsWithOverlap / totalRooms) * 100).toFixed(2))
      : 0;

  return {
    period: { fromDate, toDate },
    totalRooms,
    bookingsOverlapping,
    distinctRoomsWithOverlap,
    occupancyRate,
    statsByStatusSnapshot: roomStats,
  };
}

async function buildRevenuePayload(fromDate, toDate) {
  const { from, to } = parseInclusiveRange(fromDate, toDate);

  const revenueData = await Invoice.aggregate([
    {
      $match: {
        paymentStatus: 'paid',
        updatedAt: { $gte: from, $lte: to },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$updatedAt' } },
        totalRevenue: { $sum: '$totalAmount' },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const total = revenueData.reduce((sum, day) => sum + day.totalRevenue, 0);

  return {
    period: { fromDate, toDate },
    totalRevenue: total,
    dailyBreakdown: revenueData,
  };
}

/**
 * @desc    Xem nhanh báo cáo tỷ lệ lấp đầy (không lưu DB)
 * @route   GET /api/reports/occupancy
 */
const getOccupancyReportPreview = asyncHandler(async (req, res) => {
  const { fromDate, toDate } = req.query;
  validateDateRangeOrThrow(fromDate, toDate, res);

  const data = await buildOccupancyPayload(fromDate, toDate);
  res.status(200).json({ preview: true, ...data });
});

/**
 * @desc    Tạo và lưu báo cáo tỷ lệ lấp đầy
 * @route   POST /api/reports/occupancy/save
 */
const saveOccupancyReport = asyncHandler(async (req, res) => {
  const fromDate = req.body.fromDate || req.query.fromDate;
  const toDate = req.body.toDate || req.query.toDate;
  validateDateRangeOrThrow(fromDate, toDate, res);

  const data = await buildOccupancyPayload(fromDate, toDate);

  const report = await Report.create({
    reportType: 'occupancy',
    reportName: `Báo cáo Tỷ lệ lấp đầy ${fromDate} - ${toDate}`,
    startDate: fromDate,
    endDate: toDate,
    data,
    generatedBy: req.user._id,
  });

  res.status(201).json(report);
});

/**
 * @desc    Xem nhanh báo cáo doanh thu (không lưu DB)
 * @route   GET /api/reports/revenue
 */
const getRevenueReportPreview = asyncHandler(async (req, res) => {
  const { fromDate, toDate } = req.query;
  validateDateRangeOrThrow(fromDate, toDate, res);

  const data = await buildRevenuePayload(fromDate, toDate);
  res.status(200).json({ preview: true, ...data });
});

/**
 * @desc    Tạo và lưu báo cáo doanh thu
 * @route   POST /api/reports/revenue/save
 */
const saveRevenueReport = asyncHandler(async (req, res) => {
  const fromDate = req.body.fromDate || req.query.fromDate;
  const toDate = req.body.toDate || req.query.toDate;
  validateDateRangeOrThrow(fromDate, toDate, res);

  const payload = await buildRevenuePayload(fromDate, toDate);

  const report = await Report.create({
    reportType: 'revenue',
    reportName: `Báo cáo Doanh thu ${fromDate} - ${toDate}`,
    startDate: fromDate,
    endDate: toDate,
    data: {
      totalRevenue: payload.totalRevenue,
      dailyBreakdown: payload.dailyBreakdown,
    },
    generatedBy: req.user._id,
  });

  res.status(201).json(report);
});

/**
 * @desc    Lấy danh sách các báo cáo đã tạo
 * @route   GET /api/reports
 */
const listGeneratedReports = asyncHandler(async (req, res) => {
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
 */
const getGeneratedReportById = asyncHandler(async (req, res) => {
  const report = await Report.findById(req.params.reportId).populate(
    'generatedBy',
    'name'
  );
  if (!report) {
    res.status(404);
    throw new Error('Không tìm thấy báo cáo');
  }
  res.json(report);
});

/**
 * @desc    Xuất báo cáo tổng hợp (JSON)
 * @route   GET /api/reports/comprehensive/export
 */
const exportComprehensiveReport = asyncHandler(async (req, res) => {
  const { fromDate, toDate } = req.query;

  validateDateRangeOrThrow(fromDate, toDate, res);

  const revenuePayload = await buildRevenuePayload(fromDate, toDate);
  const occupancyPayload = await buildOccupancyPayload(fromDate, toDate);

  const payload = {
    period: { fromDate, toDate },
    revenue: {
      totalRevenue: revenuePayload.totalRevenue,
      paidInvoiceCount: revenuePayload.dailyBreakdown.reduce(
        (sum, item) => sum + item.count,
        0
      ),
      dailyBreakdown: revenuePayload.dailyBreakdown,
    },
    occupancy: occupancyPayload,
    generatedAt: new Date(),
    generatedBy: req.user?._id || null,
  };

  res.status(200).json(payload);
});

module.exports = {
  getOccupancyReportPreview,
  saveOccupancyReport,
  getRevenueReportPreview,
  saveRevenueReport,
  listGeneratedReports,
  getGeneratedReportById,
  exportComprehensiveReport,
};
