const { User } = require('../models');
const accountService = require('../services/accountService');
const {
  sendActivationEmail,
  sendAccountActivatedNotification,
  sendActivationNotificationToSupervisor,
} = require('../services/emailService');
const { validationResult } = require('express-validator');

// Helper function để tạo activation token và OTP
const generateActivationData = () => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  return { otp };
};

// Helper function để xử lý validation errors
const handleValidationErrors = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }
  return null;
};

// 1. Tạo tài khoản đơn lẻ
const createSingleAccount = async (req, res) => {
  try {
    console.log('📧 Create account request received');

    // Check validation errors
    const validationError = handleValidationErrors(req, res);
    if (validationError) return validationError;

    const accountData = req.body;
    const supervisor = req.user;

    // Check supervisor permissions
    if (supervisor.role !== 'supervisor') {
      return res.status(403).json({
        success: false,
        message: 'Only supervisors can create accounts',
      });
    }

    // Add created_by field
    accountData.created_by = supervisor._id;

    // Call service to create account
    const result = await accountService.createAccount(accountData);

    // Generate activation data from result
    const { activationOtp } = result.data;

    // Send activation email
    try {
      await sendActivationEmail(
        result.data.email,
        null, // no activation token needed
        activationOtp,
        result.data.temporaryPassword,
        result.data.role,
        supervisor.name || supervisor.email,
      );

      // Notify supervisor
      await sendActivationNotificationToSupervisor(
        supervisor.email,
        result.data.email,
        result.data.name || 'New User',
        result.data.role,
      );

      console.log(`✅ Activation email sent to: ${result.data.email}`);
    } catch (emailError) {
      console.error('❌ Email sending failed:', emailError);
      // Don't fail account creation, just log error
    }

    // Remove sensitive data from response
    const responseData = { ...result.data };
    delete responseData.temporaryPassword;
    delete responseData.activationOtp;

    return res.status(201).json({
      success: true,
      message: 'Account created successfully. Activation email sent.',
      data: responseData,
    });
  } catch (error) {
    console.error('❌ Error in createSingleAccount controller:', error);

    // Handle specific error types
    let statusCode = 500;
    let message = 'Internal server error';

    if (error.message) {
      statusCode = 400;
      message = error.message;

      // Specific error handling
      if (error.message.includes('already exists')) {
        statusCode = 409; // Conflict
      } else if (error.message.includes('Invalid role')) {
        statusCode = 400; // Bad Request
      } else if (error.message.includes('permissions')) {
        statusCode = 403; // Forbidden
      }
    }

    return res.status(statusCode).json({
      success: false,
      message: message,
      error:
        process.env.NODE_ENV === 'development'
          ? {
              message: error.message,
              stack: error.stack,
            }
          : undefined,
    });
  }
};

// 3. Lấy danh sách tài khoản
const getAccounts = async (req, res) => {
  try {
    const validationError = handleValidationErrors(req, res);
    if (validationError) return validationError;

    const filters = req.query;
    const result = await accountService.getAccounts(filters);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }

    return res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination,
      filters: result.filters,
      message: `Retrieved ${result.data.length} accounts`,
    });
  } catch (error) {
    console.error('Error in getAccounts:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// 4. Lấy thông tin tài khoản theo ID
const getAccountById = async (req, res) => {
  try {
    const validationError = handleValidationErrors(req, res);
    if (validationError) return validationError;

    const { id } = req.params;
    const result = await accountService.getAccountById(id);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        message: result.message,
      });
    }

    return res.status(200).json({
      success: true,
      data: result.data,
      message: 'Account retrieved successfully',
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

// 5. Cập nhật tài khoản
const updateAccount = async (req, res) => {
  try {
    const validationError = handleValidationErrors(req, res);
    if (validationError) return validationError;

    const { id } = req.params;
    const updateData = req.body;
    const currentUser = req.user;

    // Check permissions
    if (currentUser.role !== 'supervisor' && currentUser._id.toString() !== id) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own account or you must be a supervisor',
      });
    }

    const result = await accountService.updateAccount(id, updateData);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }

    return res.status(200).json({
      success: true,
      data: result.data,
      message: 'Account updated successfully',
    });
  } catch (error) {
    console.error('Error in updateAccount:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// 6. Đặt lại password
const resetAccountPassword = async (req, res) => {
  try {
    const validationError = handleValidationErrors(req, res);
    if (validationError) return validationError;

    const { id } = req.params;
    const options = req.body;
    const currentUser = req.user;

    // Check permissions
    if (currentUser.role !== 'supervisor' && currentUser._id.toString() !== id) {
      return res.status(403).json({
        success: false,
        message: 'You can only reset your own password or you must be a supervisor',
      });
    }

    const result = await accountService.resetAccountPassword(id, options);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }

    // Don't return the actual password in response for security
    const responseData = { ...result.data };
    delete responseData.newPassword;

    return res.status(200).json({
      success: true,
      data: responseData,
      message: 'Password reset successfully',
    });
  } catch (error) {
    console.error('Error in resetAccountPassword:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// 7. Xóa tài khoản (soft delete)
const deleteAccount = async (req, res) => {
  try {
    const validationError = handleValidationErrors(req, res);
    if (validationError) return validationError;

    const { id } = req.params;
    const currentUser = req.user;

    // Only supervisors can delete accounts
    if (currentUser.role !== 'supervisor') {
      return res.status(403).json({
        success: false,
        message: 'Only supervisors can delete accounts',
      });
    }

    const result = await accountService.deleteAccount(id);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }

    return res.status(200).json({
      success: true,
      data: result.data,
      message: 'Account deleted successfully',
    });
  } catch (error) {
    console.error('Error in deleteAccount:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// 8. Khôi phục tài khoản
const restoreAccount = async (req, res) => {
  try {
    const validationError = handleValidationErrors(req, res);
    if (validationError) return validationError;

    const { id } = req.params;
    const currentUser = req.user;

    // Only supervisors can restore accounts
    if (currentUser.role !== 'supervisor') {
      return res.status(403).json({
        success: false,
        message: 'Only supervisors can restore accounts',
      });
    }

    const result = await accountService.restoreAccount(id);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }

    return res.status(200).json({
      success: true,
      data: result.data,
      message: 'Account restored successfully',
    });
  } catch (error) {
    console.error('Error in restoreAccount:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// 9. Lấy thống kê tài khoản
const getAccountStatistics = async (req, res) => {
  try {
    const currentUser = req.user;

    // Only supervisors can view statistics
    if (currentUser.role !== 'supervisor') {
      return res.status(403).json({
        success: false,
        message: 'Only supervisors can view account statistics',
      });
    }

    const result = await accountService.getAccountStatistics();

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }

    return res.status(200).json({
      success: true,
      data: result.data,
      message: 'Account statistics retrieved successfully',
    });
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
  createSingleAccount,
  getAccounts,
  getAccountById,
  updateAccount,
  resetAccountPassword,
  deleteAccount,
  restoreAccount,
  getAccountStatistics,
};
