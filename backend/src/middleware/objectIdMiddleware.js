const { sendError } = require('../utils/responseHandler');

// MongoDB ObjectIds are exactly 24 hexadecimal characters
const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;

// Rejects malformed IDs in the URL before they reach the database,
// returning a clear 400 instead of an unexpected server error.
function validateObjectId(paramName = 'id') {
  return (req, res, next) => {
    const value = req.params[paramName];

    if (typeof value !== 'string' || !OBJECT_ID_PATTERN.test(value)) {
      return sendError(res, 400, 'Invalid ID format.');
    }

    next();
  };
}

module.exports = { validateObjectId };