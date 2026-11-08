const mongoose = require('mongoose');

// Blacklist of tokens that were logged out before they expired.
// Only the token's unique ID (jti) is stored, never the token itself.
const revokedTokenSchema = new mongoose.Schema({
  jti: {
    type: String,
    required: true,
    unique: true, 
  },
  expiresAt: {
    type: Date,
    required: true,
  },
});

// TTL index: MongoDB deletes each entry automatically once the token would
// have expired anyway, because an expired token is rejected by the signature
// check. The blacklist therefore never grows without limit.
revokedTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('RevokedToken', revokedTokenSchema);