/**
 * Trùng lịch đặt phòng: khoảng [checkIn, checkOut) — hai booking chồng nhau khi
 * booking.checkIn < rangeEnd && booking.checkOut > rangeStart.
 * Dùng chung cho tạo/cập nhật booking và tìm phòng trống để tránh lệch biên.
 */

const BOOKABLE_ROOM_STATUSES = ['available', 'dirty', 'cleaning'];

function toDate(value) {
  return value instanceof Date ? value : new Date(value);
}

/**
 * @param {object} opts
 * @param {string|import('mongoose').Types.ObjectId} [opts.roomId] — bỏ qua nếu cần mọi phòng (vd. search)
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
  const checkIn = toDate(checkInDate);
  const checkOut = toDate(checkOutDate);
  const filter = {
    status: { $in: ['confirmed', 'checked_in'] },
    checkInDate: { $lt: checkOut },
    checkOutDate: { $gt: checkIn },
  };
  if (roomId != null && roomId !== '') {
    filter.room = roomId;
  }
  if (excludeBookingId) {
    filter._id = { $ne: excludeBookingId };
  }
  return filter;
}

module.exports = {
  BOOKABLE_ROOM_STATUSES,
  buildBookingOverlapFilter,
};
