const { verifyToken } = require('../services/jwtService');
const { sendError } = require('../utils/responseHandler');

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(res, 401, 'Authentication token missing or malformed.');
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyToken(token);
    req.user = decoded; // { id, role }
    next();
  } catch (err) {
    return sendError(res, 401, 'Invalid or expired token.');
  }
}

module.exports = { authenticate };