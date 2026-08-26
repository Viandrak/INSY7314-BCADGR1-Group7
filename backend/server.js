const express = require('express');
require('dotenv').config();
const authRoutes = require('./src/routes/authRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Core middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check route
app.get('/', (req, res) => {
  res.json({ message: 'HustleHub+ API is running' });
});

// Auth routes
app.use('/api/auth', authRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


/*
 * References:
 *
 * Mozilla Developer Network, 2024. HTTP response status codes.
 * [Online] Available at: https://developer.mozilla.org/en-US/docs/Web/HTTP/Status
 * [Accessed 26 August 2026].
 *
 * Motdotla, 2024. dotenv - Loads environment variables from .env file.
 * [Online] Available at: https://www.npmjs.com/package/dotenv
 * [Accessed 26 August 2026].
 *
 * OpenJS Foundation, 2024a. Express - Node.js web application framework.
 * [Online] Available at: https://expressjs.com/en/4x/api.html
 * [Accessed 26 August 2026].
 *
 * OpenJS Foundation, 2024b. Node.js Crypto module documentation.
 * [Online] Available at: https://nodejs.org/api/crypto.html
 * [Accessed 26 August 2026].
 *
 * OWASP Foundation, 2023. REST Security Cheat Sheet.
 * [Online] Available at: https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html
 * [Accessed 26 August 2026].
 */