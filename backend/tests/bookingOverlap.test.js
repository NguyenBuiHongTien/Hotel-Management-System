const {
  buildBookingOverlapFilter,
  BOOKABLE_ROOM_STATUSES,
} = require('../utils/bookingOverlap');

describe('bookingOverlap', () => {
  it('buildBookingOverlapFilter: half-open interval on same room', () => {
    const f = buildBookingOverlapFilter({
      roomId: 'r1',
      checkInDate: new Date('2026-06-10'),
      checkOutDate: new Date('2026-06-12'),
      excludeBookingId: 'b0',
    });
    expect(f.room).toBe('r1');
    expect(f.status).toEqual({ $in: ['confirmed', 'checked_in'] });
    expect(f.checkInDate).toEqual({ $lt: new Date('2026-06-12') });
    expect(f.checkOutDate).toEqual({ $gt: new Date('2026-06-10') });
    expect(f._id).toEqual({ $ne: 'b0' });
  });

  it('buildBookingOverlapFilter: omits room when finding conflicts for all rooms', () => {
    const f = buildBookingOverlapFilter({
      checkInDate: '2026-01-01',
      checkOutDate: '2026-01-05',
    });
    expect(f.room).toBeUndefined();
    expect(f.checkInDate.$lt).toEqual(new Date('2026-01-05'));
    expect(f.checkOutDate.$gt).toEqual(new Date('2026-01-01'));
  });

  it('BOOKABLE_ROOM_STATUSES is stable', () => {
    expect(BOOKABLE_ROOM_STATUSES).toEqual(['available', 'dirty', 'cleaning']);
  });
});
