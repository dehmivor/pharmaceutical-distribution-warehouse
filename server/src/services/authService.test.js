// services/__tests__/authService.test.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authService = require('../authService');
const User = require('../../models/User');
const constants = require('../../utils/constants');
const { sendOTPEmail } = require('../../emailService');

// Mock các dependencies
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');
jest.mock('../models/User');
jest.mock('../services/emailService');

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
    process.env.REFRESH_TOKEN_SECRET = 'test-refresh-secret';
  });

  afterEach(() => {
    delete process.env.JWT_SECRET;
    delete process.env.REFRESH_TOKEN_SECRET;
  });

  describe('register', () => {
    const mockUserData = {
      email: 'test@example.com',
      password: 'password123',
      fullName: 'Test User',
      role: constants.USER_ROLES.VIEWER,
    };

    it('should register user successfully', async () => {
      const hashedPassword = 'hashed-password';
      const savedUser = {
        _id: 'user-id',
        email: 'test@example.com',
        role: constants.USER_ROLES.VIEWER,
        status: constants.BASIC_STATUSES.ACTIVE,
        is_manager: false,
      };

      User.findOne.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue(hashedPassword);
      User.prototype.save = jest.fn().mockResolvedValue(savedUser);

      const result = await authService.register(mockUserData);

      expect(result.success).toBe(true);
      expect(result.data.user.email).toBe('test@example.com');
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 12);
    });

    it('should return error if email is missing', async () => {
      const result = await authService.register({ password: 'password123' });

      expect(result.success).toBe(false);
      expect(result.message).toBe('Email và mật khẩu là bắt buộc');
    });

    it('should return error if user already exists', async () => {
      User.findOne.mockResolvedValue({ email: 'test@example.com' });

      const result = await authService.register(mockUserData);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Email đã được sử dụng');
    });

    it('should handle MongoDB duplicate key error', async () => {
      User.findOne.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue('hashed-password');
      User.prototype.save = jest.fn().mockRejectedValue({ code: 11000 });

      const result = await authService.register(mockUserData);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Email đã được sử dụng');
    });
  });

  describe('loginStep1', () => {
    const mockUser = {
      _id: 'user-id',
      email: 'test@example.com',
      password: 'hashed-password',
      status: constants.BASIC_STATUSES.ACTIVE,
    };

    it('should send OTP successfully', async () => {
      User.findOne.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);
      User.findByIdAndUpdate.mockResolvedValue();
      sendOTPEmail.mockResolvedValue();
      jwt.sign.mockReturnValue('temp-token');

      const result = await authService.loginStep1('test@example.com', 'password123');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Mã OTP đã được gửi đến email của bạn');
      expect(result.data.tempToken).toBe('temp-token');
      expect(sendOTPEmail).toHaveBeenCalled();
    });

    it('should return error for invalid credentials', async () => {
      User.findOne.mockResolvedValue(null);

      const result = await authService.loginStep1('test@example.com', 'wrongpassword');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Email hoặc mật khẩu không chính xác');
    });

    it('should return error for inactive user', async () => {
      const inactiveUser = { ...mockUser, status: constants.BASIC_STATUSES.INACTIVE };
      User.findOne.mockResolvedValue(inactiveUser);

      const result = await authService.loginStep1('test@example.com', 'password123');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Tài khoản đã bị khóa hoặc không hoạt động');
    });
  });

  describe('loginStep2', () => {
    const mockUser = {
      _id: 'user-id',
      email: 'test@example.com',
      role: constants.USER_ROLES.VIEWER,
      status: constants.BASIC_STATUSES.ACTIVE,
      is_manager: false,
      otp_login: {
        code: '123456',
        expiry_time: new Date(Date.now() + 5 * 60 * 1000),
      },
    };

    it('should verify OTP and return tokens successfully', async () => {
      jwt.verify.mockReturnValue({ userId: 'user-id', step: 'otp_verification' });
      User.findById.mockResolvedValue(mockUser);
      User.findByIdAndUpdate.mockResolvedValue();
      jwt.sign.mockReturnValueOnce('access-token').mockReturnValueOnce('refresh-token');

      const result = await authService.loginStep2('temp-token', '123456');

      expect(result.success).toBe(true);
      expect(result.data.token).toBe('access-token');
      expect(result.data.refreshToken).toBe('refresh-token');
    });

    it('should return error for invalid OTP', async () => {
      jwt.verify.mockReturnValue({ userId: 'user-id', step: 'otp_verification' });
      const userWithInvalidOTP = {
        ...mockUser,
        otp_login: { code: '654321', expiry_time: new Date(Date.now() + 5 * 60 * 1000) },
      };
      User.findById.mockResolvedValue(userWithInvalidOTP);

      const result = await authService.loginStep2('temp-token', '123456');

      expect(result.success).toBe(false);
      expect(result.message).toBe('OTP không hợp lệ hoặc đã hết hạn');
    });

    it('should return error for expired token', async () => {
      jwt.verify.mockImplementation(() => {
        throw new Error('Token expired');
      });

      const result = await authService.loginStep2('expired-token', '123456');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Token không hợp lệ hoặc đã hết hạn');
    });
  });

  describe('login', () => {
    const mockUser = {
      _id: 'user-id',
      email: 'test@example.com',
      password: 'hashed-password',
      role: constants.USER_ROLES.VIEWER,
      status: constants.BASIC_STATUSES.ACTIVE,
      is_manager: false,
    };

    it('should login successfully', async () => {
      User.findOne.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValueOnce('access-token').mockReturnValueOnce('refresh-token');

      const result = await authService.login('test@example.com', 'password123');

      expect(result.success).toBe(true);
      expect(result.data.user.email).toBe('test@example.com');
      expect(result.data.token).toBe('access-token');
      expect(result.data.refreshToken).toBe('refresh-token');
    });

    it('should return error for missing credentials', async () => {
      const result = await authService.login('', '');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Email và mật khẩu là bắt buộc');
    });

    it('should return error for wrong password', async () => {
      User.findOne.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(false);

      const result = await authService.login('test@example.com', 'wrongpassword');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Email hoặc mật khẩu không chính xác');
    });
  });

  describe('verifyToken', () => {
    const mockUser = {
      _id: 'user-id',
      status: constants.BASIC_STATUSES.ACTIVE,
    };

    it('should verify token successfully', async () => {
      const mockDecoded = {
        userId: 'user-id',
        email: 'test@example.com',
        role: constants.USER_ROLES.VIEWER,
        is_manager: false,
      };

      jwt.verify.mockReturnValue(mockDecoded);
      User.findById.mockResolvedValue(mockUser);

      const result = await authService.verifyToken('valid-token');

      expect(result.userId).toBe('user-id');
      expect(result.email).toBe('test@example.com');
    });

    it('should throw error for invalid token', async () => {
      jwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(authService.verifyToken('invalid-token')).rejects.toThrow();
    });

    it('should throw error if user not found', async () => {
      jwt.verify.mockReturnValue({ userId: 'user-id' });
      User.findById.mockResolvedValue(null);

      await expect(authService.verifyToken('valid-token')).rejects.toThrow('User not found');
    });
  });

  describe('refreshToken', () => {
    const mockUser = {
      _id: 'user-id',
      email: 'test@example.com',
      role: constants.USER_ROLES.VIEWER,
      status: constants.BASIC_STATUSES.ACTIVE,
      is_manager: false,
    };

    it('should refresh token successfully', async () => {
      jwt.verify.mockReturnValue({ userId: 'user-id' });
      User.findById.mockResolvedValue(mockUser);
      jwt.sign.mockReturnValueOnce('new-access-token').mockReturnValueOnce('new-refresh-token');

      const result = await authService.refreshToken('valid-refresh-token');

      expect(result.success).toBe(true);
      expect(result.data.token).toBe('new-access-token');
      expect(result.data.refreshToken).toBe('new-refresh-token');
    });

    it('should return error for invalid refresh token', async () => {
      jwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const result = await authService.refreshToken('invalid-refresh-token');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid refresh token');
    });
  });

  describe('getUserById', () => {
    const mockUser = {
      _id: 'user-id',
      email: 'test@example.com',
      role: constants.USER_ROLES.VIEWER,
      status: constants.BASIC_STATUSES.ACTIVE,
      is_manager: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should get user successfully', async () => {
      User.findById.mockResolvedValue(mockUser);

      const result = await authService.getUserById('user-id');

      expect(result.success).toBe(true);
      expect(result.data.user.email).toBe('test@example.com');
    });

    it('should return error if user not found', async () => {
      User.findById.mockResolvedValue(null);

      const result = await authService.getUserById('non-existent-id');

      expect(result.success).toBe(false);
      expect(result.message).toBe('User not found');
    });
  });

  describe('updateUser', () => {
    const mockUser = {
      _id: 'user-id',
      email: 'test@example.com',
      role: constants.USER_ROLES.ADMIN,
      status: constants.BASIC_STATUSES.ACTIVE,
      is_manager: true,
    };

    it('should update user successfully', async () => {
      User.findByIdAndUpdate.mockResolvedValue(mockUser);

      const updateData = { role: constants.USER_ROLES.ADMIN, is_manager: true };
      const result = await authService.updateUser('user-id', updateData);

      expect(result.success).toBe(true);
      expect(result.data.user.role).toBe(constants.USER_ROLES.ADMIN);
      expect(result.data.user.is_manager).toBe(true);
    });

    it('should return error if user not found', async () => {
      User.findByIdAndUpdate.mockResolvedValue(null);

      const result = await authService.updateUser('non-existent-id', { role: 'admin' });

      expect(result.success).toBe(false);
      expect(result.message).toBe('User not found');
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      jwt.verify.mockReturnValue({ userId: 'user-id' });

      const result = await authService.logout('valid-token');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Logout successful');
    });

    it('should handle logout without token', async () => {
      const result = await authService.logout();

      expect(result.success).toBe(true);
      expect(result.message).toBe('Logout successful');
    });
  });
});
