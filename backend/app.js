const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoose = require('mongoose');
const authRoutes = require('./src/routes/authRoutes');
const protectedRoutes = require('./src/routes/protectedRoutes');
const gigRoutes = require('./src/routes/gigRoutes');
const bookingRoutes = require('./src/routes/bookingRoutes');
const incomeRoutes = require('./src/routes/incomeRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const { notFoundHandler, centralErrorHandler } = require('./src/middleware/errorHandler');
const { sanitizeInput } = require('./src/middleware/sanitizeMiddleware');
const { apiLimiter } = require('./src/middleware/rateLimitMiddleware');

// Builds and configures the Express app
const app = express();

// Core middleware
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

// The API only returns JSON, so the policy is kept strict
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'"],
      imgSrc: ["'self'", 'data:'],
      connectSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
    },
  },
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// Removes NoSQL operators and script characters from every body and query string
app.use(sanitizeInput);

// Health check route
app.get('/', (req, res) => {
  res.json({ message: 'HustleHub+ API is running' });
});

// Health endpoint for Docker and monitoring. It sits before the API rate limiter
// so frequent health checks are never blocked, and it only reports whether the
// API and its database connection are working, nothing else.
app.get('/health', (req, res) => {
  const databaseConnected = mongoose.connection.readyState === 1;
  res.status(databaseConnected ? 200 : 503).json({
    status: databaseConnected ? 'ok' : 'unavailable',
  });
});

// General rate limit for every API route
app.use('/api', apiLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/protected', protectedRoutes);
app.use('/api/gigs', gigRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/income', incomeRoutes);
app.use('/api/admin', adminRoutes);

app.use(notFoundHandler);
app.use(centralErrorHandler);

module.exports = app;