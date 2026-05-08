jest.mock('../models/roomModel', () => ({
  findById: jest.fn(),
}));

const Room = require('../models/roomModel');
const { updateRoomStatus } = require('../controllers/roomController');

function createRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };
}

function mockFindByIdWithRoom(room) {
  Room.findById.mockReturnValue({
    populate: jest.fn().mockResolvedValue(room),
  });
}

describe('roomController.updateRoomStatus policy', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects occupied updates from status endpoint', async () => {
    const room = { _id: 'room-1', status: 'available', save: jest.fn() };
    mockFindByIdWithRoom(room);

    const req = {
      params: { roomId: 'room-1' },
      body: { status: 'occupied' },
      user: { role: 'receptionist' },
    };
    const res = createRes();
    const next = jest.fn();

    await updateRoomStatus(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(room.save).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  it('rejects available updates for non-housekeeper roles', async () => {
    const room = { _id: 'room-2', status: 'cleaning', save: jest.fn() };
    mockFindByIdWithRoom(room);

    const req = {
      params: { roomId: 'room-2' },
      body: { status: 'available' },
      user: { role: 'receptionist' },
    };
    const res = createRes();
    const next = jest.fn();

    await updateRoomStatus(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(room.save).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  it('allows available updates for housekeeper', async () => {
    const room = { _id: 'room-3', status: 'cleaning', save: jest.fn().mockResolvedValue(undefined) };
    mockFindByIdWithRoom(room);

    const req = {
      params: { roomId: 'room-3' },
      body: { status: 'available' },
      user: { role: 'housekeeper' },
    };
    const res = createRes();
    const next = jest.fn();

    await updateRoomStatus(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(room.status).toBe('available');
    expect(room.save).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(room);
  });
});
