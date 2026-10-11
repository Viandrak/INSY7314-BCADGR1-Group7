const { sendError } = require('../utils/responseHandler');

// Rejects a request if its body contains any field not on the allowed list.
// Stops mass-assignment attempts (e.g. { "role": "admin" } or a made-up
// "freelancer" field) before validation or the controller see the request.
function allowFields(allowedFields) {
  return (req, res, next) => {
    if (!req.body || typeof req.body !== 'object') {
      return next();
    }

    const unexpectedFields = Object.keys(req.body).filter(
      (key) => !allowedFields.includes(key)
    );

    if (unexpectedFields.length > 0) {
      return sendError(
        res,
        400,
        `Unexpected field(s) in request: ${unexpectedFields.join(', ')}.`
      );
    }

    next();
  };
}

module.exports = { allowFields };