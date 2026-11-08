// A fake blacklist that behaves like the MongoDB collection: updateOne with
// upsert adds an entry, exists() looks one up
const mockRevoked = new Set();
jest.mock('../src/models/revokedTokenModel', () => ({
  exists: jest.fn(async ({ jti }) => (mockRevoked.has(jti) ? { _id: 'x' } : null)),
  updateOne: jest.fn(async ({ jti }) => {
    mockRevoked.add(jti);
    return { acknowledged: true };
  }),
}));
jest.mock('../src/services/auditService', () => ({
  recordAuditEvent: jest.fn().mockResolvedValue(undefined),
  recordAccessDenied: jest.fn(),
}));

const express = require('express');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const RevokedToken = require('../src/models/revokedTokenModel');
const { authenticate } = require('../src/middleware/authMiddleware');
const { logout } = require('../src/controllers/authController');
const { generateToken } = require('../src/services/jwtService');

const USER = { id: '6acb834eb21771fe989d0778', role: 'client' };

function buildApp() {
  const app = express();
  app.post('/logout', authenticate, logout);
  app.get('/protected', authenticate, (req, res) => res.status(200).json({ success: true }));
  return app;
}

describe('JWT revocation on logout', () => {
  const app = buildApp();
  beforeEach(() => mockRevoked.clear());

  test('every new token has a unique jti', () => {
    const ids = new Set(Array.from({ length: 20 }, () => jwt.decode(generateToken(USER)).jti));
    expect(ids.size).toBe(20);
  });

  test('a token works before logout', async () => {
    const res = await request(app).get('/protected').set('Authorization', `Bearer ${generateToken(USER)}`);
    expect(res.status).toBe(200);
  });

  test('the same token is rejected after logout', async () => {
    const token = generateToken(USER);
    const out = await request(app).post('/logout').set('Authorization', `Bearer ${token}`);
    expect(out.status).toBe(200);

    const res = await request(app).get('/protected').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid or expired token.');
  });

  test('a different token for the same user still works after the first one is logged out', async () => {
    const first = generateToken(USER);
    const second = generateToken(USER);
    await request(app).post('/logout').set('Authorization', `Bearer ${first}`);

    const res = await request(app).get('/protected').set('Authorization', `Bearer ${second}`);
    expect(res.status).toBe(200);
  });

  test('logging out twice does not crash', async () => {
    const token = generateToken(USER);
    const one = await request(app).post('/logout').set('Authorization', `Bearer ${token}`);
    const two = await request(app).post('/logout').set('Authorization', `Bearer ${token}`);
    expect(one.status).toBe(200);
    expect(two.status).toBe(401); // refused cleanly, no 500
  });

  test('the blacklist stores the token ID and expiry, never the token', async () => {
    const token = generateToken(USER);
    await request(app).post('/logout').set('Authorization', `Bearer ${token}`);

    const [filter, update] = RevokedToken.updateOne.mock.calls[0];
    const decoded = jwt.decode(token);
    expect(filter).toEqual({ jti: decoded.jti });
    expect(update.$setOnInsert.expiresAt.getTime()).toBe(decoded.exp * 1000);
    expect(JSON.stringify(RevokedToken.updateOne.mock.calls[0])).not.toContain(token);
  });

  test('a validly signed token with no jti is rejected', async () => {
    const noJti = jwt.sign(USER, process.env.JWT_SECRET, {
      algorithm: 'HS256', issuer: 'hustlehub-api', audience: 'hustlehub-client', expiresIn: '1h',
    });
    const res = await request(app).get('/protected').set('Authorization', `Bearer ${noJti}`);
    expect(res.status).toBe(401);
  });

  test('the request is refused (not allowed) if the blacklist cannot be checked', async () => {
    RevokedToken.exists.mockRejectedValueOnce(new Error('database down'));
    const res = await request(app).get('/protected').set('Authorization', `Bearer ${generateToken(USER)}`);
    expect(res.status).toBe(500);
    expect(JSON.stringify(res.body)).not.toContain('database down');
  });
});