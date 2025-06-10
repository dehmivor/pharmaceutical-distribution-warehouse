const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const authService = {
  /**
   * Đăng ký người dùng mới
   * @param {Object} userData - { fullName, email, password, role }
   * @returns {Promise<Object>} - Thông tin người dùng vừa tạo (không trả về password)
   */
  register: async (userData) => {
    const { fullName, email, password, role } = userData;

    // Kiểm tra email đã tồn tại chưa
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new Error('Email đã được sử dụng');
    }

    // Mã hóa mật khẩu
    const hashedPassword = await bcrypt.hash(password, 10);

    // Tạo user mới
    const newUser = new User({
      fullName,
      email,
      password: hashedPassword,
      role: role || 'user',
    });

    await newUser.save();

    // Trả về thông tin user (không bao gồm password)
    const userResult = newUser.toObject();
    delete userResult.password;

    return { user: userResult };
  },

  login: async ({ email, password }) => {
    // 1. Tìm user theo email
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      throw new Error('Email không tồn tại');
    }

    // 2. So sánh mật khẩu
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new Error('Mật khẩu không chính xác');
    }

    // 3. Tạo JWT token
    const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: '1d',
    });

    // 4. Trả về thông tin (không bao gồm password)
    const userData = user.toObject();
    delete userData.password;

    return {
      user: userData,
      token,
    };
  },
};

module.exports = authService;
