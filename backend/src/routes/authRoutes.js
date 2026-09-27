const express = require('express');
const { register, login } = require('../controllers/authController');
const {
  registerValidationRules,
  loginValidationRules,
  handleValidationErrors,
} = require('../middleware/validationMiddleware');
const { authLimiter } = require('../middleware/rateLimitMiddleware');

const router = express.Router();

// The rate limiter runs first, so blocked requests are rejected
// before any validation, database lookup or password hashing happens.
router.post('/register', authLimiter, registerValidationRules, handleValidationErrors, register);
router.post('/login', authLimiter, loginValidationRules, handleValidationErrors, login);

module.exports = router;