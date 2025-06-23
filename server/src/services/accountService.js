const User = require('../models/User');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const constants = require('../utils/constants');

// Helper: Tạo password ngẫu nhiên
const generateRandomPassword = (length = 12) => {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
};

// Helper: Validate email format
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Helper: Validate role permissions
const validateRolePermissions = (role, requestedPermissions = []) => {
  const roleHierarchy = {
    supervisor: ['supervisor', 'representative', 'warehouse'],
    representative: ['representative'],
    warehouse: ['warehouse'],
  };

  const allowedRoles = roleHierarchy[role] || [];
  return requestedPermissions.every((permission) => allowedRoles.includes(permission));
};

// 1. Cấp tài khoản mới
const createAccount = async (accountData) => {
  try {
    const {
      email,
      role,
      is_manager = false,
      generatePassword = true,
      customPassword = null,
      permissions = [],
      status = constants.BASIC_STATUSES.ACTIVE,
    } = accountData;

    // Validate input
    if (!email || !role) {
      throw new Error('Email and role are required');
    }

    // Validate email format
    if (!validateEmail(email)) {
      throw new Error('Invalid email format');
    }

    // Validate role
    if (!Object.values(constants.USER_ROLES).includes(role)) {
      throw new Error(
        `Invalid role. Must be one of: ${Object.values(constants.USER_ROLES).join(', ')}`,
      );
    }

    // Kiểm tra email đã tồn tại
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw new Error(`Email ${email} already exists`);
    }

    // Validate permissions theo role
    if (permissions.length > 0 && !validateRolePermissions(role, permissions)) {
      throw new Error(`Invalid permissions for role ${role}`);
    }

    // Tạo password
    let password;
    if (generatePassword) {
      password = generateRandomPassword();
    } else if (customPassword) {
      password = customPassword;
    } else {
      throw new Error('Password is required when generatePassword is false');
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Tạo user mới
    const userData = {
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
      is_manager,
      status,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const newUser = new User(userData);
    await newUser.save();

    // Chuẩn bị response
    const userResponse = newUser.toObject();
    delete userResponse.password;
    delete userResponse.otp_login;
    delete userResponse.otp_reset;

    return {
      success: true,
      data: {
        ...userResponse,
        temporaryPassword: generatePassword ? password : null,
        permissions: permissions,
      },
      message: 'Account created successfully',
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
      data: null,
    };
  }
};

// 2. Cấp tài khoản hàng loạt
const createBulkAccounts = async (bulkData) => {
  try {
    const { accounts, defaultRole = 'warehouse' } = bulkData;

    if (!Array.isArray(accounts) || accounts.length === 0) {
      throw new Error('Accounts array is required and must not be empty');
    }

    const results = [];
    const errors = [];

    for (const accountData of accounts) {
      try {
        const { email, role = defaultRole, is_manager = false, permissions = [] } = accountData;

        const result = await createAccount({
          email,
          role,
          is_manager,
          permissions,
          generatePassword: true,
        });

        if (result.success) {
          results.push(result.data);
        } else {
          errors.push({
            email,
            error: result.message,
          });
        }
      } catch (error) {
        errors.push({
          email: accountData.email || 'unknown',
          error: error.message,
        });
      }
    }

    return {
      success: true,
      data: {
        created: results,
        errors: errors,
        summary: {
          total: accounts.length,
          successful: results.length,
          failed: errors.length,
        },
      },
      message: `Bulk account creation completed. ${results.length} successful, ${errors.length} failed`,
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
      data: null,
    };
  }
};

// 3. Cập nhật thông tin tài khoản
const updateAccount = async (userId, updateData) => {
  try {
    const { role, is_manager, status, email, permissions = [] } = updateData;

    // Kiểm tra user tồn tại
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const updates = {};

    // Cập nhật role và validate permissions
    if (role) {
      if (!Object.values(constants.USER_ROLES).includes(role)) {
        throw new Error(
          `Invalid role. Must be one of: ${Object.values(constants.USER_ROLES).join(', ')}`,
        );
      }

      if (permissions.length > 0 && !validateRolePermissions(role, permissions)) {
        throw new Error(`Invalid permissions for role ${role}`);
      }

      updates.role = role;
    }

    // Cập nhật email
    if (email && email !== user.email) {
      if (!validateEmail(email)) {
        throw new Error('Invalid email format');
      }

      const normalizedEmail = email.toLowerCase();
      const existingUser = await User.findOne({
        email: normalizedEmail,
        _id: { $ne: userId },
      });

      if (existingUser) {
        throw new Error(`Email ${email} already exists`);
      }

      updates.email = normalizedEmail;
    }

    if (typeof is_manager !== 'undefined') updates.is_manager = is_manager;
    if (status) updates.status = status;
    updates.updatedAt = new Date();

    // Thực hiện cập nhật
    const updatedUser = await User.findByIdAndUpdate(userId, updates, {
      new: true,
      runValidators: true,
    }).select('-password -otp_login -otp_reset');

    return {
      success: true,
      data: {
        ...updatedUser.toObject(),
        permissions: permissions,
      },
      message: 'Account updated successfully',
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
      data: null,
    };
  }
};

// 4. Đặt lại password cho tài khoản
const resetAccountPassword = async (userId, options = {}) => {
  try {
    const { generateNew = true, customPassword = null } = options;

    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    let newPassword;
    if (generateNew) {
      newPassword = generateRandomPassword();
    } else if (customPassword) {
      newPassword = customPassword;
    } else {
      throw new Error('Password is required when generateNew is false');
    }

    // Hash password mới
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Cập nhật password
    await User.findByIdAndUpdate(userId, {
      password: hashedPassword,
      updatedAt: new Date(),
    });

    return {
      success: true,
      data: {
        userId: user._id,
        email: user.email,
        newPassword: newPassword,
        passwordResetAt: new Date(),
      },
      message: 'Password reset successfully',
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
      data: null,
    };
  }
};

// 5. Lấy danh sách tài khoản với filter
const getAccounts = async (filters = {}) => {
  try {
    const {
      role,
      is_manager,
      status,
      email,
      search,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filters;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    // Xây dựng query filter
    const query = {};

    if (role) query.role = role;
    if (typeof is_manager !== 'undefined') query.is_manager = is_manager;
    if (status) query.status = status;
    if (email) query.email = { $regex: email, $options: 'i' };

    // Search trong email và role
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { role: { $regex: search, $options: 'i' } },
      ];
    }

    // Xây dựng sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Thực hiện query
    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password -otp_login -otp_reset')
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      User.countDocuments(query),
    ]);

    return {
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
      filters: filters,
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
      data: null,
    };
  }
};

