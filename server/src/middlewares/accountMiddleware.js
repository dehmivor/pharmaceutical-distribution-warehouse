const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware xác thực token JWT và gán user vào req
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];

    // Sửa lỗi: split(' ')[1] để lấy token sau 'Bearer '
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required',
        code: 'TOKEN_MISSING',
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Tìm user trong database
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
        code: 'USER_NOT_FOUND',
      });
    }

    if (user.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'User account is inactive',
        code: 'USER_INACTIVE',
      });
    }

    // Kiểm tra token expiry
    if (decoded.exp && Date.now() >= decoded.exp * 1000) {
      return res.status(401).json({
        success: false,
        message: 'Token has expired',
        code: 'TOKEN_EXPIRED',
      });
    }

    // Gán user vào request object
    req.user = user;
    req.tokenData = decoded;

    next();
  } catch (error) {
    console.error('Authentication error:', error);

    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({
        success: false,
        message: 'Invalid token format',
        code: 'TOKEN_INVALID',
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired',
        code: 'TOKEN_EXPIRED',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Authentication failed',
      code: 'AUTH_ERROR',
    });
  }
};

// Middleware kiểm tra quyền supervisor
const authorizeSupervisor = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'AUTH_REQUIRED',
      });
    }

    if (req.user.role !== 'supervisor') {
      return res.status(403).json({
        success: false,
        message: 'Only supervisors can perform this action',
        code: 'INSUFFICIENT_PERMISSIONS',
      });
    }

    next();
  } catch (error) {
    console.error('Authorization error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authorization failed',
      code: 'AUTH_ERROR',
    });
  }
};

// Middleware kiểm tra quyền supervisor hoặc chính chủ
const authorizeSelfOrSupervisor = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'AUTH_REQUIRED',
      });
    }

    const isSupervisor = req.user.role === 'supervisor';
    const isSelf = req.user._id.toString() === req.params.id;

    if (!isSupervisor && !isSelf) {
      return res.status(403).json({
        success: false,
        message: 'You can only access your own account or must be a supervisor',
        code: 'INSUFFICIENT_PERMISSIONS',
      });
    }

    next();
  } catch (error) {
    console.error('Authorization error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authorization failed',
      code: 'AUTH_ERROR',
    });
  }
};

// Middleware kiểm tra quyền theo role
const authorizeRole = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          code: 'AUTH_REQUIRED',
        });
      }

      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: `Access denied. Required roles: ${allowedRoles.join(', ')}`,
          code: 'INSUFFICIENT_PERMISSIONS',
        });
      }

      next();
    } catch (error) {
      console.error('Role authorization error:', error);
      return res.status(500).json({
        success: false,
        message: 'Authorization failed',
        code: 'AUTH_ERROR',
      });
    }
  };
};

// Middleware kiểm tra quyền manager
const authorizeManager = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'AUTH_REQUIRED',
      });
    }

    const isSupervisor = req.user.role === 'supervisor';
    const isManager = req.user.is_manager === true;

    if (!isSupervisor && !isManager) {
      return res.status(403).json({
        success: false,
        message: 'Manager privileges required',
        code: 'INSUFFICIENT_PERMISSIONS',
      });
    }

    next();
  } catch (error) {
    console.error('Manager authorization error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authorization failed',
      code: 'AUTH_ERROR',
    });
  }
};

// Middleware kiểm tra user có thể truy cập account target
const authorizeAccountAccess = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'AUTH_REQUIRED',
      });
    }

    const targetUserId = req.params.id;
    const currentUser = req.user;

    // Supervisor có thể truy cập tất cả accounts
    if (currentUser.role === 'supervisor') {
      return next();
    }

    // User chỉ có thể truy cập account của chính mình
    if (currentUser._id.toString() === targetUserId) {
      return next();
    }

    // Manager có thể truy cập accounts trong cùng department/team (nếu cần)
    if (currentUser.is_manager) {
      const targetUser = await User.findById(targetUserId);
      if (targetUser && targetUser.role === currentUser.role) {
        return next();
      }
    }

    return res.status(403).json({
      success: false,
      message: 'Access denied to this account',
      code: 'INSUFFICIENT_PERMISSIONS',
    });
  } catch (error) {
    console.error('Account access authorization error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authorization failed',
      code: 'AUTH_ERROR',
    });
  }
};

// Middleware audit logging cho account operations
const auditLogger = (action) => {
  return (req, res, next) => {
    const originalSend = res.send;

    res.send = function (data) {
      // Log the action after response
      const logData = {
        action,
        user: req.user
          ? {
              id: req.user._id,
              email: req.user.email,
              role: req.user.role,
            }
          : null,
        target: req.params.id || null,
        body: req.body ? JSON.stringify(req.body) : null,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date(),
        success: res.statusCode < 400,
      };

      console.log('🔍 Audit Log:', JSON.stringify(logData, null, 2));

      // Có thể lưu vào database hoặc file log
      // await AuditLog.create(logData);

      return originalSend.call(this, data);
    };

    next();
  };
};

// Middleware validate MongoDB ObjectId
const validateObjectId = (paramName = 'id') => {
  return (req, res, next) => {
    const mongoose = require('mongoose');
    const id = req.params[paramName];

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid ${paramName} format`,
        code: 'INVALID_ID',
      });
    }

    next();
  };
};

// Middleware kiểm tra account status
const checkAccountStatus = async (req, res, next) => {
  try {
    if (!req.params.id) {
      return next();
    }

    const targetUser = await User.findById(req.params.id);

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'Account not found',
        code: 'ACCOUNT_NOT_FOUND',
      });
    }

    if (targetUser.status === 'deleted') {
      return res.status(410).json({
        success: false,
        message: 'Account has been deleted',
        code: 'ACCOUNT_DELETED',
      });
    }

    req.targetUser = targetUser;
    next();
  } catch (error) {
    console.error('Account status check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to check account status',
      code: 'STATUS_CHECK_ERROR',
    });
  }
};

// Middleware kiểm tra self-modification restrictions
const preventSelfPrivilegeEscalation = (req, res, next) => {
  try {
    const currentUser = req.user;
    const targetUserId = req.params.id;
    const updateData = req.body;

    // Nếu user đang cập nhật chính mình
    if (currentUser._id.toString() === targetUserId) {
      // Không cho phép tự thay đổi role hoặc status (chỉ supervisor mới được)
      if (currentUser.role !== 'supervisor') {
        if (updateData.role || updateData.status) {
          return res.status(403).json({
            success: false,
            message: 'You cannot modify your own role or status',
            code: 'SELF_PRIVILEGE_RESTRICTION',
          });
        }
      }
    }

    next();
  } catch (error) {
    console.error('Self privilege escalation check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authorization check failed',
      code: 'AUTH_ERROR',
    });
  }
};

module.exports = {
  // Core authentication & authorization
  authenticateToken,
  authorizeSupervisor,
  authorizeSelfOrSupervisor,
  authorizeRole,
  authorizeManager,
  authorizeAccountAccess,

  // Utility middlewares
  validateObjectId,
  checkAccountStatus,
  preventSelfPrivilegeEscalation,
  auditLogger,
};
