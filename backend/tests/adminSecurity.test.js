const mockAuditRows = [
  { event: 'login_failure', email: 'a@b.com', createdAt: new Date('2026-11-01') },
  { event: 'account_locked', email: 'a@b.com', createdAt: new Date('2026-11-02') },
];
const mockUser = { _id: 'u1', id: 'u1', email: 'locked@hustlehub.com' };

jest.mock('../src/models/userModel', () => ({
  find: jest.fn(),
  findById: jest.fn(async (id) => (id === '6acb834eb21771fe989d0778' ? mockUser : null)),
  updateOne: jest.fn().mockResolvedValue({ acknowledged: true }),
}));
jest.mock('../src/models/gigModel', () => ({ find: jest.fn() }));
jest.mock('../src/models/bookingModel', () => ({ find: jest.fn() }));
jest.mock('../src/models/auditLogModel', () => ({
  find: jest.fn(() => ({
    sort: jest.fn(() => ({ limit: jest.fn(async (n) => mockAuditRows.slice(0, n)) })),
  })),
}));
jest.mock('../src/models/revokedTokenModel', () => ({
  exists: jest.fn().mockResolvedValue(null),
}));
jest.mock('../src/services/auditService', () => ({
  recordAuditEvent: jest.fn().mockResolvedValue(undefined),
  recordAccessDenied: jest.fn(),
}));

const express = require('express');
const request = require('supertest');
const User = require('../src/models/userModel');
const adminRoutes = require('../src/routes/adminRoutes');
const { recordAuditEvent, recordAccessDenied } = require('../src/services/auditService');
const { generateToken } = require('../src/services/jwtService');
const { sanitizeInput } = require('../src/middleware/sanitizeMiddleware');

const ADMIN = { id: '6acb834eb21771fe989d0001', role: 'admin' };
const CLIENT = { id: '6acb834eb21771fe989d0002', role: 'client' };
const LOCKED_ID = '6acb834eb21771fe989d0778';

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use(sanitizeInput);
  app.use('/api/admin', adminRoutes);
  return app;
}
const as = (user) => ({ Authorization: `Bearer ${generateToken(user)}` });

describe('Admin unlock', () => {
  const app = buildApp();

  test('an admin can unlock an account', async () => {
    const res = await request(app).post(`/api/admin/users/${LOCKED_ID}/unlock`).set(as(ADMIN));
    expect(res.status).toBe(200);
    expect(User.updateOne).toHaveBeenCalledWith(
      { _id: 'u1' },
      { $set: { failedLoginAttempts: 0, lockUntil: null } }
    );
  });

  test('the unlock is recorded with the admin as the actor', async () => {
    await request(app).post(`/api/admin/users/${LOCKED_ID}/unlock`).set(as(ADMIN));
    expect(recordAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({ event: 'account_unlocked', actor: ADMIN.id, user: 'u1' })
    );
  });

  test('a client gets 403 and nothing is changed', async () => {
    const res = await request(app).post(`/api/admin/users/${LOCKED_ID}/unlock`).set(as(CLIENT));
    expect(res.status).toBe(403);
    expect(User.updateOne).not.toHaveBeenCalled();
    expect(recordAccessDenied).toHaveBeenCalled();
  });

  test('a request with no token gets 401', async () => {
    const res = await request(app).post(`/api/admin/users/${LOCKED_ID}/unlock`);
    expect(res.status).toBe(401);
  });

  test('an unknown user gets 404', async () => {
    const res = await request(app).post('/api/admin/users/6acb834eb21771fe989d9999/unlock').set(as(ADMIN));
    expect(res.status).toBe(404);
  });

  test('a malformed ID gets 400', async () => {
    const res = await request(app).post('/api/admin/users/not-an-id/unlock').set(as(ADMIN));
    expect(res.status).toBe(400);
  });

  test('a request body is rejected by the allowlist', async () => {
    const res = await request(app)
      .post(`/api/admin/users/${LOCKED_ID}/unlock`)
      .set(as(ADMIN))
      .send({ role: 'admin' });
    expect(res.status).toBe(400);
  });
});

describe('Security audit log endpoint', () => {
  const app = buildApp();

  test('an admin can read the audit log', async () => {
    const res = await request(app).get('/api/admin/audit-logs').set(as(ADMIN));
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(2);
    expect(res.body.logs[0].event).toBe('login_failure');
  });

  test('a client gets 403', async () => {
    const res = await request(app).get('/api/admin/audit-logs').set(as(CLIENT));
    expect(res.status).toBe(403);
    expect(res.body).not.toHaveProperty('logs');
  });

  test('a freelancer gets 403', async () => {
    const res = await request(app).get('/api/admin/audit-logs').set(as({ id: 'f1', role: 'freelancer' }));
    expect(res.status).toBe(403);
  });

  test('no token gets 401', async () => {
    const res = await request(app).get('/api/admin/audit-logs');
    expect(res.status).toBe(401);
  });

  test('limit must be a whole number from 1 to 200', async () => {
    for (const bad of ['0', '201', 'abc', '1.5']) {
      const res = await request(app).get(`/api/admin/audit-logs?limit=${bad}`).set(as(ADMIN));
      expect(res.status).toBe(400);
    }
    const ok = await request(app).get('/api/admin/audit-logs?limit=1').set(as(ADMIN));
    expect(ok.status).toBe(200);
    expect(ok.body.count).toBe(1);
  });
});