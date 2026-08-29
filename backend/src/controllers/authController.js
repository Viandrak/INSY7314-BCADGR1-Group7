const { createUser, findUserByEmail } = require('../models/userModel');
const { hashPassword, comparePassword } = require('../services/passwordService');
const { generateToken } = require('../services/jwtService');
const { sendSuccess, sendError } = require('../utils/responseHandler');

async function register(req, res) {
  const { email, password, role } = req.body;

  if (!email || !password || !role) {
    return sendError(res, 400, 'Email, password, and role are required.');
  }

  const existingUser = findUserByEmail(email);
  if (existingUser) {
    return sendError(res, 409, 'An account with this email already exists.');
  }

  const id = Date.now().toString();

  try {
    const passwordHash = await hashPassword(password);
    const newUser = createUser({ id, email, passwordHash, role });

    return sendSuccess(res, 201, 'User registered successfully.', {
      user: { id: newUser.id, email: newUser.email, role: newUser.role },
    });
  } catch (err) {
    return sendError(res, 500, 'An unexpected error occurred during registration.');
  }
}

async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return sendError(res, 400, 'Email and password are required.');
  }

  const user = findUserByEmail(email);
  if (!user) {
    return sendError(res, 401, 'Invalid email or password.');
  }

  try {
    const passwordMatches = await comparePassword(password, user.passwordHash);
    if (!passwordMatches) {
      return sendError(res, 401, 'Invalid email or password.');
    }

    const token = generateToken(user);

    return sendSuccess(res, 200, 'Login successful.', {
      token,
      user: { id: user.id, email: user.email, role: user.role },
    });
  } catch (err) {
    return sendError(res, 500, 'An unexpected error occurred during login.');
  }
}

module.exports = { register, login };