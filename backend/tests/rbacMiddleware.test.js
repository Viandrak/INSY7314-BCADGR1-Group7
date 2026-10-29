const express = require('express');
const request = require('supertest');
const { authorize } = require('../src/middleware/rbacMiddleware');

// Builds a small test app where a fake user is attached to the request
// (standing in for the authenticate middleware), then the role check runs
function buildApp(user, ...allowedRoles) {
  const app = express();
  app.get(
    '/test',
    (req, res, next) => {
      if (user) req.user = user;
      next();
    },
    authorize(...allowedRoles),
    (req, res) => res.status(200).json({ success: true })
  );
  return app;
}

const FORBIDDEN = {
  success: false,
  message: 'You do not have permission to perform this action.',
};

describe('Role-based access control middleware', () => {
  test('allows a user whose role is permitted', async () => {
    const app = buildApp({ id: '1', role: 'freelancer' }, 'freelancer');
    const res = await request(app).get('/test');
    expect(res.status).toBe(200);
  });

  test('allows any of several permitted roles', async () => {
    const app = buildApp({ id: '1', role: 'client' }, 'client', 'freelancer');
    const res = await request(app).get('/test');
    expect(res.status).toBe(200);
  });

  test('blocks a client from a freelancer-only route', async () => {
    const app = buildApp({ id: '1', role: 'client' }, 'freelancer');
    const res = await request(app).get('/test');
    expect(res.status).toBe(403);
    expect(res.body).toEqual(FORBIDDEN);
  });

  test('blocks a freelancer from a client-only route', async () => {
    const app = buildApp({ id: '1', role: 'freelancer' }, 'client');
    const res = await request(app).get('/test');
    expect(res.status).toBe(403);
  });

  test('blocks non-admins from an admin-only route', async () => {
    for (const role of ['client', 'freelancer']) {
      const app = buildApp({ id: '1', role }, 'admin');
      const res = await request(app).get('/test');
      expect(res.status).toBe(403);
    }
  });

  test('blocks a request with no user attached', async () => {
    const app = buildApp(null, 'client');
    const res = await request(app).get('/test');
    expect(res.status).toBe(403);
  });

  test('blocks a made-up role', async () => {
    const app = buildApp({ id: '1', role: 'superuser' }, 'admin');
    const res = await request(app).get('/test');
    expect(res.status).toBe(403);
  });

  test('role names are case-sensitive', async () => {
    const app = buildApp({ id: '1', role: 'Admin' }, 'admin');
    const res = await request(app).get('/test');
    expect(res.status).toBe(403);
  });
});