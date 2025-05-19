const authService = require('../services/auth.service');

const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token không được cung cấp',
      });
    }

    const token = authHeader.split(' ')[1];

    const decoded = authService.verifyToken(token);

    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Không có quyền truy cập',
      error: error.message,
    });
  }
};

module.exports = authenticate;
