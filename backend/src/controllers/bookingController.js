const crypto = require('crypto');
const mongoose = require('mongoose');
const Booking = require('../models/bookingModel');
const Gig = require('../models/gigModel');
const Transaction = require('../models/transactionModel');
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

    let booking;
    let transaction;

    // The booking and its transaction record are saved together in a single
    // database transaction: either both are saved or neither is, so a booking
    // can never exist without its financial record.
    await mongoose.connection.transaction(async (session) => {
      [booking] = await Booking.create(
        [
          {
            client: req.user.id,
            freelancer: gig.freelancer,
            gig: gig._id,
            gigTitle: gig.title,
            amount: gig.price,
            reference: generateBookingReference(),
          },
        ],
        { session }
      );

      [transaction] = await Transaction.create(
        [
          {
            booking: booking._id,
            client: booking.client,
            freelancer: booking.freelancer,
            amount: booking.amount,
          },
        ],
        { session }
      );
    });

    return sendSuccess(res, 201, 'Booking confirmed. This is a simulated confirmation; no payment was processed.', {
      booking,
      transaction,
    });
  } catch (err) {
    return sendError(res, 500, 'An unexpected error occurred while creating the booking.');
  }
}

module.exports = { createBooking };