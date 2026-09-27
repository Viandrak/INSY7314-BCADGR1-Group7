const express = require('express');
const { authenticate } = require('../middleware/authMiddleware');
const {
  createGig,
  getAllGigs,
  getMyGigs,
  getGigById,
} = require('../controllers/gigController');

const router = express.Router();

// All gig routes currently require authentication.
// Role-based restrictions will be added by P2's RBAC middleware.
router.post('/', authenticate, createGig);
router.get('/', authenticate, getAllGigs);

// /mine must be declared before /:id, otherwise Express would treat
// "mine" as a gig ID and send the request to getGigById instead
router.get('/mine', authenticate, getMyGigs);
router.get('/:id', authenticate, getGigById);

module.exports = router;