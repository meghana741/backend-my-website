const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'ecocycle_super_secret_jwt_key_2026_secure';

/**
 * Middleware to verify JWT token in Authorization header (Bearer <token>)
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No authentication token provided.'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, email, role, name, iat, exp }
    next();
  } catch (err) {
    return res.status(403).json({
      success: false,
      message: 'Invalid or expired authentication token. Please sign in again.',
      error: err.message
    });
  }
}

/**
 * Middleware to restrict access to specific roles (e.g. 'admin', 'citizen', etc.)
 * Normalizes 'user' and 'citizen' so both are accepted for citizen routes.
 * @param  {...string} roles - Permitted roles
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please sign in.'
      });
    }

    const userRole = req.user.role === 'user' ? 'citizen' : req.user.role;
    const normalizedRoles = roles.map(r => (r === 'user' ? 'citizen' : r));

    if (!normalizedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden. Role '${req.user.role}' does not have permission to access this resource. Allowed roles: ${roles.join(', ')}`
      });
    }

    next();
  };
}

/**
 * Specific middleware for Admin only
 */
function requireAdmin(req, res, next) {
  return requireRole('admin')(req, res, next);
}

/**
 * Specific middleware for Citizen only
 */
function requireCitizen(req, res, next) {
  return requireRole('citizen')(req, res, next);
}

/**
 * Optional authentication: if token is present, decode it into req.user,
 * but do not block if absent (useful for public tracking/inquiries).
 */
function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      req.user = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      // Ignore invalid token in optional auth
      req.user = null;
    }
  } else {
    req.user = null;
  }
  next();
}

module.exports = {
  authenticateToken,
  requireRole,
  requireAdmin,
  requireCitizen,
  optionalAuth,
  JWT_SECRET
};
