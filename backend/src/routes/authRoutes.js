const express = require('express');
const { register, login } = require('../controllers/authController');
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

module.exports = router;