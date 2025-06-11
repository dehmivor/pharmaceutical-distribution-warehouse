// services/authService.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const constants = require('../utils/constants');

const authService = {
  // ✅ Register method
  register: async (userData) => {
    try {
      const { email, password, fullName, role } = userData;

      console.log('📝 AuthService.register called:', email);

      // Validate required fields
      if (!email || !password) {
        return {
          success: false,
          message: 'Email và mật khẩu là bắt buộc',
        };
      }

      // Check if user already exists
      const existingUser = await User.findOne({
        email: email.toLowerCase().trim(),
      });

      if (existingUser) {
        return {
          success: false,
          message: 'Email đã được sử dụng',
        };
      }

      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Create new user
      const newUser = new User({
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        role: role || constants.USER_ROLES.VIEWER,
        status: constants.USER_STATUSES.ACTIVE,
      });

      const savedUser = await newUser.save();

      return {
        success: true,
        data: {
          user: {
            id: savedUser._id,
            email: savedUser.email,
            fullName: fullName || savedUser.email.split('@')[0], // Fallback name
            role: savedUser.role,
            status: savedUser.status,
            is_manager: savedUser.is_manager,
          },
        },
      };
    } catch (error) {
      console.error('❌ Register service error:', error);

      // Handle specific MongoDB errors
      if (error.code === 11000) {
        return {
          success: false,
          message: 'Email đã được sử dụng',
        };
      }

      if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map((err) => err.message);
        return {
          success: false,
          message: messages.join(', '),
        };
      }

      return {
        success: false,
        message: 'Lỗi server khi đăng ký',
      };
    }
  },

  // ✅ Login method
  login: async (email, password) => {
    try {
      console.log('🔍 AuthService.login called with email:', email);

      if (!process.env.JWT_SECRET) {
        console.error('❌ JWT_SECRET not configured');
        throw new Error('JWT configuration missing');
      }

      if (!email || !password) {
        return {
          success: false,
          message: 'Email và mật khẩu là bắt buộc',
        };
      }

      // Find user by email
      const user = await User.findOne({
        email: email.toLowerCase().trim(),
      });

      if (!user) {
        return {
          success: false,
          message: 'Email hoặc mật khẩu không chính xác',
        };
      }

      // Check user status
      if (user.status !== constants.USER_STATUSES.ACTIVE) {
        return {
          success: false,
          message: 'Tài khoản đã bị khóa hoặc không hoạt động',
        };
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return {
          success: false,
          message: 'Email hoặc mật khẩu không chính xác',
        };
      }

      // Generate tokens
      const token = jwt.sign(
        {
          userId: user._id,
          email: user.email,
          role: user.role,
          is_manager: user.is_manager,
        },
        process.env.JWT_SECRET,
        { expiresIn: '1h' },
      );

      const refreshToken = jwt.sign(
        { userId: user._id },
        process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET,
        { expiresIn: '7d' },
      );

      return {
        success: true,
        data: {
          user: {
            id: user._id,
            email: user.email,
            fullName: user.email.split('@')[0], // Fallback name since model doesn't have fullName
            role: user.role,
            status: user.status,
            is_manager: user.is_manager,
          },
          token,
          refreshToken,
        },
      };
    } catch (error) {
      console.error('❌ AuthService.login error:', error);
      return {
        success: false,
        message: 'Lỗi server khi đăng nhập',
      };
    }
  },

  // ✅ Verify token method (cho middleware)
  verifyToken: async (token) => {
    try {
      console.log('🔐 Verifying token...');

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Verify user still exists and is active
      const user = await User.findById(decoded.userId);
      if (!user) {
        throw new Error('User not found');
      }

      if (user.status !== constants.USER_STATUSES.ACTIVE) {
        throw new Error('User account is inactive');
      }

      console.log('✅ Token valid:', decoded.userId);

      return {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
        is_manager: decoded.is_manager,
      };
    } catch (error) {
      console.error('❌ Token verification failed:', error);
      throw error; // Re-throw để middleware catch
    }
  },

  // ✅ Refresh token method
  refreshToken: async (refreshToken) => {
    try {
      console.log('🔄 Refreshing token...');

      const decoded = jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET,
      );

      // Find user and verify they still exist and are active
      const user = await User.findById(decoded.userId);
      if (!user) {
        return {
          success: false,
          message: 'User not found',
        };
      }

      if (user.status !== constants.USER_STATUSES.ACTIVE) {
        return {
          success: false,
          message: 'User account is inactive',
        };
      }

      // Generate new tokens
      const newToken = jwt.sign(
        {
          userId: user._id,
          email: user.email,
          role: user.role,
          is_manager: user.is_manager,
        },
        process.env.JWT_SECRET,
        { expiresIn: '1h' },
      );

      const newRefreshToken = jwt.sign(
        { userId: user._id },
        process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET,
        { expiresIn: '7d' },
      );

      return {
        success: true,
        data: {
          user: {
            id: user._id,
            email: user.email,
            fullName: user.email.split('@')[0], // Fallback name
            role: user.role,
            status: user.status,
            is_manager: user.is_manager,
          },
          token: newToken,
          refreshToken: newRefreshToken,
        },
      };
    } catch (error) {
      console.error('❌ Refresh token error:', error);
      return {
        success: false,
        message: 'Invalid refresh token',
      };
    }
  },

  // ✅ Logout method
  logout: async (token) => {
    try {
      console.log('👋 Logging out...');

      // TODO: Implement token blacklisting in database
      // You can create a BlacklistedToken model or add blacklisted tokens to user document

      // For now, just log the logout
      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log(`User ${decoded.userId} logged out`);
      }

      console.log('✅ Logout successful');
      return {
        success: true,
        message: 'Logout successful',
      };
    } catch (error) {
      console.error('❌ Logout error:', error);
      return {
        success: false,
        message: 'Logout failed',
      };
    }
  },

  // ✅ THÊM: Get user by ID method
  getUserById: async (userId) => {
    try {
      const user = await User.findById(userId);
      if (!user) {
        return {
          success: false,
          message: 'User not found',
        };
      }

      return {
        success: true,
        data: {
          user: {
            id: user._id,
            email: user.email,
            fullName: user.email.split('@')[0], // Fallback name
            role: user.role,
            status: user.status,
            is_manager: user.is_manager,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          },
        },
      };
    } catch (error) {
      console.error('❌ Get user error:', error);
      return {
        success: false,
        message: 'Error fetching user data',
      };
    }
  },

  // ✅ THÊM: Update user method
  updateUser: async (userId, updateData) => {
    try {
      const allowedUpdates = ['role', 'status', 'is_manager'];
      const updates = {};

      // Filter allowed updates
      for (const field of allowedUpdates) {
        if (updateData[field] !== undefined) {
          updates[field] = updateData[field];
        }
      }

      const user = await User.findByIdAndUpdate(userId, updates, {
        new: true,
        runValidators: true,
      });

      if (!user) {
        return {
          success: false,
          message: 'User not found',
        };
      }

      return {
        success: true,
        data: {
          user: {
            id: user._id,
            email: user.email,
            fullName: user.email.split('@')[0],
            role: user.role,
            status: user.status,
            is_manager: user.is_manager,
          },
        },
      };
    } catch (error) {
      console.error('❌ Update user error:', error);
      return {
        success: false,
        message: 'Error updating user',
      };
    }
  },
};

module.exports = authService;
