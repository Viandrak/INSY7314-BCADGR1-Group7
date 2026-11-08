jest.mock('../src/models/auditLogModel', () => ({ create: jest.fn() }));
// A stand-in for the database connection, so each test can say whether MongoDB is connected
jest.mock('mongoose', () => ({ connection: { readyState: 0 } }));

const mongoose = require('mongoose');
const AuditLog = require('../src/models/auditLogModel');
const { recordAuditEvent, recordAccessDenied } = require('../src/services/auditService');

function setDatabaseConnected(connected) {
  mongoose.connection.readyState = connected ? 1 : 0;
}

describe('Audit service', () => {
  test('saves the event when the database is connected', async () => {
    setDatabaseConnected(true);
    AuditLog.create.mockResolvedValue({});
    await recordAuditEvent({ event: 'logout', user: 'u1', ip: '127.0.0.1' });
    expect(AuditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ event: 'logout', user: 'u1', ip: '127.0.0.1', actor: null })
    );
  });

  test('writes nothing while the database is not connected', async () => {
    setDatabaseConnected(false);
    await recordAuditEvent({ event: 'logout' });
    expect(AuditLog.create).not.toHaveBeenCalled();
  });

  test('never throws, even when the write fails', async () => {
    setDatabaseConnected(true);
    AuditLog.create.mockRejectedValue(new Error('write failed'));
    await expect(recordAuditEvent({ event: 'logout' })).resolves.toBeUndefined();
  });

  test('cuts over-long values down to the size the schema allows', async () => {
    setDatabaseConnected(true);
    AuditLog.create.mockResolvedValue({});
    await recordAuditEvent({ event: 'access_denied', details: 'x'.repeat(1000), path: '/'.repeat(500) });
    const saved = AuditLog.create.mock.calls[0][0];
    expect(saved.details).toHaveLength(300);
    expect(saved.path).toHaveLength(200);
  });

  test('a refused request is recorded as access_denied without its query string', async () => {
    setDatabaseConnected(true);
    AuditLog.create.mockResolvedValue({});
    await recordAccessDenied(
      { user: { id: 'u1', role: 'client' }, method: 'GET', originalUrl: '/api/admin/users?secret=1', ip: '::1' },
      'Role not allowed'
    );
    expect(AuditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ event: 'access_denied', user: 'u1', path: '/api/admin/users', method: 'GET' })
    );
  });
});