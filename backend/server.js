require('dotenv').config();

const app = require('./app');
const { connectDB } = require('./src/config/database');
const { createServer, isHttpsEnabled } = require('./src/config/createServer');

const PORT = process.env.PORT || 5000;

// HTTPS is on by default. Set USE_HTTPS=false (for example in Docker, where
// there are no local certificates) to serve plain HTTP instead.
const useHttps = isHttpsEnabled(process.env.USE_HTTPS);

// Connect to MongoDB first (with retries), then start listening
async function startServer() {
  try {
    // Built before connecting so missing certificates fail fast
    const server = createServer(app, useHttps);

    await connectDB();
    server.listen(PORT, () => {
      const protocol = useHttps ? 'https' : 'http';
      console.log(`HustleHub+ API running at ${protocol}://localhost:${PORT}`);
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
 * GitHub, 2026. Concepts for CodeQL. [Online] Available at: https://docs.github.com/en/code-security/concepts/code-scanning/codeql [Accessed 28 October 2026].
 *
 * Microsoft, 2026a. What is DevSecOps? [Online] Available at: https://www.microsoft.com/en-us/security/business/security-101/what-is-devsecops [Accessed 28 October 2026].
 *
 * Microsoft, 2026b. Rate Limiting pattern. [Online] Available at: https://learn.microsoft.com/en-us/azure/architecture/patterns/rate-limiting-pattern [Accessed 29 October 2026].
 *
 * OpenAI, 2026. ChatGPT. OpenAI. [Online] Available at: https://chatgpt.com/share/6ae259e2-e664-83e9-b664-0961b7d8dfae [Accessed 28 October 2026].
 *
 * OWASP Foundation, 2021. A03:2021 – Injection. [Online] Available at: https://owasp.org/Top10/2021/A03_2021-Injection/ [Accessed 29 October 2026].
 *
 * OWASP Foundation, 2025. A03:2025 – Software Supply Chain Failures. [Online] Available at: https://owasp.org/Top10/2025/A03_2025-Software_Supply_Chain_Failures/ [Accessed 29 October 2026].
 */