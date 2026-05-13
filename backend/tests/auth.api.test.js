const request = require('supertest');
const createApp = require('../app');

jest.mock('../models/userModel', () => {
  const mockFindOne = jest.fn();
  return {
    findOne: mockFindOne,
  };
});

const User = require('../models/userModel');

describe('POST /api/auth/login', () => {
  const app = createApp();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 400 when body is empty (validation)', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Invalid input|Email|password|required/i);
    expect(Array.isArray(res.body.errors)).toBe(true);
  });

  it('returns 401 when user is not found', async () => {
    User.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue(null),
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@hotel.com', password: 'HotelDemo1' });

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/Invalid email or password/i);
  });

  it('returns 200 with token when credentials match', async () => {
    const mockUser = {
      _id: '507f1f77bcf86cd799439011',
      name: 'Test User',
      email: 'receptionist@hotel.com',
      role: 'receptionist',
      matchPassword: jest.fn().mockResolvedValue(true),
    };
    User.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue(mockUser),
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'receptionist@hotel.com', password: 'HotelDemo1' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.role).toBe('receptionist');
    expect(mockUser.matchPassword).toHaveBeenCalledWith('HotelDemo1');
  });
});
