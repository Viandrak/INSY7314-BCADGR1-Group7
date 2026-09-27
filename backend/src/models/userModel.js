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
    },
    role: {
      type: String,
      enum: ['client', 'freelancer', 'admin'],
      required: true,
    },
  },
  { timestamps: true }
);

const User = mongoose.model('User', userSchema);

module.exports = User;