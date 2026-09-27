const express = require('express');
const { authenticate } = require('../middleware/authMiddleware');
const { createGig } = require('../controllers/gigController');

const router = express.Router();

// Gig creation currently requires authentication.
// Freelancer-only role enforcement will be added by P2's RBAC middleware.
router.post('/', authenticate, createGig);

module.exports = router;