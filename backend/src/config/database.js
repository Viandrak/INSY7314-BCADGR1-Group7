const dns = require('dns');
const mongoose = require('mongoose');

// Use public DNS servers for the SRV lookup that mongodb+srv:// connection
// strings require. Some Windows networks refuse this lookup through the
// default resolver (querySrv ECONNREFUSED).
dns.setServers(['8.8.8.8', '1.1.1.1']);

async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('MONGODB_URI is not set. Add it to your .env file.');
  }

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000,
    family: 4, // Force IPv4, which avoids connection issues on some networks
  });
  console.log('Connected to MongoDB');
}

module.exports = { connectDB };