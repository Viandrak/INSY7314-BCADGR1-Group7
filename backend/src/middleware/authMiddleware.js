const { verifyToken } = require('../services/jwtService');
const RevokedToken = require('../models/revokedTokenModel');
const { sendError } = require('../utils/responseHandler');
const { logger, logServerError } = require('../utils/logger');

async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    logger.warn('auth.token.rejected', { reason: 'missing or malformed', ip: req.ip, path: req.originalUrl.split('?')[0] });
    return sendError(res, 401, 'Authentication token missing or malformed.');
  }

  const token = authHeader.split(' ')[1];

  let decoded;
  try {
    decoded = verifyToken(token);
  } catch (err) {
    logger.warn('auth.token.rejected', { reason: 'invalid or expired', ip: req.ip, path: req.originalUrl.split('?')[0] });
    return sendError(res, 401, 'Invalid or expired token.');
  }

  // Every token the API issues has a unique ID. A token without one was not
  // issued by this version of the API, so it is not trusted.
  if (typeof decoded.jti !== 'string' || decoded.jti === '') {
    logger.warn('auth.token.rejected', { reason: 'no token id', ip: req.ip });
    return sendError(res, 401, 'Invalid or expired token.');
  }

  try {
    // Logout puts the token's ID on a blacklist. A valid signature is not enough.
    const revoked = await RevokedToken.exists({ jti: decoded.jti });
    if (revoked) {
      logger.warn('auth.token.revoked_reuse', { userId: decoded.id, ip: req.ip, path: req.originalUrl.split('?')[0] });
      return sendError(res, 401, 'Invalid or expired token.');
    }
  } catch (err) {
    // If the blacklist cannot be checked, the request is refused rather than allowed
    logServerError('auth.blacklist.lookup_failed', err);
    return sendError(res, 500, 'An unexpected error occurred. Please try again later.');
  }

  req.user = decoded; // { id, role, jti, exp, ... }
  next();
}

module.exports = { authenticate };