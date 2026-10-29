const express = require('express');
const request = require('supertest');
const {
  registerValidationRules,
  loginValidationRules,
  handleValidationErrors,
} = require('../src/middleware/validationMiddleware');

// Builds a small test app that runs only the validation rules being tested
// The route returns 200 if validation passes, so no controller or database is involved
function buildApp(rules) {
  const app = express();
  app.use(express.json());
  app.post('/test', rules, handleValidationErrors, (req, res) => {
    res.status(200).json({ success: true, body: req.body });
  });
  return app;
}

describe('Registration validation rules', () => {
  const app = buildApp(registerValidationRules);

  const validUser = {
    email: 'freelancer@example.com',
    password: 'Password123',
    role: 'freelancer',
  };

  test('accepts a valid registration', async () => {
    const res = await request(app).post('/test').send(validUser);
    expect(res.status).toBe(200);
  });

  test('normalises the email address', async () => {
    const res = await request(app)
      .post('/test')
      .send({ ...validUser, email: '  Freelancer@Example.COM ' });
    expect(res.status).toBe(200);
    expect(res.body.body.email).toBe('freelancer@example.com');
  });

  test('rejects a missing email', async () => {
    const { email, ...noEmail } = validUser;
    const res = await request(app).post('/test').send(noEmail);
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('rejects an invalid email format', async () => {
    const res = await request(app)
      .post('/test')
      .send({ ...validUser, email: 'not-an-email' });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('A valid email address is required.');
  });

  test('rejects an email sent as an object (NoSQL injection attempt)', async () => {
    const res = await request(app)
      .post('/test')
      .send({ ...validUser, email: { $gt: '' } });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Email must be text.');
  });

  test('rejects a password shorter than 8 characters', async () => {
    const res = await request(app)
      .post('/test')
      .send({ ...validUser, password: 'Pass1' });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Password must be at least 8 characters long.');
  });

  test('rejects a password without an uppercase letter', async () => {
    const res = await request(app)
      .post('/test')
      .send({ ...validUser, password: 'password123' });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Password must contain at least one uppercase letter.');
  });

  test('rejects a password without a lowercase letter', async () => {
    const res = await request(app)
      .post('/test')
      .send({ ...validUser, password: 'PASSWORD123' });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Password must contain at least one lowercase letter.');
  });

  test('rejects a password without a number', async () => {
    const res = await request(app)
      .post('/test')
      .send({ ...validUser, password: 'PasswordOnly' });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Password must contain at least one number.');
  });

  test('rejects the admin role so users cannot register as admin', async () => {
    const res = await request(app)
      .post('/test')
      .send({ ...validUser, role: 'admin' });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Role must be either "client" or "freelancer".');
  });

  test('rejects a missing role', async () => {
    const { role, ...noRole } = validUser;
    const res = await request(app).post('/test').send(noRole);
    expect(res.status).toBe(400);
  });
});

describe('Login validation rules', () => {
  const app = buildApp(loginValidationRules);

  test('accepts a valid login', async () => {
    const res = await request(app)
      .post('/test')
      .send({ email: 'client@example.com', password: 'anything' });
    expect(res.status).toBe(200);
  });

  test('rejects a missing password', async () => {
    const res = await request(app)
      .post('/test')
      .send({ email: 'client@example.com' });
    expect(res.status).toBe(400);
  });

  test('rejects an invalid email format', async () => {
    const res = await request(app)
      .post('/test')
      .send({ email: 'client', password: 'anything' });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('A valid email address is required.');
  });

  test('rejects a password sent as an object (NoSQL injection attempt)', async () => {
    const res = await request(app)
      .post('/test')
      .send({ email: 'client@example.com', password: { $ne: null } });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Password must be text.');
  });
});