const express = require('express');
const { register } = require('../controllers/authController');

const router = express.Router();

router.post('/register', register);

// Person 2 will add: router.post('/login', login);

module.exports = router;