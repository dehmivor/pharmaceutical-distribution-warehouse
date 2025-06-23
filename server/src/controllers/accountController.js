const accountService = require('../services/accountService');
const {
  sendActivationEmail,
  sendAccountActivatedNotification,
  sendActivationNotificationToSupervisor,
} = require('../services/emailService');
const { validationResult } = require('express-validator');
const crypto = require('crypto');

// Helper function để tạo activation token và OTP
const generateActivationData = () => {
  const activationToken = crypto.randomBytes(32).toString('hex');
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  return { activationToken, otp };
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

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }

    // Generate activation data
    const { activationToken, otp } = generateActivationData();

    // Send activation email
    try {
      await sendActivationEmail(
        result.data.email,
        activationToken,
        otp,
        result.data.temporaryPassword,
        result.data.role,
        supervisor.name || supervisor.email,
      );

      // Notify supervisor về việc tạo tài khoản thành công
      await sendActivationNotificationToSupervisor(
        supervisor.email,
        result.data.email,
        result.data.name || 'New User',
        result.data.role,
      );

      console.log(`✅ Activation email sent to: ${result.data.email}`);
    } catch (emailError) {
      console.error('❌ Email sending failed:', emailError);
      // Không fail account creation, chỉ log error
    }

    // Remove sensitive data from response
    const responseData = { ...result.data };
    delete responseData.temporaryPassword;

    return res.status(201).json({
      success: true,
      message: 'Account created successfully. Activation email sent.',
      data: responseData,
    });
  } catch (error) {
    console.error('Error in createSingleAccount:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// 2. Tạo tài khoản hàng loạt
const createBulkAccounts = async (req, res) => {
  try {
    const validationError = handleValidationErrors(req, res);
    if (validationError) return validationError;

    const bulkData = req.body;
    const supervisor = req.user;

    if (supervisor.role !== 'supervisor') {
      return res.status(403).json({
        success: false,
        message: 'Only supervisors can create bulk accounts',
      });
    }

    // Call service
    const result = await accountService.createBulkAccounts(bulkData);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }

    // Send activation emails for successful accounts
    const emailPromises = result.data.created.map(async (account) => {
      try {
        const { activationToken, otp } = generateActivationData();

        await sendActivationEmail(
          account.email,
          activationToken,
          otp,
          account.temporaryPassword,
          account.role,
          supervisor.name || supervisor.email,
        );

        console.log(`✅ Activation email sent to: ${account.email}`);
      } catch (emailError) {
        console.error(`❌ Failed to send email to ${account.email}:`, emailError);
      }
    });

    // Wait for all emails to be sent
    await Promise.allSettled(emailPromises);

    // Remove sensitive data
    const responseData = {
      ...result.data,
      created: result.data.created.map((account) => {
        const { temporaryPassword, ...accountData } = account;
        return accountData;
      }),
    };

    return res.status(201).json({
      success: true,
      message: `${result.data.created.length} accounts created successfully. Activation emails sent.`,
      data: responseData,
    });
  } catch (error) {
    console.error('Error in createBulkAccounts:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
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
  createBulkAccounts,
  getAccounts,
  getAccountById,
  updateAccount,
  resetAccountPassword,
  deleteAccount,
  restoreAccount,
  getAccountStatistics,
};
