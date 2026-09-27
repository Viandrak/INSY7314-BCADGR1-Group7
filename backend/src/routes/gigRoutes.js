const express = require('express');
const { authenticate } = require('../middleware/authMiddleware');
const { validateObjectId } = require('../middleware/objectIdMiddleware');
const {
  createGig,
  getAllGigs,
  getMyGigs,
  getGigById,
  updateGig,
  deleteGig,
} = require('../controllers/gigController');

const router = express.Router();

// All gig routes currently require authentication.
// Role-based restrictions will be added by P2's RBAC middleware.
router.post('/', authenticate, createGig);
router.get('/', authenticate, getAllGigs);

// /mine must be declared before /:id, otherwise Express would treat
// "mine" as a gig ID and send the request to getGigById instead
router.get('/mine', authenticate, getMyGigs);

// Routes with an ID check its format before reaching the controller.
// Ownership for update and delete is checked inside the controller.
router.get('/:id', authenticate, validateObjectId(), getGigById);
router.patch('/:id', authenticate, validateObjectId(), updateGig);
router.delete('/:id', authenticate, validateObjectId(), deleteGig);

module.exports = router;