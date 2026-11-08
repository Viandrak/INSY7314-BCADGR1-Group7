const mongoose = require('mongoose');
const AuditLog = require('../models/auditLogModel');
const { logger } = require('../utils/logger');

// Cuts a value down to the length the audit log schema allows
function limit(value, max) {
  return typeof value === 'string' ? value.slice(0, max) : null;
}

// Saves a security event to the audit log. It never throws: a problem with the
// audit log must not break the login, logout or request that triggered it, so
// failures are only logged. Nothing is written while the database is not
// connected, which also keeps the unit tests from waiting on MongoDB.
async function recordAuditEvent({ event, user, email, actor, ip, method, path, details }) {
  if (mongoose.connection.readyState !== 1) {
    logger.warn('audit.skipped', { event, reason: 'database not connected' });
    return;
  }

  try {
    await AuditLog.create({
      event,
      user: user || null,
      email: limit(email, 254),
      actor: actor || null,
      ip: limit(ip, 64),
      method: limit(method, 10),
      path: limit(path, 200),
      details: limit(details, 300),
    });
  } catch (err) {
    logger.error('audit.write.failed', { event, error: err.message });
  }
}

// A request was refused with 403 (wrong role, or someone else's record).
// Logged to the cloud platform and recorded in the audit log.
function recordAccessDenied(req, details) {
  const path = (req.originalUrl || '').split('?')[0];
  const userId = req.user && req.user.id;

  logger.warn('access.denied', {
    userId,
    role: req.user && req.user.role,
    method: req.method,
    path,
    details,
  });

  return recordAuditEvent({
    event: 'access_denied',
    user: userId,
    ip: req.ip,
    method: req.method,
    path,
    details,
  });
}

module.exports = { recordAuditEvent, recordAccessDenied };