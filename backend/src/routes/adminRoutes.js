const express = require('express');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/rbacMiddleware');
const {
  getAllUsers,
  getAllGigsAdmin,
  getAllBookingsAdmin,
} = require('../controllers/adminController');

const router = express.Router();

router.get('/users', authenticate, authorize('admin'), getAllUsers);
router.get('/gigs', authenticate, authorize('admin'), getAllGigsAdmin);
router.get('/bookings', authenticate, authorize('admin'), getAllBookingsAdmin);

module.exports = router;