// 6. Xóa tài khoản (soft delete)
const deleteAccount = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Soft delete - cập nhật status thành 'deleted'
    await User.findByIdAndUpdate(userId, {
      status: 'deleted',
      updatedAt: new Date(),
    });

    return {
      success: true,
      data: {
        userId: user._id,
        email: user.email,
        deletedAt: new Date(),
      },
      message: 'Account deleted successfully',
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
      data: null,
    };
  }
};

// 7. Khôi phục tài khoản đã xóa
const restoreAccount = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (user.status !== 'deleted') {
      throw new Error('Account is not in deleted state');
    }

    await User.findByIdAndUpdate(userId, {
      status: constants.BASIC_STATUSES.ACTIVE,
      updatedAt: new Date(),
    });

    return {
      success: true,
      data: {
        userId: user._id,
        email: user.email,
        restoredAt: new Date(),
      },
      message: 'Account restored successfully',
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
      data: null,
    };
  }
};

// 8. Lấy thông tin chi tiết một tài khoản
const getAccountById = async (userId) => {
  try {
    const user = await User.findById(userId).select('-password -otp_login -otp_reset').lean();

    if (!user) {
      throw new Error('User not found');
    }

    return {
      success: true,
      data: user,
      message: 'Account retrieved successfully',
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
      data: null,
    };
  }
};

// 9. Thống kê tài khoản theo role
const getAccountStatistics = async () => {
  try {
    const stats = await User.aggregate([
      {
        $group: {
          _id: '$role',
          total: { $sum: 1 },
          active: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] },
          },
          inactive: {
            $sum: { $cond: [{ $eq: ['$status', 'inactive'] }, 1, 0] },
          },
          managers: {
            $sum: { $cond: ['$is_manager', 1, 0] },
          },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    const totalUsers = await User.countDocuments();

    return {
      success: true,
      data: {
        total_users: totalUsers,
        by_role: stats,
        summary: {
          active_users: await User.countDocuments({ status: 'active' }),
          inactive_users: await User.countDocuments({ status: 'inactive' }),
          deleted_users: await User.countDocuments({ status: 'deleted' }),
          total_managers: await User.countDocuments({ is_manager: true }),
        },
      },
      message: 'Statistics retrieved successfully',
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
      data: null,
    };
  }
};

module.exports = {
  // Core functions
  createAccount,
  createBulkAccounts,
  updateAccount,
  resetAccountPassword,
  getAccounts,
  deleteAccount,
  restoreAccount,
  getAccountById,
  getAccountStatistics,

  // Helper functions
  generateRandomPassword,
  validateEmail,
  validateRolePermissions,
};
