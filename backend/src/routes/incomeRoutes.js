const express = require('express');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/rbacMiddleware');
const { getIncomeSummary } = require('../controllers/incomeController');

const router = express.Router();

router.get('/summary', authenticate, authorize('freelancer'), getIncomeSummary);

module.exports = router;