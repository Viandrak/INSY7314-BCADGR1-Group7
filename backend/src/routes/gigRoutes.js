const express = require('express');
const { authenticate } = require('../middleware/authMiddleware');
const { createGig, getAllGigs, getGigById } = require('../controllers/gigController');

const router = express.Router();

// All gig routes currently require authentication.
// Role-based restrictions will be added by P2's RBAC middleware.
router.post('/', authenticate, createGig);
router.get('/', authenticate, getAllGigs);
router.get('/:id', authenticate, getGigById);

module.exports = router;