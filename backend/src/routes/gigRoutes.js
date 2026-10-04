const express = require('express');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/rbacMiddleware');
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

router.post('/', authenticate, authorize('freelancer'), createGig);
router.get('/', authenticate, getAllGigs);
router.get('/mine', authenticate, authorize('freelancer'), getMyGigs);
router.get('/:id', authenticate, validateObjectId(), getGigById);
router.patch('/:id', authenticate, authorize('freelancer'), validateObjectId(), updateGig);
router.delete('/:id', authenticate, authorize('freelancer'), validateObjectId(), deleteGig);

module.exports = router;