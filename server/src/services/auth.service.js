const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

class AuthService {
  /**
   * Đăng ký người dùng mới
   * @param {Object} userData - Thông tin người dùng
   * @returns {Promise<Object>} - Thông tin người dùng đã đăng ký
   */
  async register(userData) {
    try {
      // Kiểm tra xem email đã tồn tại chưa
      const existingUser = await User.findOne({ email: userData.email });
      if (existingUser) {
        throw new Error('Email đã được sử dụng');
      }

      // Mã hóa mật khẩu
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);

      // Tạo người dùng mới
      const newUser = new User({
        fullName: userData.fullName,
        email: userData.email,
        password: hashedPassword,
        role: userData.role || 'user',
      });

      // Lưu người dùng vào database
      const savedUser = await newUser.save();

      // Tạo JWT token
      const token = this.generateToken(savedUser);

      // Trả về thông tin người dùng (không bao gồm mật khẩu) và token
      const userResponse = savedUser.toObject();
      delete userResponse.password;

      return {
        user: userResponse,
        token,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Đăng nhập người dùng
   * @param {string} email - Email người dùng
   * @param {string} password - Mật khẩu người dùng
   * @returns {Promise<Object>} - Thông tin người dùng đã đăng nhập và token
   */
  async login(email, password) {
    try {
      // Tìm người dùng theo email
      const user = await User.findOne({ email });
      if (!user) {
        throw new Error('Email hoặc mật khẩu không chính xác');
      }

      // Kiểm tra mật khẩu
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new Error('Email hoặc mật khẩu không chính xác');
      }

      // Tạo JWT token
      const token = this.generateToken(user);

      // Trả về thông tin người dùng (không bao gồm mật khẩu) và token
      const userResponse = user.toObject();
      delete userResponse.password;

      return {
        user: userResponse,
        token,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Tạo JWT token
   * @param {Object} user - Thông tin người dùng
   * @returns {string} - JWT token
   */
  generateToken(user) {
    return jwt.sign({ id: user._id, email: user.email, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: '1d',
    });
  }

  /**
   * Xác thực token
   * @param {string} token - JWT token
   * @returns {Object} - Thông tin người dùng được giải mã từ token
   */
  verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      throw new Error('Token không hợp lệ');
    }
  }
}

module.exports = new AuthService();
