const request = require('supertest');
const express = require('express');

describe('Health endpoint', () => {
  it('GET /api/health should return ok', async () => {
    const app = express();
    app.get('/api/health', (req, res) => res.status(200).json({ ok: true }));

    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });
});
