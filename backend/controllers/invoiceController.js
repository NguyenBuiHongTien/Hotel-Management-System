const asyncHandler = require('express-async-handler');
const Invoice = require('../models/invoiceModel');
const Booking = require('../models/bookingModel');
const { startOfDay, endOfDay } = require('../utils/dateRange');

/**
 * @desc    Generate invoice for a booking (often called automatically)
 * @route   POST /api/bookings/:bookingId/invoice
 * @access  Private (Receptionist, Manager, Accountant)
 */
const generateInvoiceForBooking = asyncHandler(async (req, res, next) => {
  const { bookingId } = req.params;

  const booking = await Booking.findById(bookingId);
  if (!booking) {
    return res.status(404).json({ message: 'Booking not found' });
  }

  const existing = await Invoice.findOne({ booking: bookingId });
  if (existing) {
    return res.status(200).json(existing);
  }

  try {
    const invoice = await Invoice.create({
      booking: bookingId,
      totalAmount: booking.totalPrice,
      issueDate: new Date(),
      paymentStatus: 'pending',
    });
    return res.status(201).json(invoice);
  } catch (e) {
    if (e && e.code === 11000) {
      const again = await Invoice.findOne({ booking: bookingId });
      if (again) {
        return res.status(200).json(again);
      }
      return res.status(400).json({ message: 'An invoice already exists for this booking' });
    }
    throw e;
  }
});

/**
 * @desc    List all invoices (transaction history)
 * @route   GET /api/invoices
 * @access  Private (Receptionist, Manager, Accountant)
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
 * @desc    Get invoice by ID
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
    return res.status(404).json({ message: 'Invoice not found'});
  }
  res.status(200).json(invoice);
});

/**
 * @desc    Guest-facing invoice view by booking ID
 * @route   GET /api/invoices/guest/:bookingId
 * @access  Private (Receptionist, Manager, Accountant)
 */
const getGuestInvoiceView = asyncHandler(async (req, res, next) => {
    const invoice = await Invoice.findOne({ booking: req.params.bookingId })
        .populate({
            path: 'booking',
            populate: [ { path: 'guest' }, { path: 'room' } ]
        });
    if (!invoice) {
        return res.status(404).json({ message: 'No invoice found for this booking'});
    }
    res.json(invoice);
});

/**
 * @desc    Financial invoice view by booking ID (full booking/guest/room and creator)
 * @route   GET /api/invoices/financial/:bookingId
 * @access  Private (Accountant)
 */
const getFinancialInvoiceView = asyncHandler(async (req, res, next) => {
    const invoice = await Invoice.findOne({ booking: req.params.bookingId })
        .populate({
            path: 'booking',
            populate: [
                { path: 'guest' },
                { path: 'room', populate: { path: 'roomType' } },
                { path: 'createdBy', select: 'name email role' },
            ],
        });
    if (!invoice) {
        return res.status(404).json({ message: 'No invoice found for this booking'});
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