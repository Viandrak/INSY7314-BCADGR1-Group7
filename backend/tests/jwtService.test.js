const jwt = require('jsonwebtoken');
const { generateToken, verifyToken } = require('../src/services/jwtService');

const USER = { id: '6acb834eb21771fe989d0778', role: 'freelancer' };
const SECRET = process.env.JWT_SECRET; // test-only value from tests/setup.js

describe('JWT service', () => {
  test('creates a token that can be verified', () => {
    const token = generateToken(USER);
    const decoded = verifyToken(token);
    expect(decoded.id).toBe(USER.id);
    expect(decoded.role).toBe(USER.role);
  });

  test('only puts the user ID and role in the token, never the password or email', () => {
    const token = generateToken({ ...USER, email: 'freelancer1@hustlehub.com', passwordHash: 'hash' });
    const decoded = jwt.decode(token);
    expect(decoded).not.toHaveProperty('email');
    expect(decoded).not.toHaveProperty('passwordHash');
    expect(decoded).not.toHaveProperty('password');
  });

  test('sets the issuer, audience and an expiry time', () => {
    const decoded = verifyToken(generateToken(USER));
    expect(decoded.iss).toBe('hustlehub-api');
    expect(decoded.aud).toBe('hustlehub-client');
    expect(decoded.exp).toBeGreaterThan(decoded.iat);
  });

  test('signs tokens with HS256', () => {
    const { header } = jwt.decode(generateToken(USER), { complete: true });
    expect(header.alg).toBe('HS256');
  });

  test('rejects a token that has been tampered with', () => {
    const [header, , signature] = generateToken(USER).split('.');
    const fakePayload = Buffer.from(JSON.stringify({ ...USER, role: 'admin' })).toString('base64url');
    expect(() => verifyToken(`${header}.${fakePayload}.${signature}`)).toThrow();
  });

  test('rejects a token signed with a different secret', () => {
    const forged = jwt.sign(USER, 'some-other-secret', {
      algorithm: 'HS256', issuer: 'hustlehub-api', audience: 'hustlehub-client', expiresIn: '1h',
    });
    expect(() => verifyToken(forged)).toThrow();
  });

  test('rejects an expired token', () => {
    const expired = jwt.sign(
      { ...USER, exp: Math.floor(Date.now() / 1000) - 60 },
      SECRET,
      { algorithm: 'HS256', issuer: 'hustlehub-api', audience: 'hustlehub-client' }
    );
    expect(() => verifyToken(expired)).toThrow(jwt.TokenExpiredError);
  });

  test('rejects a token with the wrong issuer or audience', () => {
    const wrongIssuer = jwt.sign(USER, SECRET, {
      algorithm: 'HS256', issuer: 'someone-else', audience: 'hustlehub-client', expiresIn: '1h',
    });
    const wrongAudience = jwt.sign(USER, SECRET, {
      algorithm: 'HS256', issuer: 'hustlehub-api', audience: 'another-app', expiresIn: '1h',
    });
    expect(() => verifyToken(wrongIssuer)).toThrow();
    expect(() => verifyToken(wrongAudience)).toThrow();
  });

  test('rejects an unsigned token that uses the "none" algorithm', () => {
    const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(JSON.stringify({
      ...USER, role: 'admin', iss: 'hustlehub-api', aud: 'hustlehub-client',
      exp: Math.floor(Date.now() / 1000) + 3600,
    })).toString('base64url');
    expect(() => verifyToken(`${header}.${payload}.`)).toThrow();
  });
});