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
      res.status(404);
      throw new Error('Không tìm thấy booking');
    }
    if (booking.status !== 'confirmed') {
      res.status(400);
      throw new Error(`Booking đang ở trạng thái '${booking.status}', không thể check-in`);
    }

    const room = await Room.findById(booking.room).session(session);
    if (!room) {
      res.status(404);
      throw new Error('Không tìm thấy phòng gắn với booking');
    }
    if (room.status !== 'available') {
      res.status(400);
      let hint = '';
      if (room.status === 'dirty' || room.status === 'cleaning') {
        hint =
          ' Buồng phòng cần hoàn tất dọn và chuyển phòng sang trạng thái "available" trước khi check-in (đặt phòng khi phòng dirty/cleaning là đặt trước, chưa đủ điều kiện nhận khách).';
      } else if (room.status === 'maintenance') {
        hint =
          ' Cần hoàn tất bảo trì và chuyển phòng sang "available" (hoặc trạng thái phù hợp quy trình) trước khi nhận khách.';
      } else if (room.status === 'occupied') {
        hint =
          ' Phòng đang được ghi nhận có khách; kiểm tra dữ liệu booking/phòng hoặc xử lý check-out trước đó nếu đây là lỗi dữ liệu.';
      }
      throw new Error(
        `Phòng đang ở trạng thái '${room.status}', chỉ có thể check-in khi phòng ở trạng thái 'available'.${hint}`
      );
    }

    await Room.findByIdAndUpdate(booking.room, { status: 'occupied' }).session(session);

    booking.status = 'checked_in';
    await booking.save({ session });

    await session.commitTransaction();

    let emailResult = { sent: false, reason: 'booking_not_found_after_checkin' };
    try {
      const bookingForEmail = await Booking.findById(booking._id).populate([
        { path: 'guest' },
        { path: 'room', populate: { path: 'roomType' } },
      ]);
      if (bookingForEmail) {
        emailResult = await sendCheckInEmail(bookingForEmail);
      } else {
        console.warn(
          `[email] Không tải lại booking sau check-in, bookingId=${booking._id}`
        );
      }
    } catch (mailErr) {
      console.error(`[email] Gửi check-in thất bại, bookingId=${booking._id}:`, mailErr.message);
      emailResult = { sent: false, reason: 'email_send_failed', error: mailErr.message };
    }

    res.json({
      ...booking.toObject(),
      email: emailResult,
    });
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
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

    const invoice = await Invoice.findOneAndUpdate(
      { booking: booking._id },
      {
        $setOnInsert: {
          booking: booking._id,
          totalAmount: booking.totalPrice,
          issueDate: Date.now(),
          paymentStatus: 'pending',
        },
      },
      { new: true, upsert: true, runValidators: true, session }
    );

    await booking.save({ session });

    await session.commitTransaction();

    let emailResult = { sent: false, reason: 'invoice_not_found_after_checkout' };
    try {
      const invoiceForEmail = await Invoice.findById(invoice._id).populate({
        path: 'booking',
        populate: [
          { path: 'guest' },
          { path: 'room', populate: { path: 'roomType' } },
        ],
      });
      if (invoiceForEmail) {
        emailResult = await sendCheckoutInvoiceEmail(invoiceForEmail);
      } else {
        console.warn(
          `[email] Không tìm thấy invoice sau checkout, invoiceId=${invoice._id}`
        );
      }
    } catch (mailErr) {
      console.error(`[email] Gửi checkout thất bại, invoiceId=${invoice._id}:`, mailErr.message);
      emailResult = { sent: false, reason: 'email_send_failed', error: mailErr.message };
    }

    res.json({
      message: 'Check-out thành công, đã tạo hóa đơn.',
      booking,
      invoice,
      email: emailResult,
    });
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    throw error;
  } finally {
    session.endSession();
  }
});

module.exports = {
  checkIn,
  checkOut,
};
