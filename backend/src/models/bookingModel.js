const mongoose = require('mongoose');

// Booking model: created when a client books a freelancer's gig.
// Stores both parties so each can only see bookings that involve them.
const bookingSchema = new mongoose.Schema(
  {
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true, // Speeds up a client's "my bookings" lookups
    },
    freelancer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true, // Speeds up a freelancer's "bookings received" lookups
    },
    gig: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Gig',
      required: true,
    },
    // Snapshot of the gig at the time of booking, so the booking record
    // stays accurate even if the gig is later edited or deleted.
    gigTitle: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    amount: {
      type: Number,
      required: true,
      min: 1, // Amount in ZAR
    },
    status: {
      type: String,
      enum: ['confirmed', 'cancelled'],
      default: 'confirmed',
    },
    // Simulated confirmation reference shown to the client (no real payment)
    reference: {
      type: String,
      required: true,
      unique: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;