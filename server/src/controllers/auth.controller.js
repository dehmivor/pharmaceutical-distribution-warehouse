const authService = require('../services/auth.service');

/**
 * Xử lý yêu cầu đăng ký
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const register = async (req, res) => {
  try {
    const { fullName, email, password, role } = req.body;

    // Kiểm tra dữ liệu đầu vào
    if (!fullName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ thông tin đăng ký',
      });
    }

    // Đăng ký người dùng thông qua service
    const result = await authService.register({
      fullName,
      email,
      password,
      role,
    });

    return res.status(201).json({
      success: true,
      message: 'Đăng ký thành công',
      data: result,
    });
  } catch (error) {
    console.error('Register error:', error.message);

    // Xử lý các lỗi phổ biến
    if (error.message.includes('Email đã được sử dụng')) {
      return res.status(409).json({
        success: false,
        message: 'Email đã được sử dụng',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi đăng ký',
      error: error.message,
    });
  }
};

/**
 * Xử lý yêu cầu đăng nhập
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập email và mật khẩu',
      });
    }

    const result = await authService.login({ email, password });

    return res.json({
      success: true,
      message: 'Đăng nhập thành công',
      data: result,
    });
  } catch (error) {
    console.error('Login error:', error.message);

    // Xử lý các lỗi cụ thể
    const errorMessages = {
      'Email không tồn tại': 404,
      'Mật khẩu không chính xác': 401,
    };

    const statusCode = errorMessages[error.message] || 500;

    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Lỗi đăng nhập',
    });
  }
};
module.exports = {
  register,
  login,
};
