const express = require('express');
require('dotenv').config();
const fs = require('fs');
const https = require('https');
const authRoutes = require('./src/routes/authRoutes');
const protectedRoutes = require('./src/routes/protectedRoutes');

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

// Protected routes
app.use('/api/protected', protectedRoutes);

// SSL certificate options
const sslOptions = {
  key: fs.readFileSync('./certs/localhost-key.pem'),
  cert: fs.readFileSync('./certs/localhost.pem'),
};

https.createServer(sslOptions, app).listen(PORT, () => {
  console.log(`HustleHub+ API running securely at https://localhost:${PORT}`);
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
 * 
 * Auth0 (n.d.) jsonwebtoken. [Online] Available at: https://www.npmjs.com/package/jsonwebtoken [Accessed: 30 August 2026].
 * 
 * Express.js (n.d.) Express – Node.js web application framework. [Online] Available at: https://expressjs.com/ [Accessed: 30 August 2026].
 * 
 * Internet Engineering Task Force (2015) RFC 7519: JSON Web Token (JWT). [Online] Available at: https://datatracker.ietf.org/doc/html/rfc7519 [Accessed: 30 August 2026].
 * 
 * JWT.io (n.d.) Introduction to JSON Web Tokens. [Online] Available at: https://jwt.io/introduction [Accessed: 30 August 2026].
 * 
 * Node.js Foundation (n.d.) HTTPS | Node.js documentation. [Online] Available at: https://nodejs.org/api/https.html [Accessed: 30 August 2026].
 * 
 * npm, Inc. (n.d.) bcrypt. [Online] Available at: https://www.npmjs.com/package/bcrypt [Accessed: 30 August 2026].
 * 
 * OpenAI, 2026. ChatGPT. OpenAI. [Online] Available at: https://chatgpt.com/share/6a92ee02-acf0-83ea-8425-9488bd50c506 [Accessed 27 August 2026].
 */