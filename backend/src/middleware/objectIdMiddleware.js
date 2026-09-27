const { sendError } = require('../utils/responseHandler');

// MongoDB ObjectIds are exactly 24 hexadecimal characters
const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;

function isValidObjectId(value) {
  return typeof value === 'string' && OBJECT_ID_PATTERN.test(value);
}

// Rejects malformed IDs in the URL before they reach the database,
// returning a clear 400 instead of an unexpected server error.
function validateObjectId(paramName = 'id') {
  return (req, res, next) => {
    if (!isValidObjectId(req.params[paramName])) {
      return sendError(res, 400, 'Invalid ID format.');
    }
    next();
  };
}

module.exports = { validateObjectId, isValidObjectId };