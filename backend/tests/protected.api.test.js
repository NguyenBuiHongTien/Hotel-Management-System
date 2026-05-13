const request = require('supertest');
const createApp = require('../app');

describe('Protected routes without JWT', () => {
  const app = createApp();

  it('GET /api/rooms returns 401 without Authorization header', async () => {
    const res = await request(app).get('/api/rooms');
    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/Not authorized|no token|Bearer/i);
  });
});
