const asyncHandler = require('express-async-handler');
const Booking = require('../models/bookingModel');
const Room = require('../models/roomModel');
const Invoice = require('../models/invoiceModel');
const mongoose = require('mongoose');
const { sendCheckInEmail, sendCheckoutInvoiceEmail } = require('./notificationController');

/**
 * @desc    Check-in
 * @route   POST /api/checkin
 * @access  Private (Receptionist)
 */
const checkIn = asyncHandler(async (req, res) => {
  const { bookingId } = req.body;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const booking = await Booking.findById(bookingId).session(session);
    if (!booking) {
      await session.abortTransaction();
      res.status(404);
      throw new Error('Không tìm thấy booking');
    }
    if (booking.status !== 'confirmed') {
      await session.abortTransaction();
      res.status(400);
      throw new Error(`Booking đang ở trạng thái '${booking.status}', không thể check-in`);
    }

    await Room.findByIdAndUpdate(booking.room, { status: 'occupied' }).session(session);

    booking.status = 'checked_in';
    await booking.save({ session });

    await session.commitTransaction();

    const bookingForEmail = await Booking.findById(booking._id).populate([
      { path: 'guest' },
      { path: 'room', populate: { path: 'roomType' } },
    ]);
    let emailResult = { sent: false, reason: 'booking_not_found_after_checkin' };
    if (bookingForEmail) {
      emailResult = await sendCheckInEmail(bookingForEmail);
    } else {
      console.warn(
        `[email] Không tải lại booking sau check-in, bookingId=${booking._id}`
      );
    }

    res.json({
      ...booking.toObject(),
      email: emailResult,
    });
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
});

/**
 * @desc    Check-out
 * @route   POST /api/checkout
 * @access  Private (Receptionist)
 */
const checkOut = asyncHandler(async (req, res) => {
  const { bookingId } = req.body;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const booking = await Booking.findById(bookingId).session(session);
    if (!booking) {
      res.status(404);
      throw new Error('Không tìm thấy booking');
    }
    if (booking.status !== 'checked_in') {
      res.status(400);
      throw new Error(`Booking đang ở trạng thái '${booking.status}', không thể check-out`);
    }

    await Room.findByIdAndUpdate(booking.room, { status: 'dirty' }).session(session);

    booking.status = 'checked_out';

    let invoice = await Invoice.findOne({ booking: booking._id }).session(session);
    if (!invoice) {
      const createdInvoices = await Invoice.create(
        [{
          booking: booking._id,
          totalAmount: booking.totalPrice,
          issueDate: Date.now(),
          paymentStatus: 'pending',
        }],
        { session }
      );
      [invoice] = createdInvoices;
    }

    await booking.save({ session });

    await session.commitTransaction();

    const invoiceForEmail = await Invoice.findById(invoice._id).populate({
      path: 'booking',
      populate: [
        { path: 'guest' },
        { path: 'room', populate: { path: 'roomType' } },
      ],
    });
    let emailResult = { sent: false, reason: 'invoice_not_found_after_checkout' };
    if (invoiceForEmail) {
      emailResult = await sendCheckoutInvoiceEmail(invoiceForEmail);
    } else {
      console.warn(
        `[email] Không tìm thấy invoice sau checkout, invoiceId=${invoice._id}`
      );
    }

    res.json({
      message: 'Check-out thành công, đã tạo hóa đơn.',
      booking,
      invoice,
      email: emailResult,
    });
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
});

module.exports = {
  checkIn,
  checkOut,
};
