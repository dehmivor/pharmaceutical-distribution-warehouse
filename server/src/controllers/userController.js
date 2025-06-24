const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const constants = require('../utils/constants');
const crypto = require('crypto');

// Helper function để tạo JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// Helper function để tạo OTP
const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};
const createUser = async (req, res) => {
  try {
    const { email, password, role, is_manager } = req.body;

    // Kiểm tra email đã tồn tại
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists',
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Tạo user mới
    const newUser = new User({
      email,
      password: hashedPassword,
      role,
      is_manager: is_manager || false,
      status: constants.USER_STATUSES.ACTIVE,
      status: constants.USER_STATUSES.ACTIVE,
    });

    await newUser.save();

    // Loại bỏ password khỏi response
    const userResponse = newUser.toObject();
    delete userResponse.password;
    delete userResponse.otp_login;
    delete userResponse.otp_reset;

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: userResponse,
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map((err) => err.message),
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, role, status, search } = req.query;

    // ✅ Enhanced user validation
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        success: false,
        message: 'Invalid user context',
      });
    }

    // ✅ Role-based access control
    const allowedRoles = ['supervisor'];
    const hasManagerAccess = req.user.is_manager === true;

    if (!allowedRoles.includes(req.user.role) && !hasManagerAccess) {
      console.warn('Access denied for user:', {
        userId: req.user.userId,
        role: req.user.role,
        isManager: req.user.is_manager,
        attemptedAction: 'getAllUsers',
      });

      return res.status(403).json({
        success: false,
        message: 'Access denied: Insufficient permissions',
        requiredRoles: allowedRoles,
        currentRole: req.user.role,
      });
    }

    // ✅ Enhanced parameter validation
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10));

    // ✅ Enhanced filter validation
    const filter = {};

    if (role) {
      if (Object.values(constants.USER_ROLES).includes(role)) {
        filter.role = role;
      } else {
        return res.status(400).json({
          success: false,
          message: 'Invalid role filter',
          validRoles: Object.values(constants.USER_ROLES),
        });
      }
    }

    if (status) {
      if (Object.values(constants.USER_STATUSES).includes(status)) {
      if (Object.values(constants.USER_STATUSES).includes(status)) {
        filter.status = status;
      } else {
        return res.status(400).json({
          success: false,
          message: 'Invalid status filter',
          validStatuses: Object.values(constants.USER_STATUSES),
          validStatuses: Object.values(constants.USER_STATUSES),
        });
      }
    }

    if (search && search.trim()) {
      const searchTerm = search.trim();
      if (searchTerm.length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Search term must be at least 2 characters',
        });
      }
      filter.email = { $regex: searchTerm, $options: 'i' };
    }

    const skip = (pageNum - 1) * limitNum;

    // ✅ Enhanced database queries with error handling
    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password -otp_login -otp_reset')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean()
        .catch((err) => {
          console.error('Database query error (users):', err);
          throw new Error('Failed to fetch users');
        }),
      User.countDocuments(filter).catch((err) => {
        console.error('Database query error (count):', err);
        throw new Error('Failed to count users');
      }),
    ]);

    // ✅ Enhanced audit logging
    console.log('✅ User list accessed successfully:', {
      accessedBy: {
        userId: req.user.userId,
        email: req.user.email,
        role: req.user.role,
        isManager: req.user.is_manager,
      },
      query: {
        page: pageNum,
        limit: limitNum,
        filters: { role, status, search: !!search },
      },
      results: {
        count: users.length,
        total: total,
      },
      timestamp: new Date().toISOString(),
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });

    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        current_page: pageNum,
        total_pages: Math.ceil(total / limitNum),
        total_records: total,
        per_page: limitNum,
        has_next_page: pageNum < Math.ceil(total / limitNum),
        has_prev_page: pageNum > 1,
      },
      metadata: {
        filters_applied: {
          role: !!role,
          status: !!status,
          search: !!search,
        },
        accessed_by: {
          userId: req.user.userId,
          role: req.user.role,
          isManager: req.user.is_manager,
        },
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('❌ Get all users error:', {
      message: error.message,
      stack: error.stack,
      userId: req.user?.userId,
      query: req.query,
      timestamp: new Date().toISOString(),
    });

    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
    });
  }
};

const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select('-password -otp_login -otp_reset');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, role, is_manager, status } = req.body;

    // Kiểm tra user tồn tại
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Kiểm tra email trùng lặp (nếu có thay đổi email)
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email already exists',
        });
      }
    }

    // Cập nhật thông tin
    const updateData = {};
    if (email) updateData.email = email;
    if (role) updateData.role = role;
    if (typeof is_manager !== 'undefined') updateData.is_manager = is_manager;
    if (status) updateData.status = status;

    const updatedUser = await User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).select('-password -otp_login -otp_reset');

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser,
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map((err) => err.message),
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};
const changePassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    // Kiểm tra user tồn tại
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Kiểm tra mật khẩu hiện tại
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    // Hash mật khẩu mới
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Cập nhật mật khẩu
    await User.findByIdAndUpdate(id, { password: hashedNewPassword });

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};
const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Kiểm tra status hợp lệ
    if (!Object.values(constants.USER_STATUSES).includes(status)) {
    if (!Object.values(constants.USER_STATUSES).includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${Object.values(constants.USER_STATUSES).join(', ')}`,
        message: `Invalid status. Must be one of: ${Object.values(constants.USER_STATUSES).join(', ')}`,
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true },
    ).select('-password -otp_login -otp_reset');

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      message: `User status updated to ${status}`,
      data: updatedUser,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Soft delete - chuyển status thành INACTIVE
    await User.findByIdAndUpdate(id, {
      status: constants.USER_STATUSES.INACTIVE,
    });

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};
const generateResetOTP = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Tạo OTP
    const otpCode = generateOTP();
    const expiryTime = new Date(Date.now() + 10 * 60 * 1000); // 10 phút

    // Cập nhật OTP reset
    await User.findByIdAndUpdate(user._id, {
      otp_reset: {
        code: otpCode,
        expiry_time: expiryTime,
      },
    });

    // TODO: Gửi OTP qua email (implement email service)
    console.log(`Reset OTP for ${email}: ${otpCode}`);

    res.status(200).json({
      success: true,
      message: 'Reset OTP sent successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};
module.exports = {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  changePassword,
  toggleUserStatus,
  deleteUser,
  generateResetOTP,
};
