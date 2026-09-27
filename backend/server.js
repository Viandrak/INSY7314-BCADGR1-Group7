const express = require('express');
require('dotenv').config();
const fs = require('fs');
const https = require('https');
const authRoutes = require('./src/routes/authRoutes');
const protectedRoutes = require('./src/routes/protectedRoutes');
const gigRoutes = require('./src/routes/gigRoutes');
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