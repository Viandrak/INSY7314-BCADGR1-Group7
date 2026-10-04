const express = require('express');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/rbacMiddleware');
const { bookingLimiter } = require('../middleware/rateLimitMiddleware');
const {
  createBooking,
  getMyBookings,
  getReceivedBookings,
} = require('../controllers/bookingController');

const router = express.Router();

router.post('/', authenticate, authorize('client'), bookingLimiter, createBooking);
router.get('/mine', authenticate, authorize('client'), getMyBookings);
router.get('/received', authenticate, authorize('freelancer'), getReceivedBookings);

module.exports = router;