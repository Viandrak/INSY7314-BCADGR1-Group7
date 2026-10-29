const express = require('express');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const { authenticate } = require('../src/middleware/authMiddleware');
const { generateToken } = require('../src/services/jwtService');

const USER = { id: '6acb834eb21771fe989d0778', role: 'client' };

// Builds a small test app with one protected route that returns req.user,
// so the tests can see what the middleware passed on
function buildApp() {
  const app = express();
  app.get('/protected', authenticate, (req, res) => {
    res.status(200).json({ success: true, user: req.user });
  });
  return app;
}

describe('Authentication middleware', () => {
  const app = buildApp();

  test('lets a request with a valid token through and sets req.user', async () => {
    const res = await request(app)
      .get('/protected')
      .set('Authorization', `Bearer ${generateToken(USER)}`);
    expect(res.status).toBe(200);
    expect(res.body.user.id).toBe(USER.id);
    expect(res.body.user.role).toBe(USER.role);
  });

  test('rejects a request with no Authorization header', async () => {
    const res = await request(app).get('/protected');
    expect(res.status).toBe(401);
    expect(res.body).toEqual({
      success: false,
      message: 'Authentication token missing or malformed.',
    });
  });

  test('rejects a header that does not use the Bearer scheme', async () => {
    const res = await request(app)
      .get('/protected')
      .set('Authorization', `Basic ${generateToken(USER)}`);
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Authentication token missing or malformed.');
  });

  test('rejects "Bearer" with no token after it', async () => {
    const res = await request(app).get('/protected').set('Authorization', 'Bearer ');
    expect(res.status).toBe(401);
  });

  test('rejects a random string that is not a token', async () => {
    const res = await request(app)
      .get('/protected')
      .set('Authorization', 'Bearer not-a-real-token');
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid or expired token.');
  });

  test('rejects an expired token', async () => {
    const expired = jwt.sign(
      { ...USER, exp: Math.floor(Date.now() / 1000) - 60 },
      process.env.JWT_SECRET,
      { algorithm: 'HS256', issuer: 'hustlehub-api', audience: 'hustlehub-client' }
    );
    const res = await request(app).get('/protected').set('Authorization', `Bearer ${expired}`);
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid or expired token.');
  });

  test('rejects a token signed with a different secret', async () => {
    const forged = jwt.sign({ ...USER, role: 'admin' }, 'some-other-secret', {
      algorithm: 'HS256', issuer: 'hustlehub-api', audience: 'hustlehub-client', expiresIn: '1h',
    });
    const res = await request(app).get('/protected').set('Authorization', `Bearer ${forged}`);
    expect(res.status).toBe(401);
  });

  test('does not reveal why a token was rejected', async () => {
    const res = await request(app)
      .get('/protected')
      .set('Authorization', 'Bearer not-a-real-token');
    expect(JSON.stringify(res.body)).not.toMatch(/jwt|signature|malformed token|stack/i);
  });
});