const rateLimit = require('express-rate-limit');

// Works out how many seconds remain until the client's limit resets
function secondsUntilReset(req, windowMs) {
  const resetTime = req.rateLimit && req.rateLimit.resetTime;
  if (resetTime instanceof Date) {
    return Math.max(1, Math.ceil((resetTime.getTime() - Date.now()) / 1000));
  }
  return Math.ceil(windowMs / 1000);
}

// Builds a rate limiter that returns a clear, consistent 429 response
function createLimiter({ windowMs, limit, message }) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-7', // Sends RateLimit headers so clients can see their remaining requests
    legacyHeaders: false,       // Disables the older X-RateLimit-* headers
    handler: (req, res) => {
      const retryAfterSeconds = secondsUntilReset(req, windowMs);
      res.set('Retry-After', String(retryAfterSeconds));
      return res.status(429).json({
        success: false,
        message,
        retryAfterSeconds,
      });
    },
  });
}

// Login and registration: 10 attempts per IP every 15 minutes.
// Limits brute-force password guessing and mass account creation.
const authLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: 'Too many authentication attempts. Please try again later.',
});

module.exports = { authLimiter };