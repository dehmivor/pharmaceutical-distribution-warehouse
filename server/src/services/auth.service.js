const User = require('../models/user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const authService = {
  register: async (userData) => {
    const { fullName, email, password, role } = userData;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new Error('Email đã được sử dụng');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      fullName,
      email,
      password: hashedPassword,
      role: role || 'user',
    });

    await newUser.save();

    const userResult = newUser.toObject();
    delete userResult.password;

    return { user: userResult };
  },

  login: async ({ email, password }) => {
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      throw new Error('Email không tồn tại');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new Error('Mật khẩu không chính xác');
    }

    const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: '1d',
    });

    const userData = user.toObject();
    delete userData.password;

    return {
      user: userData,
      token,
    };
  },
};

module.exports = authService;
