const authenticate = require('../../middlewares/authMiddleware');
const authService = require('../../services/authService');
const User = require('../../models/User');
const constants = require('../../utils/constants');

// Mock dependencies
jest.mock('../../services/authService');
jest.mock('../../models/User');
jest.mock('../../utils/constants', () => ({
  USER_STATUSES: {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
  },
}));

describe('Authentication Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock console methods
    console.log = jest.fn();
    console.error = jest.fn();

    // Setup request object
    req = {
      headers: {},
      cookies: {},
      ip: '127.0.0.1',
      path: '/api/test',
      get: jest.fn().mockReturnValue('test-user-agent'),
    };

    // Setup response object
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    // Setup next function
    next = jest.fn();
  });

  describe('Token Extraction', () => {
    it('should extract token from Authorization header', async () => {
      const token = 'valid-jwt-token';
      const decoded = { userId: 'user123' };
      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        role: 'user',
        status: constants.USER_STATUSES.ACTIVE,
        is_manager: false,
      };

      req.headers.authorization = `Bearer ${token}`;
      authService.verifyToken.mockResolvedValue(decoded);
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      await authenticate(req, res, next);

      expect(authService.verifyToken).toHaveBeenCalledWith(token);
      expect(next).toHaveBeenCalled();
    });

    it('should extract token from cookies', async () => {
      const token = 'valid-jwt-token';
      const decoded = { userId: 'user123' };
      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        role: 'user',
        status: constants.USER_STATUSES.ACTIVE,
        is_manager: false,
      };

      req.cookies['auth-token'] = token;
      authService.verifyToken.mockResolvedValue(decoded);
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      await authenticate(req, res, next);

      expect(authService.verifyToken).toHaveBeenCalledWith(token);
      expect(next).toHaveBeenCalled();
    });

    it('should prioritize Authorization header over cookies', async () => {
      const headerToken = 'header-token';
      const cookieToken = 'cookie-token';
      const decoded = { userId: 'user123' };
      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        role: 'user',
        status: constants.USER_STATUSES.ACTIVE,
        is_manager: false,
      };

      req.headers.authorization = `Bearer ${headerToken}`;
      req.cookies['auth-token'] = cookieToken;
      authService.verifyToken.mockResolvedValue(decoded);
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      await authenticate(req, res, next);

      expect(authService.verifyToken).toHaveBeenCalledWith(headerToken);
      expect(authService.verifyToken).not.toHaveBeenCalledWith(cookieToken);
    });
  });

  describe('Token Validation', () => {
    it('should return 401 when no token is provided', async () => {
      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access denied: No token provided',
      });
      expect(next).not.toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith(
        'Authentication failed: No token provided',
        expect.objectContaining({
          ip: '127.0.0.1',
          path: '/api/test',
        }),
      );
    });

    it('should return 401 when token is empty string', async () => {
      req.headers.authorization = 'Bearer ';

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access denied: No token provided',
      });
    });

    it('should return 401 when token is only whitespace', async () => {
      req.cookies['auth-token'] = '   ';

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access denied: No token provided',
      });
    });

    it('should return 401 when token verification fails', async () => {
      req.headers.authorization = 'Bearer invalid-token';
      authService.verifyToken.mockRejectedValue(new Error('JsonWebTokenError'));

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication failed',
      });
    });

    it('should return 401 when decoded data is null', async () => {
      req.headers.authorization = 'Bearer valid-token';
      authService.verifyToken.mockResolvedValue(null);

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid token payload',
      });
    });

    it('should return 401 when decoded data has no userId', async () => {
      req.headers.authorization = 'Bearer valid-token';
      authService.verifyToken.mockResolvedValue({ email: 'test@example.com' });

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid token payload',
      });
    });
  });

  describe('User Validation', () => {
    beforeEach(() => {
      req.headers.authorization = 'Bearer valid-token';
      authService.verifyToken.mockResolvedValue({ userId: 'user123' });
    });

    it('should return 401 when user is not found', async () => {
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'User not found',
      });
    });

    it('should return 401 when user is inactive', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        role: 'user',
        status: constants.USER_STATUSES.INACTIVE,
        is_manager: false,
      };

      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Account is inactive',
      });
    });

    it('should call User.findById with correct parameters', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        role: 'user',
        status: constants.USER_STATUSES.ACTIVE,
        is_manager: false,
      };

      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      await authenticate(req, res, next);

      expect(User.findById).toHaveBeenCalledWith('user123');
      expect(User.findById().select).toHaveBeenCalledWith('email role status is_manager');
    });
  });

  describe('Successful Authentication', () => {
    it('should attach user data to request and call next', async () => {
      const decoded = { userId: 'user123', exp: 1234567890 };
      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        role: 'admin',
        status: constants.USER_STATUSES.ACTIVE,
        is_manager: true,
      };

      req.headers.authorization = 'Bearer valid-token';
      authService.verifyToken.mockResolvedValue(decoded);
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      await authenticate(req, res, next);

      expect(req.user).toEqual({
        userId: 'user123',
        email: 'test@example.com',
        role: 'admin',
        is_manager: true,
        status: constants.USER_STATUSES.ACTIVE,
        tokenData: decoded,
      });
      expect(next).toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith(
        'Authentication successful',
        expect.objectContaining({
          userId: 'user123',
          email: 'test@example.com',
          role: 'admin',
          path: '/api/test',
        }),
      );
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      req.headers.authorization = 'Bearer some-token';
    });

    it('should handle JsonWebTokenError', async () => {
      const error = new Error('Invalid token');
      error.name = 'JsonWebTokenError';
      authService.verifyToken.mockRejectedValue(error);

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid token',
      });
    });

    it('should handle TokenExpiredError', async () => {
      const error = new Error('Token expired');
      error.name = 'TokenExpiredError';
      authService.verifyToken.mockRejectedValue(error);

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Token expired',
      });
    });

    it('should handle database errors', async () => {
      const decoded = { userId: 'user123' };
      authService.verifyToken.mockResolvedValue(decoded);
      User.findById.mockReturnValue({
        select: jest.fn().mockRejectedValue(new Error('Database error')),
      });

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication failed',
      });
      expect(console.error).toHaveBeenCalledWith(
        'Authentication error:',
        expect.objectContaining({
          message: 'Database error',
          ip: '127.0.0.1',
          path: '/api/test',
        }),
      );
    });

    it('should handle unknown errors', async () => {
      const error = new Error('Unknown error');
      authService.verifyToken.mockRejectedValue(error);

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication failed',
      });
    });
  });
});
