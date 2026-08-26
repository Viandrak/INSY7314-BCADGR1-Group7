const { createUser, findUserByEmail } = require('../models/userModel');
const { hashPassword } = require('../services/passwordService');
const { sendSuccess, sendError } = require('../utils/responseHandler');

function register(req, res) {
  const { email, password, role } = req.body;

  if (!email || !password || !role) {
    return sendError(res, 400, 'Email, password, and role are required.');
  }

  const existingUser = findUserByEmail(email);
  if (existingUser) {
    return sendError(res, 409, 'An account with this email already exists.');
  }

  const id = Date.now().toString();

  // Temporary placeholder hash — Person 2 will replace with bcrypt hashing + salting.
  const passwordHash = hashPassword(password);

  const newUser = createUser({ id, email, passwordHash, role });

  return sendSuccess(res, 201, 'User registered successfully.', {
    user: { id: newUser.id, email: newUser.email, role: newUser.role },
  });
}

// Person 2 will add: function login(req, res) { ... }

module.exports = { register };