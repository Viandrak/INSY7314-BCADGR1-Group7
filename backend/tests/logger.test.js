const { Writable } = require('stream');
const winston = require('winston');
const { logger, logServerError, cloudLoggingEnabled } = require('../src/utils/logger');

// Collects what the logger would write, so the tests can inspect the final log line
function captureLogs() {
  const lines = [];
  const sink = new Writable({
    write(chunk, _encoding, done) {
      lines.push(JSON.parse(chunk.toString()));
      done();
    },
  });
  const transport = new winston.transports.Stream({ stream: sink });
  logger.add(transport);
  return { lines, stop: () => logger.remove(transport) };
}

describe('Logger', () => {
  test('writes events as JSON with a timestamp and service name', () => {
    const capture = captureLogs();
    logger.info('auth.login.success', { userId: 'abc123' });
    capture.stop();
    expect(capture.lines[0]).toMatchObject({
      level: 'info',
      message: 'auth.login.success',
      userId: 'abc123',
      service: 'hustlehub-api',
    });
    expect(capture.lines[0].timestamp).toEqual(expect.any(String));
  });

  test('never logs passwords, hashes or tokens, even when they are passed in', () => {
    const capture = captureLogs();
    logger.info('test.event', {
      email: 'a@b.com',
      password: 'Secret123',
      passwordHash: '$2b$10$abcdef',
      token: 'eyJhbGciOi',
      authorization: 'Bearer eyJhbGciOi',
      nested: { jwt: 'eyJ', safe: 'visible' },
    });
    capture.stop();
    const text = JSON.stringify(capture.lines[0]);
    expect(text).not.toContain('Secret123');
    expect(text).not.toContain('$2b$10$abcdef');
    expect(text).not.toContain('eyJhbGciOi');
    expect(capture.lines[0].email).toBe('a@b.com');
    expect(capture.lines[0].nested.safe).toBe('visible');
    expect(capture.lines[0].password).toBe('[REDACTED]');
  });

  test('logServerError records the message and stack at error level', () => {
    const capture = captureLogs();
    logServerError('request.error', new Error('boom'), { path: '/x' });
    capture.stop();
    expect(capture.lines[0].level).toBe('error');
    expect(capture.lines[0].error).toBe('boom');
    expect(capture.lines[0].stack).toContain('boom');
    expect(capture.lines[0].path).toBe('/x');
  });

  test('does not send logs to the cloud when no Better Stack settings exist', () => {
    expect(cloudLoggingEnabled).toBe(false);
  });
});