const express = require('express');
const request = require('supertest');
const { allowFields } = require('../src/middleware/allowlistMiddleware');

// The same fields the gig routes allow (see src/routes/gigRoutes.js)
const GIG_FIELDS = ['title', 'description', 'category', 'price', 'deliveryDays'];

// Builds a small test app that runs only the allowlist middleware
// The route returns 200 if the request gets through
function buildApp(allowedFields) {
  const app = express();
  app.use(express.json());
  app.post('/test', allowFields(allowedFields), (req, res) => {
    res.status(200).json({ success: true });
  });
  return app;
}

describe('Mass assignment allowlist middleware', () => {
  const app = buildApp(GIG_FIELDS);

  test('accepts a request that only uses allowed fields', async () => {
    const res = await request(app).post('/test').send({
      title: 'Logo Design',
      description: 'A professional logo for your brand.',
      category: 'Design',
      price: 600,
      deliveryDays: 3,
    });
    expect(res.status).toBe(200);
  });

  test('accepts a request with only some of the allowed fields', async () => {
    const res = await request(app).post('/test').send({ price: 750 });
    expect(res.status).toBe(200);
  });

  test('accepts an empty body', async () => {
    const res = await request(app).post('/test').send({});
    expect(res.status).toBe(200);
  });

  test('rejects an attempt to set the freelancer who owns the gig', async () => {
    const res = await request(app)
      .post('/test')
      .send({ title: 'Logo Design', freelancer: '6acb834eb21771fe989d0778' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Unexpected field(s) in request: freelancer.');
  });

  test('rejects an attempt to set a role', async () => {
    const res = await request(app)
      .post('/test')
      .send({ title: 'Logo Design', role: 'admin' });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Unexpected field(s) in request: role.');
  });

  test('names every unexpected field in the error message', async () => {
    const res = await request(app)
      .post('/test')
      .send({ title: 'Logo Design', role: 'admin', _id: 'abc', createdAt: '2020-01-01' });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Unexpected field(s) in request: role, _id, createdAt.');
  });

  test('rejects an unexpected field even when sent on its own', async () => {
    const res = await request(app).post('/test').send({ status: 'completed' });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Unexpected field(s) in request: status.');
  });

  test('field names are case-sensitive, so a differently cased field is rejected', async () => {
    const res = await request(app).post('/test').send({ Price: 1 });
    expect(res.status).toBe(400);
  });
});