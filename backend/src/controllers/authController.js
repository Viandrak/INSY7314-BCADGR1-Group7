const User = require('../models/userModel');
const RevokedToken = require('../models/revokedTokenModel');
const { hashPassword, comparePassword } = require('../services/passwordService');
const { generateToken } = require('../services/jwtService');
const {
  MAX_FAILED_ATTEMPTS,
  isLocked,
  lockHasExpired,
  registerFailedAttempt,
  resetFailedAttempts,
  getDummyHash,
} = require('../services/lockoutService');
const { recordAuditEvent } = require('../services/auditService');
const { logger, logServerError } = require('../utils/logger');
const { sendSuccess, sendError } = require('../utils/responseHandler');

// One message for every failed login: wrong password, unknown email and locked
// account all look the same, so an attacker cannot tell which emails are
// registered or which accounts are locked.
const INVALID_LOGIN_MESSAGE = 'Invalid email or password.';

async function register(req, res) {
  const { email, password, role } = req.body;

  if (!email || !password || !role) {
    return sendError(res, 400, 'Email, password, and role are required.');
  }

  try {
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      logger.warn('auth.register.duplicate', { ip: req.ip });
      return sendError(res, 409, 'An account with this email already exists.');
    }

    const passwordHash = await hashPassword(password);
    const newUser = await User.create({ email, passwordHash, role });

    logger.info('auth.register.success', { userId: newUser.id, role: newUser.role, ip: req.ip });

    return sendSuccess(res, 201, 'User registered successfully.', {
      user: { id: newUser.id, email: newUser.email, role: newUser.role },
    });
  } catch (err) {
    // 11000 is MongoDB's duplicate key error, raised by the unique email index
    // if two registrations with the same email arrive at the same time.
    if (err.code === 11000) {
      return sendError(res, 409, 'An account with this email already exists.');
    }
    logServerError('auth.register.error', err);
    return sendError(res, 500, 'An unexpected error occurred during registration.');
  }
}

async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return sendError(res, 400, 'Email and password are required.');
  }

  try {
    // passwordHash is excluded by default, so request it only here to verify the password
    const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');

    // Unknown email: still do a full bcrypt comparison, so the response takes
    // as long as it does for a real account
    if (!user) {
      await comparePassword(password, await getDummyHash());
      logger.warn('auth.login.failed', { reason: 'unknown email', email, ip: req.ip });
      await recordAuditEvent({
        event: 'login_failure',
        email,
        ip: req.ip,
        details: 'Unknown email',
      });
      return sendError(res, 401, INVALID_LOGIN_MESSAGE);
    }

    // Locked account: the password is checked anyway (and the result ignored)
    // so the timing matches, and the attempt does not extend the lock. Even
    // the correct password is refused until the lock ends.
    if (isLocked(user)) {
      await comparePassword(password, user.passwordHash);
      logger.warn('auth.login.blocked', { reason: 'account locked', userId: user.id, ip: req.ip });
      await recordAuditEvent({
        event: 'login_failure',
        user: user.id,
        email: user.email,
        ip: req.ip,
        details: 'Account is locked',
      });
      return sendError(res, 401, INVALID_LOGIN_MESSAGE);
    }

    // A lock that has run out is cleared, so counting starts again from zero
    if (lockHasExpired(user)) {
      await resetFailedAttempts(user._id);
      user.failedLoginAttempts = 0;
      user.lockUntil = null;
    }

    const passwordMatches = await comparePassword(password, user.passwordHash);
    if (!passwordMatches) {
      const result = await registerFailedAttempt(user);
      logger.warn('auth.login.failed', {
        reason: 'wrong password',
        userId: user.id,
        email: user.email,
        attempts: result.attempts,
        ip: req.ip,
      });
      await recordAuditEvent({
        event: 'login_failure',
        user: user.id,
        email: user.email,
        ip: req.ip,
        details: `Wrong password (attempt ${result.attempts} of ${MAX_FAILED_ATTEMPTS})`,
      });

      if (result.locked) {
        logger.warn('auth.account.locked', {
          userId: user.id,
          email: user.email,
          lockUntil: result.lockUntil,
          ip: req.ip,
        });
        await recordAuditEvent({
          event: 'account_locked',
          user: user.id,
          email: user.email,
          ip: req.ip,
          details: `Locked after ${MAX_FAILED_ATTEMPTS} failed logins`,
        });
      }

      return sendError(res, 401, INVALID_LOGIN_MESSAGE);
    }

    // A correct password starts the count again
    if (user.failedLoginAttempts > 0 || user.lockUntil) {
      await resetFailedAttempts(user._id);
    }

    const token = generateToken(user);

    logger.info('auth.login.success', { userId: user.id, role: user.role, ip: req.ip });
    await recordAuditEvent({
      event: 'login_success',
      user: user.id,
      email: user.email,
      ip: req.ip,
    });

    return sendSuccess(res, 200, 'Login successful.', {
      token,
      user: { id: user.id, email: user.email, role: user.role },
    });
  } catch (err) {
    logServerError('auth.login.error', err);
    return sendError(res, 500, 'An unexpected error occurred during login.');
  }
}

// Revokes the token that was used for this request. Only the token's unique ID
// and its expiry time are stored. Using the token again is refused by the
// authenticate middleware, even though its signature is still valid.
async function logout(req, res) {
  try {
    const { jti, exp, id, role } = req.user;

    // An upsert, so a repeated or simultaneous logout never fails
    await RevokedToken.updateOne(
      { jti },
      { $setOnInsert: { expiresAt: new Date(exp * 1000) } },
      { upsert: true }
    );

    logger.info('auth.logout', { userId: id, role, ip: req.ip });
    await recordAuditEvent({ event: 'logout', user: id, ip: req.ip });

    return sendSuccess(res, 200, 'Logged out successfully.');
  } catch (err) {
    logServerError('auth.logout.error', err);
    return sendError(res, 500, 'An unexpected error occurred during logout.');
  }
}

module.exports = { register, login, logout };