const authService = require('../services/authService');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // Kiểm tra header Authorization
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Access denied: No token provided',
      });
    }

    // Kiểm tra format Bearer token
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token format. Expected: Bearer <token>',
      });
    }

    const token = authHeader.split(' ')[1];

    // Kiểm tra token có tồn tại không
    if (!token || token.trim() === '') {
      return res.status(401).json({
        success: false,
        message: 'Token is required',
      });
    }

    // Verify token (có thể là async function)
    const decoded = await authService.verifyToken(token);

    // Kiểm tra decoded data
    if (!decoded || !decoded.userId) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token payload',
      });
    }

    // Attach user data to request
    req.user = decoded;
    next();
  } catch (error) {
    // Log error for debugging (không expose ra client)
    console.error('Authentication error:', error.message);

    // Xử lý các loại error khác nhau
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token',
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired',
      });
    }

    // Generic error response (không expose chi tiết)
    return res.status(401).json({
      success: false,
      message: 'Authentication failed',
    });
  }
};

module.exports = authenticate;
