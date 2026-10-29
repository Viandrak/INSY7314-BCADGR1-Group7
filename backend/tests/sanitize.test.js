const express = require('express');
const request = require('supertest');
const { sanitizeInput } = require('../src/middleware/sanitizeMiddleware');

// Builds a small test app that runs the sanitisation middleware and then
// echoes back the cleaned body and query string, so the tests can see
// exactly what a controller would receive
function buildApp() {
  const app = express();
  app.use(express.json());
  app.use(sanitizeInput);
  app.post('/echo', (req, res) => {
    res.json({ body: req.body, query: req.query });
  });
  app.get('/echo', (req, res) => {
    res.json({ query: req.query });
  });
  return app;
}

describe('Input sanitisation middleware', () => {
  const app = buildApp();

  describe('XSS protection', () => {
    test('removes angle brackets from text so HTML tags cannot be injected', async () => {
      const res = await request(app)
        .post('/echo')
        .send({ description: "<script>alert('xss')</script>" });
      expect(res.body.body.description).toBe("scriptalert('xss')/script");
      expect(res.body.body.description).not.toMatch(/[<>]/);
    });

    test('removes angle brackets from an image tag with an event handler', async () => {
      const res = await request(app)
        .post('/echo')
        .send({ title: '<img src=x onerror=alert(1)>' });
      expect(res.body.body.title).not.toMatch(/[<>]/);
    });
  });

  describe('NoSQL injection protection', () => {
    test('drops keys that start with $', async () => {
      const res = await request(app)
        .post('/echo')
        .send({ email: 'client@example.com', $where: 'this.password.length > 0' });
      expect(res.body.body).toEqual({ email: 'client@example.com' });
    });

    test('drops operator keys inside a nested object', async () => {
      const res = await request(app)
        .post('/echo')
        .send({ email: { $gt: '' } });
      expect(res.body.body.email).toEqual({});
    });

    test('drops keys that contain a dot', async () => {
      const res = await request(app)
        .post('/echo')
        .send({ 'profile.role': 'admin', title: 'Logo Design' });
      expect(res.body.body).toEqual({ title: 'Logo Design' });
    });

    test('removes $ characters from text values', async () => {
      const res = await request(app)
        .post('/echo')
        .send({ title: '$ne Logo Design' });
      expect(res.body.body.title).toBe('ne Logo Design');
    });

    test('cleans values inside arrays', async () => {
      const res = await request(app)
        .post('/echo')
        .send({ tags: ['<b>design</b>', '$logo'] });
      expect(res.body.body.tags).toEqual(['bdesign/b', 'logo']);
    });
  });

  describe('Prototype pollution protection', () => {
    test('drops a __proto__ key so it cannot add hidden inherited fields', async () => {
      const res = await request(app)
        .post('/echo')
        .set('Content-Type', 'application/json')
        .send('{"title":"Logo Design","__proto__":{"role":"admin","isAdmin":true}}');
      expect(res.body.body).toEqual({ title: 'Logo Design' });
    });

    test('the cleaned body has no inherited role after a __proto__ attempt', async () => {
      const inspectApp = express();
      inspectApp.use(express.json());
      inspectApp.use(sanitizeInput);
      inspectApp.post('/inspect', (req, res) => {
        res.json({
          role: req.body.role,
          isAdmin: req.body.isAdmin,
          normalPrototype: Object.getPrototypeOf(req.body) === Object.prototype,
        });
      });
      const res = await request(inspectApp)
        .post('/inspect')
        .set('Content-Type', 'application/json')
        .send('{"title":"x","__proto__":{"role":"admin","isAdmin":true}}');
      expect(res.body.role).toBeUndefined();
      expect(res.body.isAdmin).toBeUndefined();
      expect(res.body.normalPrototype).toBe(true);
    });

    test('drops constructor and prototype keys, including nested ones', async () => {
      const res = await request(app)
        .post('/echo')
        .set('Content-Type', 'application/json')
        .send('{"title":"x","constructor":{"prototype":{"role":"admin"}},"profile":{"prototype":"y","name":"z"}}');
      expect(res.body.body).toEqual({ title: 'x', profile: { name: 'z' } });
    });
  });

  describe('Query string protection', () => {
    test('removes angle brackets from query string values', async () => {
      const res = await request(app).get('/echo?category=<b>Design</b>');
      expect(res.body.query.category).toBe('bDesign/b');
    });

    test('drops query string keys that start with $', async () => {
      const res = await request(app).get('/echo?category=Design&$where=1');
      expect(res.body.query).toEqual({ category: 'Design' });
    });
  });

  describe('Values that must not be changed', () => {
    test('leaves passwords exactly as typed so special characters still work', async () => {
      const res = await request(app)
        .post('/echo')
        .send({ email: 'client@example.com', password: 'Pa$$<word>123' });
      expect(res.body.body.password).toBe('Pa$$<word>123');
    });

    test('leaves normal text unchanged', async () => {
      const res = await request(app)
        .post('/echo')
        .send({ title: 'Logo Design for Small Businesses' });
      expect(res.body.body.title).toBe('Logo Design for Small Businesses');
    });

    test('leaves numbers and booleans unchanged', async () => {
      const res = await request(app)
        .post('/echo')
        .send({ price: 600, deliveryDays: 3, active: true });
      expect(res.body.body).toEqual({ price: 600, deliveryDays: 3, active: true });
    });
  });
});