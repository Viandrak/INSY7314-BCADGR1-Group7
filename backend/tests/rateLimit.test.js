const express = require('express');
const request = require('supertest');

// Loads a fresh copy of the rate limiters for each test, so the request
// count from one test never carries over into the next
function loadLimiters() {
  let limiters;
  jest.isolateModules(() => {
    limiters = require('../src/middleware/rateLimitMiddleware');
  });
  return limiters;
}

describe('Authentication rate limiter', () => {
  function buildApp() {
    const { authLimiter } = loadLimiters();
    const app = express();
    app.post('/login', authLimiter, (req, res) => res.status(200).json({ success: true }));
    return app;
  }

  test('allows up to 10 attempts in the window', async () => {
    const app = buildApp();
    for (let i = 0; i < 10; i += 1) {
      const res = await request(app).post('/login');
      expect(res.status).toBe(200);
    }
  });

  test('blocks the 11th attempt with 429 and a clear message', async () => {
    const app = buildApp();
    for (let i = 0; i < 10; i += 1) {
      await request(app).post('/login');
    }
    const res = await request(app).post('/login');
    expect(res.status).toBe(429);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Too many authentication attempts. Please try again later.');
  });

  test('tells the client when it can try again', async () => {
    const app = buildApp();
    for (let i = 0; i < 10; i += 1) {
      await request(app).post('/login');
    }
    const res = await request(app).post('/login');
    expect(Number(res.headers['retry-after'])).toBeGreaterThan(0);
    expect(res.body.retryAfterSeconds).toBeGreaterThan(0);
  });

  test('sends standard rate limit headers', async () => {
    const app = buildApp();
    const res = await request(app).post('/login');
    expect(res.headers).toHaveProperty('ratelimit-policy');
  });
});

describe('Booking rate limiter', () => {
  // Attaches a fake logged-in user (standing in for authenticate),
  // because the booking limiter counts requests per user.
  function buildApp() {
    const { bookingLimiter } = loadLimiters();
    const app = express();
    app.post(
      '/bookings',
      (req, res, next) => {
        req.user = { id: req.get('x-test-user'), role: 'client' };
        next();
      },
      bookingLimiter,
      (req, res) => res.status(201).json({ success: true })
    );
    return app;
  }

  test('blocks the 6th booking from the same user', async () => {
    const app = buildApp();
    for (let i = 0; i < 5; i += 1) {
      const res = await request(app).post('/bookings').set('x-test-user', 'client-a');
      expect(res.status).toBe(201);
    }
    const res = await request(app).post('/bookings').set('x-test-user', 'client-a');
    expect(res.status).toBe(429);
    expect(res.body.message).toBe('Too many booking requests. Please wait before making another booking.');
  });

  test('counts each user separately', async () => {
    const app = buildApp();
    for (let i = 0; i < 5; i += 1) {
      await request(app).post('/bookings').set('x-test-user', 'client-a');
    }
    const otherUser = await request(app).post('/bookings').set('x-test-user', 'client-b');
    expect(otherUser.status).toBe(201);
  });
});