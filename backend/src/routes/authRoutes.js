const express = require('express');
const { register, login, logout } = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');
const {
  registerValidationRules,
  loginValidationRules,
  handleValidationErrors,
} = require('../middleware/validationMiddleware');
const { allowFields } = require('../middleware/allowlistMiddleware');
const { authLimiter } = require('../middleware/rateLimitMiddleware');

const router = express.Router();

router.post(
  '/register',
  authLimiter,
  allowFields(['email', 'password', 'role']),
  registerValidationRules,
  handleValidationErrors,
  register
);
router.post(
  '/login',
  authLimiter,
  allowFields(['email', 'password']),
  loginValidationRules,
  handleValidationErrors,
  login
);

// Logout needs a valid token, because it is that token that gets revoked.
// It takes no body, so the allowlist rejects any extra field.
router.post('/logout', authenticate, allowFields([]), logout);

module.exports = router;