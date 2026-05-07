jest.mock('../models/guestModel', () => ({
  findById: jest.fn(),
}));
jest.mock('../models/bookingModel', () => ({
  countDocuments: jest.fn(),
}));

const Guest = require('../models/guestModel');
const Booking = require('../models/bookingModel');
const { deleteGuest } = require('../controllers/guestController');

function createRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };
}

describe('guestController.deleteGuest', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 404 when guest does not exist', async () => {
    Guest.findById.mockResolvedValue(null);
    const req = { params: { guestId: 'missing-id' } };
    const res = createRes();
    const next = jest.fn();

    await deleteGuest(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(next).toHaveBeenCalled();
  });

  it('returns 400 when guest has related bookings', async () => {
    Guest.findById.mockResolvedValue({ _id: 'guest-1' });
    Booking.countDocuments.mockResolvedValue(2);
    const req = { params: { guestId: 'guest-1' } };
    const res = createRes();
    const next = jest.fn();

    await deleteGuest(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).toHaveBeenCalled();
  });

  it('deletes guest when no related bookings', async () => {
    const deleteOne = jest.fn().mockResolvedValue(undefined);
    Guest.findById.mockResolvedValue({ _id: 'guest-2', deleteOne });
    Booking.countDocuments.mockResolvedValue(0);
    const req = { params: { guestId: 'guest-2' } };
    const res = createRes();
    const next = jest.fn();

    await deleteGuest(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(deleteOne).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: 'Đã xóa khách thành công' });
  });
});
