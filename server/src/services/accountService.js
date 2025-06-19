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

// Helper: Tạo email với bí danh
const generateEmailWithAlias = (baseEmail, alias) => {
  if (!alias) return baseEmail;

  const [localPart, domain] = baseEmail.split('@');
  if (!domain) throw new Error('Invalid email format');

  return `${localPart}+${alias}@${domain}`;
};

// Helper: Trích xuất thông tin từ email có bí danh
const extractEmailInfo = (email) => {
  const [localPart, domain] = email.split('@');

  if (localPart.includes('+')) {
    const [originalLocal, alias] = localPart.split('+');
    return {
      originalEmail: `${originalLocal}@${domain}`,
      alias: alias,
      hasAlias: true,
    };
  }

  return {
    originalEmail: email,
    alias: null,
    hasAlias: false,
  };
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

// 1. Cấp tài khoản mới với role và bí danh
const provisionAccount = async (accountData) => {
  try {
    const {
      email,
      role,
      alias = null,
      is_manager = false,
      generatePassword = true,
      customPassword = null,
      permissions = [],
    } = accountData;

    // Validate input
    if (!email || !role) {
      throw new Error('Email and role are required');
    }

    // Validate role
    if (!Object.values(constants.USER_ROLES).includes(role)) {
      throw new Error(
        `Invalid role. Must be one of: ${Object.values(constants.USER_ROLES).join(', ')}`,
      );
    }

    // Tạo email với bí danh
    const finalEmail = generateEmailWithAlias(email, alias);

    // Kiểm tra email đã tồn tại
    const existingUser = await User.findOne({ email: finalEmail });
    if (existingUser) {
      throw new Error(`Email ${finalEmail} already exists`);
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
      email: finalEmail,
      password: hashedPassword,
      role,
      is_manager,
      status: constants.USER_STATUSES.ACTIVE,
    };

    const newUser = new User(userData);
    await newUser.save();

    // Chuẩn bị response
    const userResponse = newUser.toObject();
    delete userResponse.password;
    delete userResponse.otp_login;
    delete userResponse.otp_reset;

    const emailInfo = extractEmailInfo(finalEmail);

    return {
      success: true,
      data: {
        ...userResponse,
        ...emailInfo,
        temporaryPassword: generatePassword ? password : null,
        permissions: permissions,
      },
      message: 'Account provisioned successfully',
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
      data: null,
    };
  }
};

// 2. Cấp tài khoản hàng loạt với bí danh
const provisionBulkAccounts = async (bulkData) => {
  try {
    const { accounts, defaultRole = 'warehouse', defaultAlias = null } = bulkData;

    if (!Array.isArray(accounts) || accounts.length === 0) {
      throw new Error('Accounts array is required and must not be empty');
    }

    const results = [];
    const errors = [];

    for (const accountData of accounts) {
      try {
        const { email, role = defaultRole, alias = defaultAlias, is_manager = false } = accountData;

        const result = await provisionAccount({
          email,
          role,
          alias,
          is_manager,
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
      message: `Bulk provisioning completed. ${results.length} successful, ${errors.length} failed`,
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
      data: null,
    };
  }
};

// 3. Cập nhật quyền và thông tin tài khoản
const updateAccountPermissions = async (userId, updateData) => {
  try {
    const { role, is_manager, status, email, alias, permissions = [] } = updateData;

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

    // Cập nhật email với bí danh
    if (email) {
      const finalEmail = generateEmailWithAlias(email, alias);

      if (finalEmail !== user.email) {
        const existingUser = await User.findOne({ email: finalEmail });
        if (existingUser) {
          throw new Error(`Email ${finalEmail} already exists`);
        }
        updates.email = finalEmail;
      }
    }

    if (typeof is_manager !== 'undefined') updates.is_manager = is_manager;
    if (status) updates.status = status;

    // Thực hiện cập nhật
    const updatedUser = await User.findByIdAndUpdate(userId, updates, {
      new: true,
      runValidators: true,
    }).select('-password -otp_login -otp_reset');

    const emailInfo = extractEmailInfo(updatedUser.email);

    return {
      success: true,
      data: {
        ...updatedUser.toObject(),
        ...emailInfo,
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
    await User.findByIdAndUpdate(userId, { password: hashedPassword });

    const emailInfo = extractEmailInfo(user.email);

    return {
      success: true,
      data: {
        userId: user._id,
        email: user.email,
        ...emailInfo,
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

// 5. Lấy danh sách tài khoản theo role và bí danh
const getAccountsByRoleAndAlias = async (filters = {}) => {
  try {
    const {
      role,
      alias,
      is_manager,
      status,
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
    if (alias) {
      query.email = { $regex: `\\+${alias}@`, $options: 'i' };
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

    // Thêm thông tin email và bí danh
    const usersWithEmailInfo = users.map((user) => {
      const emailInfo = extractEmailInfo(user.email);
      return {
        ...user,
        ...emailInfo,
      };
    });

    return {
      success: true,
      data: usersWithEmailInfo,
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

module.exports = {
  provisionAccount,
  provisionBulkAccounts,
  updateAccountPermissions,
  resetAccountPassword,
  getAccountsByRoleAndAlias,
  // Helper functions (optional export)
  generateRandomPassword,
  generateEmailWithAlias,
  extractEmailInfo,
  validateRolePermissions,
};
