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
function createLimiter({ windowMs, limit, message, keyGenerator }) {
  const options = {
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
  };

  // By default requests are counted per IP address; a custom key
  // generator can count them per user instead.
  if (keyGenerator) {
    options.keyGenerator = keyGenerator;
  }

  return rateLimit(options);
}

// Login and registration: 10 attempts per IP every 15 minutes.
// Limits brute-force password guessing and mass account creation.
const authLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: 'Too many authentication attempts. Please try again later.',
});

// Bookings: 5 per user every 15 minutes.
// Counted per authenticated user (from the verified JWT), so one account
// cannot flood the system with bookings and transaction records.
// Must run after the authenticate middleware.
const bookingLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  message: 'Too many booking requests. Please wait before making another booking.',
  keyGenerator: (req) => `user:${req.user.id}`,
});

module.exports = { authLimiter, bookingLimiter };