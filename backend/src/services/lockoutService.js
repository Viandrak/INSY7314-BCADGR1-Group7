const crypto = require('crypto');
const User = require('../models/userModel');
const { hashPassword } = require('./passwordService');

// 5 failed logins lock the account for 15 minutes
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000;

function isLocked(user, now = Date.now()) {
  return !!user.lockUntil && new Date(user.lockUntil).getTime() > now;
}

function lockHasExpired(user, now = Date.now()) {
  return !!user.lockUntil && new Date(user.lockUntil).getTime() <= now;
}

// When the count reaches the limit the account is locked.
async function registerFailedAttempt(user) {
  await User.updateOne({ _id: user._id }, { $inc: { failedLoginAttempts: 1 } });
  const updated = await User.findById(user._id).select('failedLoginAttempts');
  const attempts = updated ? updated.failedLoginAttempts : 1;

  if (attempts >= MAX_FAILED_ATTEMPTS) {
    const lockUntil = new Date(Date.now() + LOCK_DURATION_MS);
    await User.updateOne({ _id: user._id }, { $set: { lockUntil } });
    return { attempts, locked: true, lockUntil };
  }

  return { attempts, locked: false, lockUntil: null };
}

// Used after a successful login, after a lock has expired, and by the admin unlock
async function resetFailedAttempts(userId) {
  await User.updateOne({ _id: userId }, { $set: { failedLoginAttempts: 0, lockUntil: null } });
}

// A real bcrypt hash that belongs to nobody. Login compares the typed password
// against it when the email does not exist, so an unknown email takes as long
// to answer as a wrong password and response time cannot reveal which emails
// are registered. It is created when first needed, so no hash is stored in the code.
let dummyHashPromise = null;
function getDummyHash() {
  if (!dummyHashPromise) {
    dummyHashPromise = hashPassword(crypto.randomBytes(16).toString('hex'));
  }
  return dummyHashPromise;
}

module.exports = {
  MAX_FAILED_ATTEMPTS,
  LOCK_DURATION_MS,
  isLocked,
  lockHasExpired,
  registerFailedAttempt,
  resetFailedAttempts,
  getDummyHash,
};