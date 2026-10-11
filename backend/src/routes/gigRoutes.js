const express = require('express');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/rbacMiddleware');
const { validateObjectId } = require('../middleware/objectIdMiddleware');
const { allowFields } = require('../middleware/allowlistMiddleware');
const {
  createGigValidationRules,
  updateGigValidationRules,
  handleValidationErrors,
} = require('../middleware/validationMiddleware');
const {
  createGig,
  getAllGigs,
  getMyGigs,
  getGigById,
  updateGig,
  deleteGig,
} = require('../controllers/gigController');

const router = express.Router();

const GIG_FIELDS = ['title', 'description', 'category', 'price', 'deliveryDays'];

router.post(
  '/',
  authenticate,
  authorize('freelancer'),
  allowFields(GIG_FIELDS),
  createGigValidationRules,
  handleValidationErrors,
  createGig
);
router.get('/', authenticate, getAllGigs);
router.get('/mine', authenticate, authorize('freelancer'), getMyGigs);
router.get('/:id', authenticate, validateObjectId(), getGigById);
router.patch(
  '/:id',
  authenticate,
  authorize('freelancer'),
  validateObjectId(),
  allowFields(GIG_FIELDS),
  updateGigValidationRules,
  handleValidationErrors,
  updateGig
);
router.delete('/:id', authenticate, authorize('freelancer'), validateObjectId(), deleteGig);

module.exports = router;