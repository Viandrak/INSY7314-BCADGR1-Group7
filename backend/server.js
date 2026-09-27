const express = require('express');
require('dotenv').config();
const fs = require('fs');
const https = require('https');
const authRoutes = require('./src/routes/authRoutes');
const protectedRoutes = require('./src/routes/protectedRoutes');
const gigRoutes = require('./src/routes/gigRoutes');
const bookingRoutes = require('./src/routes/bookingRoutes');
const incomeRoutes = require('./src/routes/incomeRoutes');
const { notFoundHandler, centralErrorHandler } = require('./src/middleware/errorHandler');
const { connectDB } = require('./src/config/database');

const app = express();
const PORT = process.env.PORT || 5000;

// Core middleware
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// Health check route
app.get('/', (req, res) => {
  res.json({ message: 'HustleHub+ API is running' });
});

// Auth routes
app.use('/api/auth', authRoutes);

// Protected routes
app.use('/api/protected', protectedRoutes);

// Gig routes
app.use('/api/gigs', gigRoutes);

// Booking routes
app.use('/api/bookings', bookingRoutes);

// Income routes
app.use('/api/income', incomeRoutes);

app.use(notFoundHandler);
app.use(centralErrorHandler);

// SSL certificate options
const sslOptions = {
  key: fs.readFileSync('./certs/localhost-key.pem'),
  cert: fs.readFileSync('./certs/localhost.pem'),
};

// Connect to MongoDB first, then start the HTTPS server
async function startServer() {
  try {
    await connectDB();
    https.createServer(sslOptions, app).listen(PORT, () => {
      console.log(`HustleHub+ API running securely at https://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('HustleHub+ could not start:', err.message);
    process.exit(1);
  }
}

startServer();

/*
 * References:
 *
 * express-rate-limit, 2026. express-rate-limit - Basic rate-limiting middleware for Express. [Online] Available at: https://www.npmjs.com/package/express-rate-limit [Accessed 27 September 2026].
 *
 * MongoDB, Inc., 2026. Transactions. MongoDB Manual. [Online] Available at: https://www.mongodb.com/docs/manual/core/transactions/ [Accessed 27 September 2026].
 *
 * Mongoose, 2025. Mongoose ODM documentation. [Online] Available at: https://mongoosejs.com/docs/ [Accessed 27 September 2026].
 *
 * OpenAI, 2026. ChatGPT. OpenAI. [Online] Available at: https://chatgpt.com/share/6ab80aa6-3a48-83ea-8842-6084ce8684fe [Accessed 27 September 2026].
 *
 * OWASP Foundation, 2026a. Authorization Cheat Sheet. [Online] Available at: https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html [Accessed 27 September 2026].
 *
 * OWASP Foundation, 2026b. Mass Assignment Cheat Sheet. [Online] Available at: https://cheatsheetseries.owasp.org/cheatsheets/Mass_Assignment_Cheat_Sheet.html [Accessed 27 September 2026].
 */