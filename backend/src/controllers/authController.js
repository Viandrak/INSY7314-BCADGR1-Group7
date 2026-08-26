const { createUser, findUserByEmail } = require('../models/userModel');
const { hashPassword } = require('../services/passwordService');

function register(req, res) {
  const { email, password, role } = req.body;

  if (!email || !password || !role) {
    return res.status(400).json({ error: 'Email, password, and role are required.' });
  }

  const existingUser = findUserByEmail(email);
  if (existingUser) {
    return res.status(409).json({ error: 'An account with this email already exists.' });
  }

  const id = Date.now().toString();

  // Temporary placeholder hash — Person 2 will replace with bcrypt hashing + salting.
  const passwordHash = hashPassword(password);

  const newUser = createUser({ id, email, passwordHash, role });

  return res.status(201).json({
    message: 'User registered successfully.',
    user: { id: newUser.id, email: newUser.email, role: newUser.role },
  });
}

module.exports = { register };