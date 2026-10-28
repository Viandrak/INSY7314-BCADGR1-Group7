const express = require('express');
const request = require('supertest');
const { notFoundHandler, centralErrorHandler } = require('../src/middleware/errorHandler');

// Builds a small test app with routes that throw different kinds of errors,
// followed by the real not-found and central error handlers.
function buildApp() {
  const app = express();
  app.use(express.json());

  app.post('/echo', (req, res) => res.json({ body: req.body }));

  app.get('/crash', () => {
    const err = new Error('Database password is hunter2 at mongodb://admin:secret@db');
    throw err;
  });

  app.get('/bad-request', () => {
    const err = new Error('Custom validation message.');
    err.statusCode = 400;
    throw err;
  });

  app.use(notFoundHandler);
  app.use(centralErrorHandler);
  return app;
}

describe('Not-found and central error handlers', () => {
  const app = buildApp();

  // The error handler logs errors on the server. Silence that output in
  // the test run, but keep track of it so we can check logging happened.
  let consoleErrorSpy;
  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  test('returns 404 in the standard JSON format for an unknown route', async () => {
    const res = await request(app).get('/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      success: false,
      message: 'The requested resource was not found.',
    });
  });

  test('returns 400 with a clear message for malformed JSON', async () => {
    const res = await request(app)
      .post('/echo')
      .set('Content-Type', 'application/json')
      .send('{"email": "broken"');
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ success: false, message: 'Malformed JSON in request body.' });
  });

  test('returns a generic 500 message for unexpected errors', async () => {
    const res = await request(app).get('/crash');
    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      success: false,
      message: 'An unexpected error occurred. Please try again later.',
    });
  });

  test('never leaks the internal error message or stack trace to the client', async () => {
    const res = await request(app).get('/crash');
    const text = JSON.stringify(res.body);
    expect(text).not.toContain('hunter2');
    expect(text).not.toContain('mongodb://');
    expect(text).not.toMatch(/at .*\.js/); // stack trace lines
    expect(res.body).not.toHaveProperty('stack');
  });

  test('still logs the full error on the server for debugging', async () => {
    await request(app).get('/crash');
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  test('passes on the message for errors that set their own non-500 status', async () => {
    const res = await request(app).get('/bad-request');
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ success: false, message: 'Custom validation message.' });
  });
});