const crypto = require('crypto');
const { createUser } = require('../models/userModel');

// Temporary placeholder hash — NOT secure for production.
// Person 2 will replace this with proper bcrypt hashing and salting.
function tempHashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function register(req, res) {
  const { email, password, role } = req.body;

  if (!email || !password || !role) {
    return res.status(400).json({ error: 'Email, password, and role are required.' });
  }

  const id = Date.now().toString();
  const passwordHash = tempHashPassword(password);

  const newUser = createUser({ id, email, passwordHash, role });

  return res.status(201).json({
    message: 'User registered successfully.',
    user: { id: newUser.id, email: newUser.email, role: newUser.role },
  });
}

module.exports = { register };