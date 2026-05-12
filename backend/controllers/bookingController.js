const asyncHandler = require('express-async-handler');
const Booking = require('../models/bookingModel');
const Room = require('../models/roomModel');
const Guest = require('../models/guestModel');
const RoomType = require('../models/roomTypeModel');
const Invoice = require('../models/invoiceModel');
const { sendBookingConfirmation } = require('./notificationController');
const { startOfDay, endOfDay } = require('../utils/dateRange');
const {
  BOOKABLE_ROOM_STATUSES,
  buildBookingOverlapFilter,
} = require('../utils/bookingOverlap');
const mongoose = require('mongoose');

/**
 * @desc    Create a new booking
 * @route   POST /api/bookings
 * @access  Private (Receptionist, Manager)
 * @remarks Room may be available/dirty/cleaning (advance booking); check-in only when room is available.
 */

const createBooking = asyncHandler(async (req, res) => {
  const { 
    customerId, // Existing guest ID
    guestInfo,  // New guest { fullName, phoneNumber, email }
    roomId, 
    checkInDate, 
    checkOutDate, 
    numberOfGuests
    // 'specialRequest' is not in bookingModel
  } = req.body;

  const session = await mongoose.startSession();
  let booking;

  try {
    await session.withTransaction(async () => {
      let guest;
      if (customerId) {
        guest = await Guest.findById(customerId).session(session);
        if (!guest) {
          res.status(404);
          throw new Error('Guest ID not found');
        }
      } else if (guestInfo && guestInfo.fullName && guestInfo.phoneNumber) {
        guest = await Guest.findOne({ phoneNumber: guestInfo.phoneNumber }).session(session);
        if (!guest) {
          const createdGuests = await Guest.create(
            [
              {
                fullName: guestInfo.fullName,
                phoneNumber: guestInfo.phoneNumber,
                ...(guestInfo.email ? { email: guestInfo.email } : {}),
                ...(guestInfo.address ? { address: guestInfo.address } : {}),
              },
            ],
            { session }
          );
          guest = createdGuests[0];
        } else {
          let needsSave = false;
          if (guestInfo.email && !guest.email) {
            guest.email = guestInfo.email;
            needsSave = true;
          }
          if (guestInfo.address && !guest.address) {
            guest.address = guestInfo.address;
            needsSave = true;
          }
          if (needsSave) {
            await guest.save({ session });
          }
        }
      } else {
        res.status(400);
        throw new Error('Either customerId or guestInfo is required');
      }

      const room = await Room.findById(roomId).session(session);
      if (!room) {
        res.status(404);
        throw new Error('Room not found');
      }
      if (!BOOKABLE_ROOM_STATUSES.includes(room.status)) {
        res.status(400);
        throw new Error(
          `Room status is '${room.status}'; booking is only allowed when the room is available, dirty, or cleaning`
        );
      }
      const roomType = await RoomType.findById(room.roomType).session(session);
      if (!roomType) {
        res.status(404);
        throw new Error('Linked room type not found');
      }

      const conflict = await Booking.findOne(
        buildBookingOverlapFilter({ roomId, checkInDate, checkOutDate })
      ).session(session);
      if (conflict) {
        res.status(400);
        throw new Error('Room is already booked for these dates');
      }

      // Lock room row to avoid write-skew double-booking under concurrent requests.
      await Room.updateOne(
        { _id: roomId },
        { $inc: { bookingVersion: 1 } },
        { session }
      );

      const recheckConflict = await Booking.findOne(
        buildBookingOverlapFilter({ roomId, checkInDate, checkOutDate })
      ).session(session);
      if (recheckConflict) {
        res.status(400);
        throw new Error('Room is already booked for these dates');
      }

      const nights = Math.ceil((new Date(checkOutDate) - new Date(checkInDate)) / (1000 * 60 * 60 * 24));
      if (nights <= 0) {
        res.status(400);
        throw new Error('Check-out date must be after check-in date');
      }
      const totalPrice = roomType.basePrice * nights;

      const created = await Booking.create([{
        guest: guest._id,
        room: roomId,
        createdBy: req.user._id,
        checkInDate,
        checkOutDate,
        numberOfGuests: numberOfGuests || 1,
        totalPrice,
        status: 'confirmed'
      }], { session });
      [booking] = created;
    });
  } catch (error) {
    if (error?.errorLabels?.includes('TransientTransactionError')) {
      res.status(409);
      throw new Error('Concurrent update in progress. Please try booking again.');
    }
    throw error;
  } finally {
    session.endSession();
  }
  
  // Room status stays available until check-in

  const populatedBooking = await booking.populate([
      { path: 'guest' },
      { path: 'room', populate: { path: 'roomType' } },
      { path: 'createdBy', select: 'name role' }
  ]);

  let emailResult = { sent: false, reason: 'skipped' };
  try {
    emailResult = await sendBookingConfirmation(populatedBooking);
  } catch (mailErr) {
    console.error(
      `[email] Booking confirmation send failed, bookingId=${booking._id}:`,
      mailErr.message
    );
    emailResult = { sent: false, reason: 'email_send_failed', error: mailErr.message };
  }

  res.status(201).json({
    ...populatedBooking.toObject(),
    email: emailResult,
  });
});

