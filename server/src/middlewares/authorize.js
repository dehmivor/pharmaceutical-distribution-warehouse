// middlewares/authorize.js
const authorize = (allowedRoles) => {
  return (req, res, next) => {
    try {
      // Kiểm tra user đã được authenticate chưa
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      // Lấy role từ user data
      const userRole = req.user.role;

      if (!userRole) {
        return res.status(403).json({
          success: false,
          message: 'User role not found',
        });
      }

      // Kiểm tra role có được phép không
      const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

      if (!rolesArray.includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: `Access denied. Required roles: ${rolesArray.join(', ')}`,
          userRole: userRole,
          requiredRoles: rolesArray,
        });
      }

      next();
    } catch (error) {
      console.error('Authorization error:', error.message);
      return res.status(403).json({
        success: false,
        message: 'Authorization failed',
      });
    }
  };
};

module.exports = authorize;
