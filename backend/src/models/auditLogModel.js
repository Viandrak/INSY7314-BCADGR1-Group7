const mongoose = require('mongoose');

const AUDIT_EVENTS = [
  'login_success',
  'login_failure',
  'account_locked',
  'account_unlocked',
  'logout',
  'access_denied',
];

// One document per security-relevant event, shown to admins on the Admin page.
const auditLogSchema = new mongoose.Schema(
  {
    event: { type: String, enum: AUDIT_EVENTS, required: true },
    // The account the event is about (not set when the email does not exist)
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    // The email involved, for example the one typed at a failed login
    email: { type: String, maxlength: 254, default: null },
    // Who performed the action, for example the admin who unlocked an account
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    ip: { type: String, maxlength: 64, default: null },
    method: { type: String, maxlength: 10, default: null },
    path: { type: String, maxlength: 200, default: null },
    details: { type: String, maxlength: 300, default: null },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
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

auditLogSchema.index({ createdAt: -1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

module.exports = AuditLog;
module.exports.AUDIT_EVENTS = AUDIT_EVENTS;