/**
 * @desc    List all bookings (with filters)
 * @route   GET /api/bookings
 * @access  Private (Receptionist, Manager, Accountant)
 */
const getAllBookings = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.customerId) filter.guest = req.query.customerId;
  if (req.query.roomId) filter.room = req.query.roomId;
  if (req.query.fromDate) {
    filter.checkInDate = { ...filter.checkInDate, $gte: startOfDay(req.query.fromDate) };
  }
  if (req.query.toDate) {
    filter.checkOutDate = { ...filter.checkOutDate, $lte: endOfDay(req.query.toDate) };
  }

  const page = Number.parseInt(req.query.page, 10);
  const limit = Number.parseInt(req.query.limit, 10);
  const usePagination = Number.isInteger(page) && page > 0 && Number.isInteger(limit) && limit > 0;

  let query = Booking.find(filter)
    .populate('guest', 'fullName phoneNumber')
    .populate('room', 'roomNumber')
    .populate('createdBy', 'name')
    .sort('-checkInDate');

  if (usePagination) {
    const skip = (page - 1) * limit;
    query = query.skip(skip).limit(limit);
  }

  const bookings = await query;

  const total = await Booking.countDocuments(filter);

  res.json({
    bookings,
    pagination: {
      page: usePagination ? page : 1,
      limit: usePagination ? limit : total,
      total,
      pages: usePagination ? Math.ceil(total / limit) : 1
    }
  });
});

/**
 * @desc    Get booking by ID
 * @route   GET /api/bookings/:bookingId
 * @access  Private
 */
const getBookingById = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.bookingId)
    .populate('guest')
    .populate({ path: 'room', populate: { path: 'roomType' } })
    .populate('createdBy', 'name role');
  if (!booking) {
    res.status(404);
    throw new Error('Booking not found');
  }
  res.json(booking);
});

/**
 * @desc    Update booking details
 * @route   PUT /api/bookings/:bookingId
 * @access  Private (Receptionist)
 */
