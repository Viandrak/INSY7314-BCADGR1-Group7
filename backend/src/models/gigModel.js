const mongoose = require('mongoose');

// Gig model: a service advertised by a freelancer.
// The freelancer field records ownership, so only the freelancer who
// created a gig can update or delete it.
const gigSchema = new mongoose.Schema(
  {
    freelancer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true, // Speeds up "my gigs" lookups
    },
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 100,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 2000,
    },
    category: {
      type: String,
      required: true,
      enum: ['Design', 'Development', 'Writing', 'Marketing', 'Tutoring', 'Other'],
    },
    price: {
      type: Number,
      required: true,
      min: 1,
      max: 1000000, // Price in ZAR
    },
    deliveryDays: {
      type: Number,
      required: true,
      min: 1,
      max: 365,
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

const Gig = mongoose.model('Gig', gigSchema);

module.exports = Gig;