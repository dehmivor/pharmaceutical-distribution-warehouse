// middlewares/authMiddleware.js
const authService = require('../services/authService');

const authenticate = async (req, res, next) => {
  try {
    let token = null;

    // Lấy token từ Authorization header hoặc cookies
    const authHeader = req.headers.authorization;
    const cookieToken = req.cookies['auth-token'];

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (cookieToken) {
      token = cookieToken;
    }

    // Kiểm tra token có tồn tại không
    if (!token || token.trim() === '') {
      return res.status(401).json({
        success: false,
        message: 'Access denied: No token provided',
      });
    }

    // Verify token
    const decoded = await authService.verifyToken(token);

    // Kiểm tra decoded data
    if (!decoded || !decoded.userId) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token payload',
      });
    }

    // Attach user data to request (bao gồm role)
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role, // ✅ Đảm bảo role được include
      ...decoded,
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error.message);

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

    return res.status(401).json({
      success: false,
      message: 'Authentication failed',
    });
  }
};

module.exports = authenticate;
