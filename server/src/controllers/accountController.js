const UserService = require('../services/accountService');
const { validationResult } = require('express-validator');

// Helper: Xử lý validation errors
const handleValidationErrors = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array(),
    });
  }
  return null;
};

// Helper: Xử lý response
const sendResponse = (res, result, successStatus = 200) => {
  if (result.success) {
    return res.status(successStatus).json(result);
  } else {
    const statusCode = result.message.includes('not found')
      ? 404
      : result.message.includes('already exists')
        ? 409
        : 400;
    return res.status(statusCode).json(result);
  }
};

// 1. Cấp tài khoản đơn lẻ
const provisionSingleAccount = async (req, res) => {
  try {
    // Kiểm tra validation errors
    const validationError = handleValidationErrors(req, res);
    if (validationError) return validationError;

    const {
      email,
      role,
      alias,
      is_manager,
      generatePassword = true,
      customPassword,
      permissions,
    } = req.body;

    const accountData = {
      email,
      role,
      alias,
      is_manager,
      generatePassword,
      customPassword,
      permissions,
    };

    const result = await UserService.provisionAccount(accountData);

    // Log activity
    console.log(`Account provision attempt for ${email} by user ${req.user?.id || 'system'}`);

    return sendResponse(res, result, 201);
  } catch (error) {
    console.error('Error in provisionSingleAccount:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// 2. Cấp tài khoản hàng loạt
const provisionBulkAccounts = async (req, res) => {
  try {
    const validationError = handleValidationErrors(req, res);
    if (validationError) return validationError;

    const { accounts, defaultRole, defaultAlias } = req.body;

    if (!Array.isArray(accounts) || accounts.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Accounts array is required and must not be empty',
      });
    }

    // Giới hạn số lượng accounts có thể tạo cùng lúc
    if (accounts.length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Maximum 100 accounts can be provisioned at once',
      });
    }

    const bulkData = {
      accounts,
      defaultRole,
      defaultAlias,
    };

    const result = await UserService.provisionBulkAccounts(bulkData);

    // Log activity
    console.log(
      `Bulk account provision: ${accounts.length} accounts by user ${req.user?.id || 'system'}`,
    );

    return sendResponse(res, result, 201);
  } catch (error) {
    console.error('Error in provisionBulkAccounts:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// 3. Cập nhật quyền tài khoản
const updateAccountPermissions = async (req, res) => {
  try {
    const validationError = handleValidationErrors(req, res);
    if (validationError) return validationError;

    const { id } = req.params;
    const updateData = req.body;

    // Validate ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format',
      });
    }

    const result = await UserService.updateAccountPermissions(id, updateData);

    // Log activity
    console.log(`Account update for user ${id} by ${req.user?.id || 'system'}`);

    return sendResponse(res, result);
  } catch (error) {
    console.error('Error in updateAccountPermissions:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// 4. Đặt lại password
const resetAccountPassword = async (req, res) => {
  try {
    const validationError = handleValidationErrors(req, res);
    if (validationError) return validationError;

    const { id } = req.params;
    const { generateNew = true, customPassword } = req.body;

    // Validate ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format',
      });
    }

    const options = { generateNew, customPassword };
    const result = await UserService.resetAccountPassword(id, options);

    // Log activity (không log password)
    console.log(`Password reset for user ${id} by ${req.user?.id || 'system'}`);

    return sendResponse(res, result);
  } catch (error) {
    console.error('Error in resetAccountPassword:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// 5. Lấy danh sách tài khoản theo filter
const getAccountsByFilter = async (req, res) => {
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
    } = req.query;

    // Validate pagination parameters
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10));

    // Validate sort parameters
    const allowedSortFields = ['createdAt', 'email', 'role', 'status'];
    const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const validSortOrder = ['asc', 'desc'].includes(sortOrder) ? sortOrder : 'desc';

    const filters = {
      role,
      alias,
      is_manager: is_manager !== undefined ? is_manager === 'true' : undefined,
      status,
      page: pageNum,
      limit: limitNum,
      sortBy: validSortBy,
      sortOrder: validSortOrder,
    };

    const result = await UserService.getAccountsByRoleAndAlias(filters);

    return sendResponse(res, result);
  } catch (error) {
    console.error('Error in getAccountsByFilter:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// 6. Lấy thông tin tài khoản theo ID
const getAccountById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format',
      });
    }

    const result = await UserService.getAccountsByRoleAndAlias({
      page: 1,
      limit: 1,
    });

    if (result.success && result.data.length > 0) {
      const user = result.data.find((u) => u._id.toString() === id);
      if (user) {
        return res.status(200).json({
          success: true,
          data: user,
          message: 'Account retrieved successfully',
        });
      }
    }

    return res.status(404).json({
      success: false,
      message: 'Account not found',
    });
  } catch (error) {
    console.error('Error in getAccountById:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// 7. Cấp tài khoản với bí danh PDWA (shortcut)
const provisionPdwaAccount = async (req, res) => {
  try {
    const validationError = handleValidationErrors(req, res);
    if (validationError) return validationError;

    const { email, role = 'warehouse', is_manager = false } = req.body;

    const accountData = {
      email,
      role,
      alias: 'pdwa', // Fixed alias for PDWA accounts
      is_manager,
      generatePassword: true,
    };

    const result = await UserService.provisionAccount(accountData);

    // Log activity
    console.log(`PDWA account provision for ${email} by user ${req.user?.id || 'system'}`);

    return sendResponse(res, result, 201);
  } catch (error) {
    console.error('Error in provisionPdwaAccount:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// 8. Lấy thống kê tài khoản (bonus function)
const getAccountStatistics = async (req, res) => {
  try {
    const result = await UserService.getAccountStatistics();
    return sendResponse(res, result);
  } catch (error) {
    console.error('Error in getAccountStatistics:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

module.exports = {
  provisionSingleAccount,
  provisionBulkAccounts,
  updateAccountPermissions,
  resetAccountPassword,
  getAccountsByFilter,
  getAccountById,
  provisionPdwaAccount,
  getAccountStatistics,
};
