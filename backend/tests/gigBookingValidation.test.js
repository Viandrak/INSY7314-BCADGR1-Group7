const express = require('express');
const request = require('supertest');
const {
  createGigValidationRules,
  updateGigValidationRules,
  createBookingValidationRules,
  handleValidationErrors,
} = require('../src/middleware/validationMiddleware');

// Builds a small test app that runs only the validation rules being tested
// The route returns 200 if validation passes, so no controller or database
// is involved
function buildApp(rules) {
  const app = express();
  app.use(express.json());
  app.post('/test', rules, handleValidationErrors, (req, res) => {
    res.status(200).json({ success: true, body: req.body });
  });
  return app;
}

describe('Create gig validation rules', () => {
  const app = buildApp(createGigValidationRules);

  const validGig = {
    title: 'Logo Design',
    description: 'A professional logo for your brand.',
    category: 'Design',
    price: 600,
    deliveryDays: 3,
  };

  test('accepts a valid gig', async () => {
    const res = await request(app).post('/test').send(validGig);
    expect(res.status).toBe(200);
  });

  test('rejects a missing title', async () => {
    const { title, ...noTitle } = validGig;
    const res = await request(app).post('/test').send(noTitle);
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('rejects a title shorter than 3 characters', async () => {
    const res = await request(app).post('/test').send({ ...validGig, title: 'Hi' });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Title must be between 3 and 100 characters.');
  });

  test('rejects a title longer than 100 characters', async () => {
    const res = await request(app)
      .post('/test')
      .send({ ...validGig, title: 'a'.repeat(101) });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Title must be between 3 and 100 characters.');
  });

  test('rejects a description shorter than 10 characters', async () => {
    const res = await request(app)
      .post('/test')
      .send({ ...validGig, description: 'Too short' });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Description must be between 10 and 2000 characters.');
  });

  test('rejects a description longer than 2000 characters', async () => {
    const res = await request(app)
      .post('/test')
      .send({ ...validGig, description: 'a'.repeat(2001) });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Description must be between 10 and 2000 characters.');
  });

  test('rejects a category that is not on the allowed list', async () => {
    const res = await request(app)
      .post('/test')
      .send({ ...validGig, category: 'Hacking' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/^Category must be one of:/);
  });

  test('rejects a negative price', async () => {
    const res = await request(app).post('/test').send({ ...validGig, price: -50 });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Price must be between 1 and 1,000,000.');
  });

  test('rejects a price of zero', async () => {
    const res = await request(app).post('/test').send({ ...validGig, price: 0 });
    expect(res.status).toBe(400);
  });

  test('rejects a price above 1,000,000', async () => {
    const res = await request(app)
      .post('/test')
      .send({ ...validGig, price: 1000001 });
    expect(res.status).toBe(400);
  });

  test('rejects a price that is not a number', async () => {
    const res = await request(app)
      .post('/test')
      .send({ ...validGig, price: 'free' });
    expect(res.status).toBe(400);
  });

  test('rejects zero delivery days', async () => {
    const res = await request(app)
      .post('/test')
      .send({ ...validGig, deliveryDays: 0 });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Delivery days must be between 1 and 365.');
  });

  test('rejects more than 365 delivery days', async () => {
    const res = await request(app)
      .post('/test')
      .send({ ...validGig, deliveryDays: 366 });
    expect(res.status).toBe(400);
  });

  test('rejects delivery days that are not a whole number', async () => {
    const res = await request(app)
      .post('/test')
      .send({ ...validGig, deliveryDays: 2.5 });
    expect(res.status).toBe(400);
  });

  test('rejects a title sent as an object (NoSQL injection attempt)', async () => {
    const res = await request(app)
      .post('/test')
      .send({ ...validGig, title: { $ne: null } });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Title must be text.');
  });
});

describe('Update gig validation rules', () => {
  const app = buildApp(updateGigValidationRules);

  test('accepts an update with only some fields', async () => {
    const res = await request(app).post('/test').send({ price: 750 });
    expect(res.status).toBe(200);
  });

  test('still rejects an invalid value in a partial update', async () => {
    const res = await request(app).post('/test').send({ price: -1 });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Price must be between 1 and 1,000,000.');
  });

  test('still rejects a category that is not on the allowed list', async () => {
    const res = await request(app).post('/test').send({ category: 'Hacking' });
    expect(res.status).toBe(400);
  });
});

describe('Create booking validation rules', () => {
  const app = buildApp(createBookingValidationRules);

  test('accepts a 24-character gig ID', async () => {
    const res = await request(app)
      .post('/test')
      .send({ gigId: '6acb834eb21771fe989d0778' });
    expect(res.status).toBe(200);
  });

  test('rejects a missing gig ID', async () => {
    const res = await request(app).post('/test').send({});
    expect(res.status).toBe(400);
  });

  test('rejects a gig ID with the wrong length', async () => {
    const res = await request(app).post('/test').send({ gigId: '12345' });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Gig ID must be a valid ID.');
  });

  test('rejects a gig ID sent as an object (NoSQL injection attempt)', async () => {
    const res = await request(app)
      .post('/test')
      .send({ gigId: { $gt: '' } });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Gig ID must be text.');
  });
});