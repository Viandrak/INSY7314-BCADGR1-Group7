const express = require('express');
const request = require('supertest');
const { validateObjectId, isValidObjectId } = require('../src/middleware/objectIdMiddleware');

const VALID_ID = '6acb834eb21771fe989d0778';

describe('isValidObjectId', () => {
  test('accepts a 24-character hexadecimal ID', () => {
    expect(isValidObjectId(VALID_ID)).toBe(true);
  });

  test('accepts uppercase hexadecimal characters', () => {
    expect(isValidObjectId(VALID_ID.toUpperCase())).toBe(true);
  });

  test('rejects an ID that is too short', () => {
    expect(isValidObjectId('6acb834eb21771fe989d077')).toBe(false);
  });

  test('rejects an ID that is too long', () => {
    expect(isValidObjectId(`${VALID_ID}a`)).toBe(false);
  });

  test('rejects an ID with non-hexadecimal characters', () => {
    expect(isValidObjectId('zzzz834eb21771fe989d0778')).toBe(false);
  });

  test('rejects values that are not text', () => {
    expect(isValidObjectId(123456789012345678901234)).toBe(false);
    expect(isValidObjectId({ $gt: '' })).toBe(false);
    expect(isValidObjectId(null)).toBe(false);
    expect(isValidObjectId(undefined)).toBe(false);
  });
});

describe('validateObjectId middleware', () => {
  // Builds a small test app with one route that uses the middleware
  // The route returns 200 if the ID is accepted, so no database is involved
  function buildApp() {
    const app = express();
    app.get('/gigs/:id', validateObjectId(), (req, res) => {
      res.status(200).json({ success: true, id: req.params.id });
    });
    app.get('/bookings/:bookingId', validateObjectId('bookingId'), (req, res) => {
      res.status(200).json({ success: true });
    });
    return app;
  }

  const app = buildApp();

  test('lets a valid ID through to the route', async () => {
    const res = await request(app).get(`/gigs/${VALID_ID}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(VALID_ID);
  });

  test('rejects a malformed ID with 400 before it reaches the database', async () => {
    const res = await request(app).get('/gigs/not-a-real-id');
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ success: false, message: 'Invalid ID format.' });
  });

  test('rejects a NoSQL operator sent in the URL', async () => {
    const res = await request(app).get('/gigs/%7B%22%24gt%22%3A%22%22%7D');
    expect(res.status).toBe(400);
  });

  test('checks a custom parameter name when one is given', async () => {
    const valid = await request(app).get(`/bookings/${VALID_ID}`);
    expect(valid.status).toBe(200);

    const invalid = await request(app).get('/bookings/123');
    expect(invalid.status).toBe(400);
  });
});
