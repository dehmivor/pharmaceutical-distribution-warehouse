// middlewares/authMiddleware.js
const authService = require('../services/authService');
const User = require('../models/User');

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
      console.log('Authentication failed: No token provided', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
      });

      return res.status(401).json({
        success: false,
        message: 'Access denied: No token provided',
      });
    }

    // Verify token
    const decoded = await authService.verifyToken(token);

    // Kiểm tra decoded data
    if (!decoded || !decoded.userId) {
      console.log('Authentication failed: Invalid token payload', {
        hasDecoded: !!decoded,
        hasUserId: decoded?.userId,
      });

      return res.status(401).json({
        success: false,
        message: 'Invalid token payload',
      });
    }

    // ✅ THÊM: Kiểm tra user còn tồn tại và active
    const user = await User.findById(decoded.userId).select('email role status is_manager');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
      });
    }

    if (user.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'Account is inactive',
      });
    }

    // Attach user data to request với thông tin mới nhất từ database
    req.user = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      is_manager: user.is_manager,
      status: user.status,
      // Giữ lại decoded data nếu cần
      tokenData: decoded,
    };

    // Log successful authentication (optional)
    console.log('Authentication successful', {
      userId: user._id,
      email: user.email,
      role: user.role,
      path: req.path,
    });

    next();
  } catch (error) {
    console.error('Authentication error:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
      ip: req.ip,
      path: req.path,
    });

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
