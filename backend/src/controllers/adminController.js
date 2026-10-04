const User = require('../models/userModel');
const Gig = require('../models/gigModel');
const Booking = require('../models/bookingModel');
const { sendSuccess, sendError } = require('../utils/responseHandler');

async function getAllUsers(req, res) {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    return sendSuccess(res, 200, 'Users retrieved successfully.', {
      count: users.length,
      users,
    });
  } catch (err) {
    return sendError(res, 500, 'An unexpected error occurred while retrieving users.');
  }
}

async function getAllGigsAdmin(req, res) {
  try {
    const gigs = await Gig.find()
      .populate('freelancer', 'email role')
      .sort({ createdAt: -1 });
    return sendSuccess(res, 200, 'Gigs retrieved successfully.', {
      count: gigs.length,
      gigs,
    });
  } catch (err) {
    return sendError(res, 500, 'An unexpected error occurred while retrieving gigs.');
  }
}

async function getAllBookingsAdmin(req, res) {
  try {
    const bookings = await Booking.find()
      .populate('client', 'email')
      .populate('freelancer', 'email')
      .sort({ createdAt: -1 });
    return sendSuccess(res, 200, 'Bookings retrieved successfully.', {
      count: bookings.length,
      bookings,
    });
  } catch (err) {
    return sendError(res, 500, 'An unexpected error occurred while retrieving bookings.');
  }
}

module.exports = { getAllUsers, getAllGigsAdmin, getAllBookingsAdmin };