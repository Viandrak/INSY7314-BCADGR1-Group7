const { logger, logServerError } = require('../utils/logger');

function notFoundHandler(req, res) {
  return res.status(404).json({
    success: false,
    message: 'The requested resource was not found.',
  });
}

function centralErrorHandler(err, req, res, _next) {
  const statusCode = Number.isInteger(err.statusCode) ? err.statusCode : 500;
  const requestInfo = { method: req.method, path: (req.originalUrl || '').split('?')[0] };


  if (statusCode >= 500 && err.type !== 'entity.parse.failed') {
    logServerError('request.error', err, requestInfo);
  } else {
    logger.warn('request.rejected', { ...requestInfo, status: statusCode, reason: err.message });
  }

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      success: false,
      message: 'Malformed JSON in request body.',
    });
  }

  const message = statusCode === 500
    ? 'An unexpected error occurred. Please try again later.'
    : err.message || 'An error occurred while processing your request.';

  return res.status(statusCode).json({
    success: false,
    message,
  });
}

module.exports = { notFoundHandler, centralErrorHandler };