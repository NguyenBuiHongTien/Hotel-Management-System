jest.mock('../models/reportModel', () => ({ create: jest.fn(), find: jest.fn(), findById: jest.fn() }));
jest.mock('../models/roomModel', () => ({ countDocuments: jest.fn(), aggregate: jest.fn() }));
jest.mock('../models/invoiceModel', () => ({ aggregate: jest.fn() }));
jest.mock('../models/bookingModel', () => ({ countDocuments: jest.fn(), distinct: jest.fn() }));

const Room = require('../models/roomModel');
const Invoice = require('../models/invoiceModel');
const Booking = require('../models/bookingModel');
const {
  getRevenueReportPreview,
  getOccupancyReportPreview,
} = require('../controllers/reportController');

function createRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };
}

describe('reportController date range validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 400 when revenue preview receives invalid date', async () => {
    const req = { query: { fromDate: 'not-a-date', toDate: '2026-05-01' } };
    const res = createRes();
    const next = jest.fn();

    await getRevenueReportPreview(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).toHaveBeenCalled();
    expect(String(next.mock.calls[0][0].message)).toContain('không đúng định dạng');
    expect(Invoice.aggregate).not.toHaveBeenCalled();
  });

  it('returns 400 when occupancy preview receives reversed range', async () => {
    const req = { query: { fromDate: '2026-05-10', toDate: '2026-05-01' } };
    const res = createRes();
    const next = jest.fn();

    await getOccupancyReportPreview(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).toHaveBeenCalled();
    expect(String(next.mock.calls[0][0].message)).toContain('nhỏ hơn hoặc bằng');
    expect(Room.countDocuments).not.toHaveBeenCalled();
    expect(Booking.countDocuments).not.toHaveBeenCalled();
  });

  it('returns payload when range is valid', async () => {
    Room.countDocuments.mockResolvedValue(10);
    Booking.countDocuments.mockResolvedValue(3);
    Booking.distinct.mockResolvedValue(['room-1', 'room-2']);
    Room.aggregate.mockResolvedValue([{ _id: 'available', count: 8 }]);

    const req = { query: { fromDate: '2026-05-01', toDate: '2026-05-02' } };
    const res = createRes();
    const next = jest.fn();

    await getOccupancyReportPreview(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalled();
  });
});
