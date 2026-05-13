const request = require('supertest');
const createApp = require('../app');

describe('POST /api/payments (smoke)', () => {
  const app = createApp();

  it('returns 401 without JWT (checkout-related API)', async () => {
    const res = await request(app).post('/api/payments').send({});
    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/Not authorized|no token|Bearer/i);
  });
});
