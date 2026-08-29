const express = require('express');
const { authenticate } = require('../middleware/authMiddleware');
const { sendSuccess } = require('../utils/responseHandler');

const router = express.Router();

router.get('/test', authenticate, (req, res) => {
  return sendSuccess(res, 200, 'Access granted to protected route.', {
    user: req.user,
  });
});

module.exports = router;