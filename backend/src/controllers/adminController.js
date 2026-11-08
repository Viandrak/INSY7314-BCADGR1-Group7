const User = require('../models/userModel');
const Gig = require('../models/gigModel');
const Booking = require('../models/bookingModel');
const AuditLog = require('../models/auditLogModel');
const { resetFailedAttempts } = require('../services/lockoutService');
const { recordAuditEvent } = require('../services/auditService');
const { logger, logServerError } = require('../utils/logger');
const { sendSuccess, sendError } = require('../utils/responseHandler');

async function getAllUsers(req, res) {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    return sendSuccess(res, 200, 'Users retrieved successfully.', {
      count: users.length,
      users,
    });
  } catch (err) {
    logServerError('admin.users.error', err);
    return sendError(res, 500, 'An unexpected error occurred while retrieving users.');
  }
}

async function getAllGigsAdmin(req, res) {
  try {
    const gigs = await Gig.find()
      .populate('freelancer', 'email role')
      .sort({ createdAt: -1 });
    return sendSuccess(res, 200, 'Gigs retrieved successfully.', {
      count: gigs.length,
      gigs,
    });
  } catch (err) {
    logServerError('admin.gigs.error', err);
    return sendError(res, 500, 'An unexpected error occurred while retrieving gigs.');
  }
}

async function getAllBookingsAdmin(req, res) {
  try {
    const bookings = await Booking.find()
      .populate('client', 'email')
      .populate('freelancer', 'email')
      .sort({ createdAt: -1 });
    return sendSuccess(res, 200, 'Bookings retrieved successfully.', {
      count: bookings.length,
      bookings,
    });
  } catch (err) {
    logServerError('admin.bookings.error', err);
    return sendError(res, 500, 'An unexpected error occurred while retrieving bookings.');
  }
}

// Lets an admin end an account lock early. Resets the failed login count and
// the lock time, and records who did it.
async function unlockUser(req, res) {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return sendError(res, 404, 'User not found.');
    }

    await resetFailedAttempts(user._id);

    logger.info('admin.account.unlocked', { adminId: req.user.id, userId: user.id, email: user.email });
    await recordAuditEvent({
      event: 'account_unlocked',
      user: user.id,
      email: user.email,
      actor: req.user.id,
      ip: req.ip,
      details: 'Unlocked by an admin',
    });

    return sendSuccess(res, 200, 'Account unlocked successfully.');
  } catch (err) {
    logServerError('admin.unlock.error', err);
    return sendError(res, 500, 'An unexpected error occurred while unlocking the account.');
  }
}

// The newest security events first. Admin only.
async function getAuditLogs(req, res) {
  const limit = req.query.limit ? parseInt(req.query.limit, 10) : 100;

  try {
    const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(limit);
    return sendSuccess(res, 200, 'Audit log retrieved successfully.', {
      count: logs.length,
      logs,
    });
  } catch (err) {
    logServerError('admin.auditlog.error', err);
    return sendError(res, 500, 'An unexpected error occurred while retrieving the audit log.');
  }
}

module.exports = { getAllUsers, getAllGigsAdmin, getAllBookingsAdmin, unlockUser, getAuditLogs };