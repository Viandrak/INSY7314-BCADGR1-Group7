const express = require('express');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/rbacMiddleware');
const { validateObjectId } = require('../middleware/objectIdMiddleware');
const { allowFields } = require('../middleware/allowlistMiddleware');
const {
  auditLogQueryValidationRules,
  handleValidationErrors,
} = require('../middleware/validationMiddleware');
const {
  getAllUsers,
  getAllGigsAdmin,
  getAllBookingsAdmin,
  unlockUser,
  getAuditLogs,
} = require('../controllers/adminController');

const router = express.Router();

router.get('/users', authenticate, authorize('admin'), getAllUsers);
router.get('/gigs', authenticate, authorize('admin'), getAllGigsAdmin);
router.get('/bookings', authenticate, authorize('admin'), getAllBookingsAdmin);
router.post(
  '/users/:id/unlock',
  authenticate,
  authorize('admin'),
  validateObjectId(),
  allowFields([]),
  unlockUser
);
router.get(
  '/audit-logs',
  authenticate,
  authorize('admin'),
  auditLogQueryValidationRules,
  handleValidationErrors,
  getAuditLogs
);

module.exports = router;