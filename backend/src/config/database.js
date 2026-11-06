const dns = require('dns');
const mongoose = require('mongoose');

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function connectDB({ retries = 3, baseDelayMs = 1000 } = {}) {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('MONGODB_URI is not set. Add it to your .env file.');
  }

  if (uri.startsWith('mongodb+srv://')) {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
  }

  for (let attempt = 1; ; attempt += 1) {
    try {
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 10000,
        family: 4, // Force IPv4, which avoids connection issues on some networks
      });
      console.log('Connected to MongoDB');
      return;
    } catch (err) {
      if (attempt > retries) throw err;

      const delayMs = baseDelayMs * 2 ** (attempt - 1);
      console.warn(
        `MongoDB connection failed (attempt ${attempt} of ${retries + 1}). Retrying in ${delayMs} ms...`
      );
      await sleep(delayMs);
    }
  }
}

module.exports = { connectDB };