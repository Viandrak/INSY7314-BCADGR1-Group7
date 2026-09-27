const Gig = require('../models/gigModel');
const { sendSuccess, sendError } = require('../utils/responseHandler');

const GIG_CATEGORIES = ['Design', 'Development', 'Writing', 'Marketing', 'Tutoring', 'Other'];
const UPDATABLE_GIG_FIELDS = ['title', 'description', 'category', 'price', 'deliveryDays'];

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

async function getAllGigs(req, res) {
  const filter = {};

  // Optional category filter, e.g. /api/gigs?category=Design.
  // Only exact values from the allowed list are used, so query input
  // can never inject database operators into the filter.
  const { category } = req.query;
  if (category !== undefined) {
    if (typeof category !== 'string' || !GIG_CATEGORIES.includes(category)) {
      return sendError(res, 400, 'Invalid category.');
    }
    filter.category = category;
  }

  try {
    const gigs = await Gig.find(filter)
      .populate('freelancer', 'email') // Only the freelancer's email is exposed
      .sort({ createdAt: -1 })
      .limit(100);

    return sendSuccess(res, 200, 'Gigs retrieved successfully.', { count: gigs.length, gigs });
  } catch (err) {
    return sendError(res, 500, 'An unexpected error occurred while retrieving gigs.');
  }
}

async function getMyGigs(req, res) {
  try {
    // The owner comes from the verified token, so users only ever see their own gigs
    const gigs = await Gig.find({ freelancer: req.user.id }).sort({ createdAt: -1 });

    return sendSuccess(res, 200, 'Your gigs retrieved successfully.', { count: gigs.length, gigs });
  } catch (err) {
    return sendError(res, 500, 'An unexpected error occurred while retrieving your gigs.');
  }
}

async function getGigById(req, res) {
  try {
    const gig = await Gig.findById(req.params.id).populate('freelancer', 'email');

    if (!gig) {
      return sendError(res, 404, 'Gig not found.');
    }

    return sendSuccess(res, 200, 'Gig retrieved successfully.', { gig });
  } catch (err) {
    return sendError(res, 500, 'An unexpected error occurred while retrieving the gig.');
  }
}

async function updateGig(req, res) {
  // Only allow changes to specific gig fields. Fields like "freelancer"
  // are ignored, so ownership can never be transferred through an update.
  const updates = {};
  for (const field of UPDATABLE_GIG_FIELDS) {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  }

  if (Object.keys(updates).length === 0) {
    return sendError(res, 400, 'No valid fields provided to update.');
  }

  try {
    const gig = await Gig.findById(req.params.id);

    if (!gig) {
      return sendError(res, 404, 'Gig not found.');
    }

    // Ownership check: only the freelancer who created the gig may update it
    if (gig.freelancer.toString() !== req.user.id) {
      return sendError(res, 403, 'You can only update your own gigs.');
    }

    gig.set(updates);
    await gig.save(); // save() runs the model's validation rules on the new values

    return sendSuccess(res, 200, 'Gig updated successfully.', { gig });
  } catch (err) {
    if (err.name === 'ValidationError') {
      return sendError(res, 400, 'Invalid gig details. Please check all fields and try again.');
    }
    return sendError(res, 500, 'An unexpected error occurred while updating the gig.');
  }
}

async function deleteGig(req, res) {
  try {
    const gig = await Gig.findById(req.params.id);

    if (!gig) {
      return sendError(res, 404, 'Gig not found.');
    }

    // Ownership check: only the freelancer who created the gig may delete it
    if (gig.freelancer.toString() !== req.user.id) {
      return sendError(res, 403, 'You can only delete your own gigs.');
    }

    // Existing bookings keep their own snapshot of the gig title and amount,
    // so booking and transaction history stays intact after deletion.
    await gig.deleteOne();

    return sendSuccess(res, 200, 'Gig deleted successfully.');
  } catch (err) {
    return sendError(res, 500, 'An unexpected error occurred while deleting the gig.');
  }
}

module.exports = { createGig, getAllGigs, getMyGigs, getGigById, updateGig, deleteGig };