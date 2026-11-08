const { sendError } = require('../utils/responseHandler');
const { recordAccessDenied } = require('../services/auditService');

function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      // Logged and audited, but never allowed to delay or break the response
      recordAccessDenied(req, 'Role not allowed for this route');
      return sendError(res, 403, 'You do not have permission to perform this action.');
    }
    next();
  };
}

module.exports = { authorize };