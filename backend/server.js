const express = require('express');
require('dotenv').config();
const cors = require('cors');
const helmet = require('helmet');
const fs = require('fs');
const https = require('https');
const authRoutes = require('./src/routes/authRoutes');
const protectedRoutes = require('./src/routes/protectedRoutes');
const gigRoutes = require('./src/routes/gigRoutes');
const bookingRoutes = require('./src/routes/bookingRoutes');
const incomeRoutes = require('./src/routes/incomeRoutes');
const { notFoundHandler, centralErrorHandler } = require('./src/middleware/errorHandler');
const { sanitizeInput } = require('./src/middleware/sanitizeMiddleware');
const { connectDB } = require('./src/config/database');
const adminRoutes = require('./src/routes/adminRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Core middleware
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

// Security headers, including a Content Security Policy.
// The API only returns JSON, so the policy is kept strict.
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

app.use('/api/admin', adminRoutes);

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
 * 
 * GeeksforGeeks, 2020. Node.Js securing apps with helmet.Js. GeeksforGeeks. [Online]  Available at: https://www.geeksforgeeks.org/node-js/node-js-securing-apps-with-helmet-js/ [Accessed 8 Oct. 2026].
 * 
 * GeeksforGeeks, 2024. What is the purpose of the expressvalidator middleware in express JS? GeeksforGeeks. [Online] Available at: https://www.geeksforgeeks.org/node-js/what-is-the-purpose-of-the-express-validator-middleware-in-express-js/ [Accessed 11 Oct. 2026].
 * 
 * GeeksforGeeks, 2024. How to use Newman with postman ? GeeksforGeeks. [Online]  Available at: https://www.geeksforgeeks.org/node-js/how-to-use-newman-with-postman/ [Accessed 11 Oct. 2026].
 */