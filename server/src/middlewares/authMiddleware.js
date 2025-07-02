const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ✅ Utility function để validate JWT token format
const isValidJWT = (token) => {
  if (!token || typeof token !== 'string') return false;

  const parts = token.split('.');
  if (parts.length !== 3) return false;

  return parts.every((part) => part && part.length > 0);
};

// ✅ Extract token từ request headers
const extractToken = (req) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7); // Remove 'Bearer ' prefix
  }

  // Fallback: check cookies nếu có
  if (req.cookies && req.cookies.token) {
    return req.cookies.token;
  }

  return null;
};

// ✅ Main authentication middleware
const authMiddleware = async (req, res, next) => {
  try {
    // Extract token từ request
    const token = extractToken(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No authentication token provided.',
      });
    }

    // Validate token format
    if (!isValidJWT(token)) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Invalid token format.',
      });
    }

    // Verify JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Access denied. Token has expired.',
          code: 'TOKEN_EXPIRED',
        });
      }

      if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Access denied. Invalid token.',
          code: 'INVALID_TOKEN',
        });
      }

      throw jwtError; // Re-throw unexpected errors
    }

    // Validate decoded token structure
    if (!decoded || !decoded.id) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Invalid token payload.',
      });
    }

    // Fetch user từ database
    const user = await User.findById(decoded.id).select('-password -otp_login -otp_reset').lean();

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. User not found.',
        code: 'USER_NOT_FOUND',
      });
    }

    // Check user status
    if (user.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Account is inactive.',
        code: 'ACCOUNT_INACTIVE',
      });
    }

    // Attach user info to request object
    req.user = {
      id: user._id,
      email: user.email,
      role: user.role,
      is_manager: user.is_manager,
      status: user.status,
    };

    // Log successful authentication (optional)
    console.log(`✅ User authenticated: ${user.email} (${user.role})`);

    next();
  } catch (error) {
    console.error('❌ Auth middleware error:', error);

    return res.status(500).json({
      success: false,
      message: 'Internal server error during authentication.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// ✅ Optional middleware để check nếu user đã login (không bắt buộc)
const optionalAuthMiddleware = async (req, res, next) => {
  try {
    const token = extractToken(req);

    if (!token || !isValidJWT(token)) {
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded && decoded.id) {s
      const user = await User.findById(decoded.id).select('-password -otp_login -otp_reset').lean();

      if (user && user.status === 'active') {
        req.user = {
          id: user._id,
          email: user.email,
          role: user.role,
          is_manager: user.is_manager,
          status: user.status,
        };
      }
    }

    next();
  } catch (error) {
    // Trong optional auth, chúng ta không throw error
    req.user = null;
    next();
  }
};

// ✅ Middleware để validate JWT secret exists
const validateJWTConfig = (req, res, next) => {
  if (!process.env.JWT_SECRET) {
    console.error('❌ JWT_SECRET environment variable is not set');
    return res.status(500).json({
      success: false,
      message: 'Server configuration error',
    });
  }
  next();
};

module.exports = {
  authMiddleware,
  optionalAuthMiddleware,
  validateJWTConfig,
  extractToken,
  isValidJWT,
};