const updateBooking = asyncHandler(async (req, res) => {
  const { roomId, checkInDate, checkOutDate, numberOfGuests } = req.body;
  const booking = await Booking.findById(req.params.bookingId);
  if (!booking) {
    res.status(404);
    throw new Error('Booking not found');
  }

  const targetRoomId = roomId ? String(roomId) : String(booking.room);
  const targetCheckIn = checkInDate ? new Date(checkInDate) : booking.checkInDate;
  const targetCheckOut = checkOutDate ? new Date(checkOutDate) : booking.checkOutDate;

  const roomOrDatesChanged =
    targetRoomId !== String(booking.room) ||
    targetCheckIn.getTime() !== new Date(booking.checkInDate).getTime() ||
    targetCheckOut.getTime() !== new Date(booking.checkOutDate).getTime();

  const session = await mongoose.startSession();
  let updated;
  try {
    await session.withTransaction(async () => {
      const txBooking = await Booking.findById(req.params.bookingId).session(session);
      if (!txBooking) {
        res.status(404);
        throw new Error('Booking not found');
      }

      if (roomOrDatesChanged) {
        if (txBooking.status === 'checked_in' || txBooking.status === 'checked_out') {
          res.status(400);
          throw new Error('Cannot change room or dates after check-in or check-out');
        }

        const nights = Math.ceil(
          (targetCheckOut - targetCheckIn) / (1000 * 60 * 60 * 24)
        );
        if (nights <= 0) {
          res.status(400);
          throw new Error('Check-out date must be after check-in date');
        }

        const conflict = await Booking.findOne(
          buildBookingOverlapFilter({
            roomId: targetRoomId,
            checkInDate: targetCheckIn,
            checkOutDate: targetCheckOut,
            excludeBookingId: txBooking._id,
          })
        ).session(session);
        if (conflict) {
          res.status(400);
          throw new Error('Room is already booked for these dates');
        }

        await Room.updateOne(
          { _id: targetRoomId },
          { $inc: { bookingVersion: 1 } },
          { session }
        );

        const recheckConflict = await Booking.findOne(
          buildBookingOverlapFilter({
            roomId: targetRoomId,
            checkInDate: targetCheckIn,
            checkOutDate: targetCheckOut,
            excludeBookingId: txBooking._id,
          })
        ).session(session);
        if (recheckConflict) {
          res.status(400);
          throw new Error('Room is already booked for these dates');
        }

        const room = await Room.findById(targetRoomId).session(session);
        if (!room) {
          res.status(404);
          throw new Error('Room not found');
        }
        const movingToAnotherRoom = String(txBooking.room) !== String(targetRoomId);
        if (movingToAnotherRoom && !BOOKABLE_ROOM_STATUSES.includes(room.status)) {
          res.status(400);
          throw new Error(
            `Target room status is '${room.status}'; booking can only be moved to a room that is available, dirty, or cleaning`
          );
        }
        const roomType = await RoomType.findById(room.roomType).session(session);
        if (!roomType) {
          res.status(404);
          throw new Error('Linked room type not found');
        }

        txBooking.room = targetRoomId;
        txBooking.checkInDate = targetCheckIn;
        txBooking.checkOutDate = targetCheckOut;
        txBooking.totalPrice = roomType.basePrice * nights;
      }

      if (numberOfGuests !== undefined && numberOfGuests !== null) {
        txBooking.numberOfGuests = numberOfGuests;
      }
      updated = await txBooking.save({ session });

      // Sync pending invoice total with booking after room/date change
      await Invoice.updateOne(
        { booking: txBooking._id, paymentStatus: 'pending' },
        { $set: { totalAmount: txBooking.totalPrice } },
        { session }
      );
    });
  } catch (error) {
    if (error?.errorLabels?.includes('TransientTransactionError')) {
      res.status(409);
      throw new Error('Concurrent update in progress. Please try again.');
    }
    throw error;
  } finally {
    session.endSession();
  }

  const populated = await updated.populate([
    { path: 'guest' },
    { path: 'room', populate: { path: 'roomType' } },
    { path: 'createdBy', select: 'name role' },
  ]);
  res.json(populated);
});

/**
 * @desc    Cancel booking
 * @route   POST /api/bookings/:bookingId/cancel
 * @access  Private (Receptionist)
 */
const cancelBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.bookingId);
  if (!booking) {
    res.status(404);
    throw new Error('Booking not found');
  }
  if (booking.status === 'cancelled') {
    return res.json(booking);
  }
  if (booking.status === 'checked_in' || booking.status === 'checked_out') {
    res.status(400);
    throw new Error('Cannot cancel a booking that has checked in or out');
  }

  const invoice = await Invoice.findOne({ booking: booking._id });
  if (invoice && invoice.paymentStatus === 'paid') {
    res.status(400);
    throw new Error('Cannot cancel: invoice is already paid');
  }
  if (invoice && invoice.paymentStatus === 'pending') {
    invoice.paymentStatus = 'cancelled';
    await invoice.save();
  }

  booking.status = 'cancelled';

  const updated = await booking.save();
  res.json(updated);
});

module.exports = {
  createBooking,
  getAllBookings,
  getBookingById,
  updateBooking,
  cancelBooking,
};