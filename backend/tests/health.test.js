const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');

function setReadyState(state) {
  Object.defineProperty(mongoose.connection, 'readyState', { value: state, configurable: true });
}

afterEach(() => {
  delete mongoose.connection.readyState;
});

describe('GET /health', () => {
  test('returns 200 and ok when the database is connected', async () => {
    setReadyState(1);
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  test('returns 503 when the database is not connected', async () => {
    setReadyState(0);
    const res = await request(app).get('/health');

    expect(res.status).toBe(503);
    expect(res.body).toEqual({ status: 'unavailable' });
  });

  test('is not blocked by the API rate limiter', async () => {
    setReadyState(1);
    for (let i = 0; i < 300; i += 1) {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
    }
  });
});