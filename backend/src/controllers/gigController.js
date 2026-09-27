const Gig = require('../models/gigModel');
const { sendSuccess, sendError } = require('../utils/responseHandler');

async function createGig(req, res) {
  // Only copy the fields a freelancer is allowed to set.
  // The owner always comes from the verified token, never from the request body,
  // so a user cannot create a gig on someone else's behalf.
  const { title, description, category, price, deliveryDays } = req.body;

  try {
    const gig = await Gig.create({
      freelancer: req.user.id,
      title,
      description,
      category,
      price,
      deliveryDays,
    });

    return sendSuccess(res, 201, 'Gig created successfully.', { gig });
  } catch (err) {
    if (err.name === 'ValidationError') {
      return sendError(res, 400, 'Invalid gig details. Please check all fields and try again.');
    }
    return sendError(res, 500, 'An unexpected error occurred while creating the gig.');
  }
}

module.exports = { createGig };