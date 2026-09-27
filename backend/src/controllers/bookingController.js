const crypto = require('crypto');
const Booking = require('../models/bookingModel');
const Gig = require('../models/gigModel');
const { isValidObjectId } = require('../middleware/objectIdMiddleware');
const { sendSuccess, sendError } = require('../utils/responseHandler');

// Generates a simulated confirmation reference, e.g. HH-7F3A9C21.
// No real payment is processed.
function generateBookingReference() {
  return `HH-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

async function createBooking(req, res) {
  // Only the gig ID is read from the request body. The client comes from
  // the verified token, and the freelancer, title and amount come from the
  // stored gig, so a user cannot set their own price or book as someone else.
  const { gigId } = req.body;

  if (!isValidObjectId(gigId)) {
    return sendError(res, 400, 'A valid gig ID is required.');
  }

  try {
    const gig = await Gig.findById(gigId);

    if (!gig) {
      return sendError(res, 404, 'Gig not found.');
    }

    const booking = await Booking.create({
      client: req.user.id,
      freelancer: gig.freelancer,
      gig: gig._id,
      gigTitle: gig.title,
      amount: gig.price,
      reference: generateBookingReference(),
    });

    return sendSuccess(res, 201, 'Booking confirmed. This is a simulated confirmation; no payment was processed.', {
      booking,
    });
  } catch (err) {
    return sendError(res, 500, 'An unexpected error occurred while creating the booking.');
  }
}

module.exports = { createBooking };