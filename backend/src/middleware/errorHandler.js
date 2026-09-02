function notFoundHandler(req, res) {
  return res.status(404).json({
    success: false,
    message: 'The requested resource was not found.',
  });
}

function centralErrorHandler(err, req, res, next) {
  console.error(err.stack || err);

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      success: false,
      message: 'Malformed JSON in request body.',
    });
  }

  const statusCode = Number.isInteger(err.statusCode) ? err.statusCode : 500;
  const message = statusCode === 500
    ? 'An unexpected error occurred. Please try again later.'
    : err.message || 'An error occurred while processing your request.';

  return res.status(statusCode).json({
    success: false,
    message,
  });
}

module.exports = { notFoundHandler, centralErrorHandler };