const mongoose = require('mongoose');

// User model stored in MongoDB.
// Replaces the temporary in-memory user store used in Part 1.
const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true, // Enforced by a unique index in MongoDB
      lowercase: true,
      trim: true,
      maxlength: 254,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false, // Never returned by queries unless explicitly requested
    },
    role: {
      type: String,
      enum: ['client', 'freelancer', 'admin'],
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      // Remove sensitive and internal fields whenever a user is sent in a response
      transform(doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        delete ret.passwordHash;
        return ret;
      },
    },
  }
);

const User = mongoose.model('User', userSchema);

module.exports = User;