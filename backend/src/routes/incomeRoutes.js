const express = require('express');
const { authenticate } = require('../middleware/authMiddleware');
const { getIncomeSummary } = require('../controllers/incomeController');

const router = express.Router();

// Income summary currently requires authentication.
// Freelancer-only role enforcement will be added by P2's RBAC middleware.
router.get('/summary', authenticate, getIncomeSummary);

module.exports = router;