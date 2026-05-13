const { authorize } = require('../middleware/authMiddleware');

describe('authorize middleware', () => {
  it('calls next() when user role is allowed', () => {
    const req = { user: { role: 'manager' } };
    const res = { status: jest.fn().mockReturnThis() };
    const next = jest.fn();
    authorize('manager', 'receptionist')(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0]).toBeUndefined();
  });

  it('calls next(err) with status 403 when user role is not allowed', () => {
    const req = { user: { role: 'receptionist' } };
    const res = { status: jest.fn().mockReturnThis() };
    const next = jest.fn();
    authorize('manager')(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).toHaveBeenCalledTimes(1);
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(Error);
    expect(err.status).toBe(403);
    expect(err.message).toMatch(/permission|resource/i);
  });

  it('calls next(err) with status 403 when req.user is missing', () => {
    const req = {};
    const res = { status: jest.fn().mockReturnThis() };
    const next = jest.fn();
    authorize('manager')(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    const err = next.mock.calls[0][0];
    expect(err.status).toBe(403);
    expect(err.message).toMatch(/not authenticated|User/i);
  });
});
