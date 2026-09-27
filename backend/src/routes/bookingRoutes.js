const express = require('express');
const { authenticate } = require('../middleware/authMiddleware');
const { createBooking } = require('../controllers/bookingController');

const router = express.Router();

// Booking currently requires authentication.
// Client-only role enforcement will be added by P2's RBAC middleware.
router.post('/', authenticate, createBooking);

module.exports = router;