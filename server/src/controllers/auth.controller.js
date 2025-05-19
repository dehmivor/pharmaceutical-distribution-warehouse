const authService = require('../services/auth.service');

class AuthController {
  /**
   * Xử lý yêu cầu đăng ký
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async register(req, res) {
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
  }

  /**
   * Xử lý yêu cầu đăng nhập
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async login(req, res) {
    try {
      const { email, password } = req.body;

      // Kiểm tra dữ liệu đầu vào
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng cung cấp email và mật khẩu',
        });
      }

      // Đăng nhập người dùng thông qua service
      const result = await authService.login(email, password);

      return res.status(200).json({
        success: true,
        message: 'Đăng nhập thành công',
        data: result,
      });
    } catch (error) {
      console.error('Login error:', error.message);

      // Xử lý các lỗi phổ biến
      if (error.message.includes('Email hoặc mật khẩu không chính xác')) {
        return res.status(401).json({
          success: false,
          message: 'Email hoặc mật khẩu không chính xác',
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Đã xảy ra lỗi khi đăng nhập',
        error: error.message,
      });
    }
  }
}

module.exports = new AuthController();
