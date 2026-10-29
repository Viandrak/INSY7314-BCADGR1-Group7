function notFoundHandler(req, res) {
  return res.status(404).json({
    success: false,
    message: 'The requested resource was not found.',
  });
}

// Express only treats a function as an error handler if it has four
// parameters, so _next must stay even though it is not used
function centralErrorHandler(err, req, res, _next) {
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