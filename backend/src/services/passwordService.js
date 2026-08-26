const crypto = require('crypto');

// Temporary placeholder hash — NOT secure for production.
// Person 2 will replace this with proper bcrypt hashing + salting,
// and add a matching comparePassword function for login verification.
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

module.exports = { hashPassword };