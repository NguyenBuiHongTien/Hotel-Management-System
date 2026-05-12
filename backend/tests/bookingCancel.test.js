jest.mock('../models/bookingModel', () => ({
  findById: jest.fn(),
}));
jest.mock('../models/invoiceModel', () => ({
  findOne: jest.fn(),
}));

const Booking = require('../models/bookingModel');
const Invoice = require('../models/invoiceModel');
const { cancelBooking } = require('../controllers/bookingController');

describe('bookingController.cancelBooking', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects cancel when invoice is paid', async () => {
    const booking = { _id: 'b1', status: 'confirmed', save: jest.fn() };
    Booking.findById.mockResolvedValue(booking);
    Invoice.findOne.mockResolvedValue({ paymentStatus: 'paid', save: jest.fn() });

    const req = { params: { bookingId: 'b1' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    await cancelBooking(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).toHaveBeenCalled();
    expect(String(next.mock.calls[0][0].message)).toMatch(/paid/i);
    expect(booking.save).not.toHaveBeenCalled();
  });

  it('cancels pending invoice then booking', async () => {
    const invoice = { paymentStatus: 'pending', save: jest.fn().mockResolvedValue(undefined) };
    const booking = { _id: 'b2', status: 'confirmed', save: jest.fn().mockResolvedValue({ status: 'cancelled' }) };
    Booking.findById.mockResolvedValue(booking);
    Invoice.findOne.mockResolvedValue(invoice);

    const req = { params: { bookingId: 'b2' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    await cancelBooking(req, res, next);

    expect(invoice.save).toHaveBeenCalled();
    expect(invoice.paymentStatus).toBe('cancelled');
    expect(booking.status).toBe('cancelled');
    expect(booking.save).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it('returns booking when already cancelled', async () => {
    const booking = { _id: 'b3', status: 'cancelled' };
    Booking.findById.mockResolvedValue(booking);

    const req = { params: { bookingId: 'b3' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    await cancelBooking(req, res, next);

    expect(res.json).toHaveBeenCalledWith(booking);
    expect(Invoice.findOne).not.toHaveBeenCalled();
  });
});
