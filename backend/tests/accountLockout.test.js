// A fake User collection with one account. It understands the few update
// operators the lockout code uses ($inc and $set), so the tests exercise the
// real login logic without a database.
const mockStore = { user: null };

function makeUser(overrides = {}) {
  return {
    _id: 'user-1',
    id: 'user-1',
    email: 'client1@hustlehub.com',
    role: 'client',
    passwordHash: null, // set in beforeAll
    failedLoginAttempts: 0,
    lockUntil: null,
    ...overrides,
  };
}

jest.mock('../src/models/userModel', () => ({
  findOne: jest.fn(({ email }) => ({
    select: jest.fn(async () =>
      mockStore.user && mockStore.user.email === email ? { ...mockStore.user } : null
    ),
  })),
  findById: jest.fn(() => ({
    select: jest.fn(async () => ({ failedLoginAttempts: mockStore.user.failedLoginAttempts })),
  })),
  updateOne: jest.fn(async (_filter, update) => {
    if (update.$inc) mockStore.user.failedLoginAttempts += update.$inc.failedLoginAttempts;
    if (update.$set) Object.assign(mockStore.user, update.$set);
    return { acknowledged: true };
  }),
}));
jest.mock('../src/services/auditService', () => ({
  recordAuditEvent: jest.fn().mockResolvedValue(undefined),
  recordAccessDenied: jest.fn(),
}));
jest.mock('../src/models/revokedTokenModel', () => ({ exists: jest.fn(), updateOne: jest.fn() }));

const express = require('express');
const request = require('supertest');
const { login } = require('../src/controllers/authController');
const { hashPassword } = require('../src/services/passwordService');
const { recordAuditEvent } = require('../src/services/auditService');
const { MAX_FAILED_ATTEMPTS, LOCK_DURATION_MS } = require('../src/services/lockoutService');

const PASSWORD = 'Password123';
const GENERIC = { success: false, message: 'Invalid email or password.' };

function buildApp() {
  const app = express();
  app.use(express.json());
  app.post('/login', login);
  return app;
}

describe('Account lockout', () => {
  const app = buildApp();
  let passwordHash;

  beforeAll(async () => {
    passwordHash = await hashPassword(PASSWORD);
  });
  beforeEach(() => {
    mockStore.user = makeUser({ passwordHash });
  });

  const attempt = (password, email = 'client1@hustlehub.com') =>
    request(app).post('/login').send({ email, password });

  async function failFiveTimes() {
    for (let i = 0; i < MAX_FAILED_ATTEMPTS; i += 1) {
      await attempt('WrongPassword1');
    }
  }

  test('locks the account after 5 failed logins', async () => {
    await failFiveTimes();
    expect(mockStore.user.failedLoginAttempts).toBe(5);
    expect(mockStore.user.lockUntil).toBeInstanceOf(Date);
    const lockLength = mockStore.user.lockUntil.getTime() - Date.now();
    expect(lockLength).toBeGreaterThan(LOCK_DURATION_MS - 5000);
    expect(lockLength).toBeLessThanOrEqual(LOCK_DURATION_MS);
  });

  test('does not lock after only 4 failed logins', async () => {
    for (let i = 0; i < 4; i += 1) await attempt('WrongPassword1');
    expect(mockStore.user.lockUntil).toBeNull();
    const res = await attempt(PASSWORD);
    expect(res.status).toBe(200);
  });

  test('gives the identical response for a wrong password, an unknown email and a locked account', async () => {
    const wrong = await attempt('WrongPassword1');
    const unknown = await attempt('WrongPassword1', 'nobody@hustlehub.com');
    await failFiveTimes();
    const locked = await attempt('WrongPassword1');

    for (const res of [wrong, unknown, locked]) {
      expect(res.status).toBe(401);
      expect(res.body).toEqual(GENERIC);
    }
  });

  test('still rejects the correct password while the account is locked', async () => {
    await failFiveTimes();
    const res = await attempt(PASSWORD);
    expect(res.status).toBe(401);
    expect(res.body).toEqual(GENERIC);
    expect(res.body).not.toHaveProperty('token');
  });

  test('attempts during the lock do not extend it', async () => {
    await failFiveTimes();
    const lockedUntil = mockStore.user.lockUntil.getTime();
    await attempt('WrongPassword1');
    await attempt(PASSWORD);
    expect(mockStore.user.lockUntil.getTime()).toBe(lockedUntil);
    expect(mockStore.user.failedLoginAttempts).toBe(5);
  });

  test('lets the user in again once the lock has expired', async () => {
    await failFiveTimes();
    mockStore.user.lockUntil = new Date(Date.now() - 1000); // the lock ran out a second ago
    const res = await attempt(PASSWORD);
    expect(res.status).toBe(200);
    expect(res.body.token).toEqual(expect.any(String));
    expect(mockStore.user.failedLoginAttempts).toBe(0);
    expect(mockStore.user.lockUntil).toBeNull();
  });

  test('starts counting from zero after an expired lock', async () => {
    await failFiveTimes();
    mockStore.user.lockUntil = new Date(Date.now() - 1000);
    await attempt('WrongPassword1');
    expect(mockStore.user.failedLoginAttempts).toBe(1);
    expect(mockStore.user.lockUntil).toBeNull();
  });

  test('a successful login resets the failed count', async () => {
    for (let i = 0; i < 3; i += 1) await attempt('WrongPassword1');
    expect(mockStore.user.failedLoginAttempts).toBe(3);
    const res = await attempt(PASSWORD);
    expect(res.status).toBe(200);
    expect(mockStore.user.failedLoginAttempts).toBe(0);
  });

  test('records the lockout and every failed login in the audit log', async () => {
    await failFiveTimes();
    const events = recordAuditEvent.mock.calls.map(([entry]) => entry.event);
    expect(events.filter((e) => e === 'login_failure')).toHaveLength(5);
    expect(events).toContain('account_locked');
  });

  test('never puts the password or hash in the audit log', async () => {
    await failFiveTimes();
    await attempt(PASSWORD);
    const text = JSON.stringify(recordAuditEvent.mock.calls);
    expect(text).not.toContain(PASSWORD);
    expect(text).not.toContain(passwordHash);
  });
});