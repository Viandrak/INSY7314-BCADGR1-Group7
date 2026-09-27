const User = require('../models/userModel');
const { hashPassword, comparePassword } = require('../services/passwordService');
const { generateToken } = require('../services/jwtService');
const { sendSuccess, sendError } = require('../utils/responseHandler');

async function register(req, res) {
  const { email, password, role } = req.body;

  if (!email || !password || !role) {
    return sendError(res, 400, 'Email, password, and role are required.');
  }

  try {
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return sendError(res, 409, 'An account with this email already exists.');
    }

    const passwordHash = await hashPassword(password);
    const newUser = await User.create({ email, passwordHash, role });

    return sendSuccess(res, 201, 'User registered successfully.', {
      user: { id: newUser.id, email: newUser.email, role: newUser.role },
    });
  } catch (err) {
    // 11000 is MongoDB's duplicate key error, raised by the unique email index
    // if two registrations with the same email arrive at the same time.
    if (err.code === 11000) {
      return sendError(res, 409, 'An account with this email already exists.');
    }
    return sendError(res, 500, 'An unexpected error occurred during registration.');
  }
}

async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return sendError(res, 400, 'Email and password are required.');
  }

  try {
    // passwordHash is excluded by default, so request it only here to verify the password
    const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
    if (!user) {
      return sendError(res, 401, 'Invalid email or password.');
    }

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