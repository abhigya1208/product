const Log = require('../models/Log');

/**
 * Audit logging middleware
 * Logs all mutating requests (POST, PUT, PATCH, DELETE) automatically
 */
const logAction = (action) => {
  return async (req, res, next) => {
    // Store original json method to intercept response
    const originalJson = res.json.bind(res);

    res.json = function(data) {
      // Log the action after response is sent
      const logEntry = new Log({
        userId: req.user ? req.user._id : null,
        userName: req.user ? req.user.name : 'System',
        role: req.user ? req.user.role : 'system',
        action: action,
        details: {
          method: req.method,
          path: req.originalUrl,
          body: sanitizeBody(req.body),
          statusCode: res.statusCode,
          responseMessage: data?.message
        },
        ipAddress: req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress,
        userAgent: req.headers['user-agent']
      });

      // Fire and forget - don't block the response
      logEntry.save().catch(err => console.error('Log save error:', err));

      return originalJson(data);
    };

    next();
  };
};

/**
 * Remove sensitive fields from request body before logging
 */
function sanitizeBody(body) {
  if (!body) return {};
  const sanitized = { ...body };
  const sensitiveFields = ['password', 'token', 'razorpaySignature', 'key_secret'];
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '***REDACTED***';
    }
  });
  return sanitized;
}

module.exports = logAction;
