const request = require('supertest');
const createApp = require('../app');

describe('Health endpoint', () => {
  it('GET /api/health should return ok', async () => {
    const app = createApp();
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });
});
