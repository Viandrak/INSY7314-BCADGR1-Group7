const express = require('express');
const { authenticate } = require('../middleware/authMiddleware');
const {
  createBooking,
  getMyBookings,
  getReceivedBookings,
} = require('../controllers/bookingController');

const router = express.Router();

// Booking routes currently require authentication.
// Role-based restrictions will be added by P2's RBAC middleware.
router.post('/', authenticate, createBooking);

// Returns only bookings made by the logged-in user
router.get('/mine', authenticate, getMyBookings);

// Returns only bookings made on the logged-in user's gigs
router.get('/received', authenticate, getReceivedBookings);

module.exports = router;