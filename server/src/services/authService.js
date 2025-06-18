// services/authService.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const constants = require('../utils/constants');
const { sendOTPEmail } = require('./emailService');
const getRedirectByRole = require('../utils/directUrl');

const authService = {
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
      const existingUser = User.findOne({
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
      const hashedPassword = bcrypt.hash(password, saltRounds);

      // Create new user
      const newUser = new User({
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        role: role || constants.USER_ROLES.VIEWER,
        status: constants.USER_STATUSES.ACTIVE,
      });

      const savedUser = newUser.save();

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

  loginStep1: async function (email, password) {
    try {
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

      // Tạo OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 phút

      await User.findByIdAndUpdate(user._id, {
        otp_login: {
          code: otp,
          expiry_time: otpExpiry,
        },
      });

      await sendOTPEmail(user.email, otp);

      const tempToken = jwt.sign(
        { userId: user._id, step: 'otp_verification' },
        process.env.JWT_SECRET,
        { expiresIn: '10m' },
      );

      return {
        success: true,
        message: 'Mã OTP đã được gửi đến email của bạn',
        data: {
          tempToken,
          email: user.email,
        },
      };
    } catch (error) {
      console.error('❌ AuthService.loginStep1 error:', error);
      return {
        success: false,
        message: 'Lỗi server khi đăng nhập',
      };
    }
  },

  loginStep2: async function (tempToken, otp) {
    try {
      if (!tempToken || !otp) {
        return {
          success: false,
          message: 'Token và OTP là bắt buộc',
        };
      }

      // Verify temp token
      let decoded;
      try {
        decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
      } catch (error) {
        return {
          success: false,
          message: 'Token không hợp lệ hoặc đã hết hạn',
        };
      }

      if (decoded.step !== 'otp_verification') {
        return {
          success: false,
          message: 'Token không hợp lệ',
        };
      }

      // Find user
      const user = await User.findById(decoded.userId);
      if (!user) {
        return {
          success: false,
          message: 'Người dùng không tồn tại',
        };
      }

      if (
        !user.otp_login ||
        user.otp_login.code !== otp ||
        user.otp_login.expiry_time < new Date()
      ) {
        return {
          success: false,
          message: 'OTP không hợp lệ hoặc đã hết hạn',
        };
      }

      // Xóa OTP sau khi xác thực thành công
      await User.findByIdAndUpdate(user._id, {
        $unset: { otp_login: 1 },
      });

      // Generate final tokens
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
            fullName: user.email.split('@')[0],
            role: user.role,
            status: user.status,
            is_manager: user.is_manager,
          },
          token,
          refreshToken,
          redirectUrl: getRedirectByRole(user.role),
        },
      };
    } catch (error) {
      console.error('❌ AuthService.loginStep2 error:', error);
      return {
        success: false,
        message: 'Lỗi server khi xác thực OTP',
      };
    }
  },

  login: async (email, password) => {
    try {
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

  verifyToken: async (token) => {
    try {
      // ✅ Enhanced input validation
      if (!token) {
        throw new Error('No token provided');
      }

      if (typeof token !== 'string') {
        throw new Error(`Token must be a string, received: ${typeof token}`);
      }

      // Clean token
      token = token.trim();

      if (token === '') {
        throw new Error('Token cannot be empty');
      }

      // ✅ Enhanced JWT format validation
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.error('❌ JWT Format Error:', {
          receivedParts: parts.length,
          expectedParts: 3,
          tokenPreview: token.substring(0, 50) + '...',
          fullToken: process.env.NODE_ENV === 'development' ? token : '[HIDDEN]',
        });
        throw new Error(`Invalid JWT format: expected 3 parts, got ${parts.length}`);
      }

      // Validate each part is not empty
      const emptyPartIndex = parts.findIndex((part) => !part || part.length === 0);
      if (emptyPartIndex !== -1) {
        throw new Error(`JWT part ${emptyPartIndex + 1} is empty`);
      }

      // ✅ Enhanced JWT verification with better error handling
      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
      } catch (jwtError) {
        if (jwtError.name === 'TokenExpiredError') {
          throw new Error('Token has expired');
        }
        if (jwtError.name === 'JsonWebTokenError') {
          throw new Error('Invalid token signature');
        }
        throw new Error(`Token verification failed: ${jwtError.message}`);
      }

      // ✅ Enhanced payload validation
      const requiredFields = ['userId', 'email'];
      const missingFields = requiredFields.filter((field) => !decoded[field]);

      if (missingFields.length > 0) {
        throw new Error(`Invalid token payload: missing fields: ${missingFields.join(', ')}`);
      }

      // ✅ Additional security checks
      if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
        throw new Error('Token has expired');
      }

      console.log('✅ Token verification successful:', {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
        expiresAt: decoded.exp ? new Date(decoded.exp * 1000).toISOString() : 'No expiry',
      });

      return decoded;
    } catch (error) {
      console.error('🔐 Token verification failed:', {
        message: error.message,
        tokenProvided: !!token,
        tokenLength: token?.length,
        tokenType: typeof token,
      });
      throw error;
    }
  },

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

  // Tìm user theo email
  // Kiểm tra tính hợp lệ của reset token
  verifyResetToken: async (token) => {
    try {
      console.log('🔍 Verifying reset token...');

      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

      const resetToken = await ResetToken.findOne({
        token: hashedToken,
        expiresAt: { $gt: new Date() },
      });

      if (resetToken) {
        console.log('✅ Reset token is valid');
        return true;
      } else {
        console.log('❌ Reset token is invalid or expired');
        return false;
      }
    } catch (error) {
      console.error('❌ Verify reset token error:', error);
      throw new Error('Failed to verify reset token');
    }
  },

  // Đặt lại mật khẩu
  resetPassword: async (token, newPassword) => {
    try {
      console.log('🔄 Resetting password...');

      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

      // Tìm reset token
      const resetToken = await ResetToken.findOne({
        token: hashedToken,
        expiresAt: { $gt: new Date() },
      });

      if (!resetToken) {
        console.log('❌ Invalid or expired reset token');
        return {
          success: false,
          message: 'Invalid or expired reset token',
        };
      }

      // Tìm user
      const user = await User.findById(resetToken.userId);
      if (!user) {
        console.log('❌ User not found');
        return {
          success: false,
          message: 'User not found',
        };
      }

      // Hash password mới
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      // Cập nhật password
      await User.findByIdAndUpdate(user._id, {
        password: hashedPassword,
        passwordChangedAt: new Date(),
      });

      // Xóa reset token đã sử dụng
      await ResetToken.deleteOne({ _id: resetToken._id });

      // Xóa tất cả refresh tokens của user (buộc đăng nhập lại)
      await this.revokeAllUserTokens(user._id);

      console.log(`✅ Password reset successful for user ${user.email}`);
      return {
        success: true,
        user: {
          id: user._id,
          email: user.email,
          name: user.name || user.email.split('@')[0],
        },
      };
    } catch (error) {
      console.error('❌ Reset password error:', error);
      return {
        success: false,
        message: 'Failed to reset password',
      };
    }
  },

  // Tạo reset token
  generateResetToken: async (userId) => {
    try {
      // Xóa các token cũ của user này
      await ResetToken.deleteMany({ userId });

      // Tạo token mới
      const token = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

      // Lưu token vào database với thời gian hết hạn (1 giờ)
      const resetToken = new ResetToken({
        userId,
        token: hashedToken,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      });

      await resetToken.save();

      return token; // Trả về token gốc (chưa hash)
    } catch (error) {
      throw new Error('Failed to generate reset token');
    }
  },

  // Kiểm tra tính hợp lệ của reset token
  verifyResetToken: (token) => {
    try {
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

      const resetToken = ResetToken.findOne({
        token: hashedToken,
        expiresAt: { $gt: new Date() },
      });

      return !!resetToken;
    } catch (error) {
      throw new Error('Failed to verify reset token');
    }
  },

  // Đặt lại mật khẩu
  resetPassword: (token, newPassword) => {
    try {
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

      // Tìm reset token
      const resetToken = ResetToken.findOne({
        token: hashedToken,
        expiresAt: { $gt: new Date() },
      });

      if (!resetToken) {
        return {
          success: false,
          message: 'Invalid or expired reset token',
        };
      }

      // Tìm user
      const user = User.findById(resetToken.userId);
      if (!user) {
        return {
          success: false,
          message: 'User not found',
        };
      }

      // Hash password mới
      const saltRounds = 12;
      const hashedPassword = bcrypt.hash(newPassword, saltRounds);

      // Cập nhật password
      User.findByIdAndUpdate(user._id, {
        password: hashedPassword,
        passwordChangedAt: new Date(),
      });

      // Xóa reset token đã sử dụng
      ResetToken.deleteOne({ _id: resetToken._id });

      // Xóa tất cả refresh tokens của user (buộc đăng nhập lại)
      this.revokeAllUserTokens(user._id);

      return {
        success: true,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
        },
      };
    } catch (error) {
      throw new Error('Failed to reset password');
    }
  },

  // Hủy tất cả tokens của user
  revokeAllUserTokens: async (userId) => {
    try {
      // Nếu bạn lưu refresh tokens trong database
      //  RefreshToken.deleteMany({ userId });

      // Hoặc thêm user vào blacklist
      //  TokenBlacklist.create({ userId, revokedAt: new Date() });

      return true;
    } catch (error) {
      console.error('Failed to revoke user tokens:', error);
      return false;
    }
  },
};

module.exports = authService;
