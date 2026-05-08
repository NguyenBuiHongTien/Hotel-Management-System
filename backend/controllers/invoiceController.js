const asyncHandler = require('express-async-handler');
const Invoice = require('../models/invoiceModel');
const Booking = require('../models/bookingModel');
const { startOfDay, endOfDay } = require('../utils/dateRange');

/**
 * @desc    Tạo hóa đơn cho một booking (thường được gọi tự động)
 * @route   POST /api/bookings/:bookingId/invoice
 * @access  Private (Receptionist, Accountant)
 */
const generateInvoiceForBooking = asyncHandler(async (req, res, next) => {
  const { bookingId } = req.params;

  const booking = await Booking.findById(bookingId);
  if (!booking) {
    return res.status(404).json({ message: 'Không tìm thấy booking' });
  }

  try {
    const invoice = await Invoice.findOneAndUpdate(
      { booking: bookingId },
      {
        $setOnInsert: {
          booking: bookingId,
          totalAmount: booking.totalPrice,
          issueDate: new Date(),
          paymentStatus: 'pending',
        },
      },
      { new: true, upsert: true, runValidators: true }
    );

    const isNew = invoice.createdAt && invoice.updatedAt &&
      Math.abs(invoice.createdAt - invoice.updatedAt) < 2000; // heuristic tùy chọn

    return res.status(isNew ? 201 : 200).json(invoice);
  } catch (e) {
    if (e && e.code === 11000) {
      const existing = await Invoice.findOne({ booking: bookingId });
      return res.status(400).json({ message: 'Hóa đơn đã tồn tại cho booking này' });
    }
    throw e;
  }
});

/**
 * @desc    Lấy tất cả hóa đơn (Lịch sử giao dịch)
 * @route   GET /api/invoices
 * @access  Private (Accountant, Manager)
 */
const getAllInvoices = asyncHandler(async (req, res, next) => {
  const filter = {};
  if (req.query.status) {
    filter.paymentStatus = req.query.status;
  }
  if (req.query.bookingId) {
    filter.booking = req.query.bookingId;
  }
  if (req.query.fromDate || req.query.toDate) {
    filter.issueDate = {};
    if (req.query.fromDate) filter.issueDate.$gte = startOfDay(req.query.fromDate);
    if (req.query.toDate) filter.issueDate.$lte = endOfDay(req.query.toDate);
  }
  
  const invoices = await Invoice.find(filter)
  .populate({
    path: 'booking',
    select: 'guest room checkInDate checkOutDate',
    populate: [
      { path: 'guest', select: 'fullName' },
      { path: 'room', select: 'roomNumber' },
    ],
  })
  .sort('-issueDate');

 res.status(200).json(invoices);
});

/**
 * @desc    Lấy chi tiết 1 hóa đơn
 * @route   GET /api/invoices/:invoiceId
 * @access  Private (Accountant, Manager, Receptionist)
 */
const getInvoiceById = asyncHandler(async (req, res, next) => {
  const invoice = await Invoice.findById(req.params.invoiceId)
      .populate({
        path: 'booking',
        populate: [
          { path: 'guest' },
          { path: 'room', populate: { path: 'roomType' } }
        ]
      });
  if (!invoice) {
    return res.status(404).json({ message: 'Không tìm thấy hóa đơn'});
  }
  res.status(200).json(invoice);
});

/**
 * @desc    Lấy hóa đơn (view của khách) bằng Booking ID
 * @route   GET /api/invoices/guest/:bookingId
 * @access  Private (Accountant, Receptionist)
 */
const getGuestInvoiceView = asyncHandler(async (req, res, next) => {
    const invoice = await Invoice.findOne({ booking: req.params.bookingId })
        .populate({
            path: 'booking',
            populate: [ { path: 'guest' }, { path: 'room' } ]
        });
    if (!invoice) {
        return res.status(404).json({ message: 'Không tìm thấy hóa đơn cho booking này'});
    }
    res.json(invoice);
});

/**
 * @desc    Lấy hóa đơn (view tài chính) bằng Booking ID
 * @route   GET /api/invoices/financial/:bookingId
 * @access  Private (Accountant)
 */
const getFinancialInvoiceView = asyncHandler(async (req, res, next) => {
    // Tạm thời giống hệt getGuestInvoiceView
    // Có thể populate thêm chi tiết (vd: createdBy) nếu cần
    const invoice = await Invoice.findOne({ booking: req.params.bookingId })
        .populate('booking');
    if (!invoice) {
        return res.status(404).json({ message: 'Không tìm thấy hóa đơn cho booking này'});
    }
    res.json(invoice);
});

module.exports = {
    generateInvoiceForBooking,
    getAllInvoices,
    getInvoiceById,
    getGuestInvoiceView,
    getFinancialInvoiceView
};