/**
 * Booking overlap: interval [checkIn, checkOut) — two bookings overlap when
 * booking.checkIn < rangeEnd && booking.checkOut > rangeStart.
 * Shared by create/update booking and available-room search to keep edge rules consistent.
 */

const BOOKABLE_ROOM_STATUSES = ['available', 'dirty', 'cleaning'];

function toDate(value) {
  return value instanceof Date ? value : new Date(value);
}

/**
 * @param {object} opts
 * @param {string|import('mongoose').Types.ObjectId} [opts.roomId] — omit to match any room (e.g. search)
 * @param {Date|string|number} opts.checkInDate
 * @param {Date|string|number} opts.checkOutDate
 * @param {string|import('mongoose').Types.ObjectId} [opts.excludeBookingId]
 */
function buildBookingOverlapFilter({
  roomId,
  checkInDate,
  checkOutDate,
  excludeBookingId,
}) {
  const start = toDate(checkInDate);
  const end = toDate(checkOutDate);
  const filter = {
    status: { $in: ['confirmed', 'checked_in'] },
    checkInDate: { $lt: end },
    checkOutDate: { $gt: start },
  };
  if (roomId) filter.room = roomId;
  if (excludeBookingId) filter._id = { $ne: excludeBookingId };
  return filter;
}

module.exports = {
  BOOKABLE_ROOM_STATUSES,
  buildBookingOverlapFilter,
};
