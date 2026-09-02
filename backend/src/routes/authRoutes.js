const express = require('express');
const { register, login } = require('../controllers/authController');
const {
  registerValidationRules,
  loginValidationRules,
  handleValidationErrors,
} = require('../middleware/validationMiddleware');

const router = express.Router();

router.post('/register', registerValidationRules, handleValidationErrors, register);
router.post('/login', loginValidationRules, handleValidationErrors, login);

module.exports = router;