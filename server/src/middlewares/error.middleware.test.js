const errorHandler = require('../../middlewares/errorHandler');

describe('Error Handler Middleware', () => {
  let req, res, next, originalEnv, originalConsoleError;

  beforeEach(() => {
    // Save original environment and console.error
    originalEnv = process.env.NODE_ENV;
    originalConsoleError = console.error;

    // Mock console.error
    console.error = jest.fn();

    // Setup request object
    req = {
      method: 'GET',
      url: '/api/test',
      ip: '127.0.0.1',
    };

    // Setup response object
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    // Setup next function
    next = jest.fn();
  });

  afterEach(() => {
    // Restore original environment and console.error
    process.env.NODE_ENV = originalEnv;
    console.error = originalConsoleError;
    jest.clearAllMocks();
  });

  describe('Basic Error Handling', () => {
    it('should handle generic error with default values', () => {
      const error = new Error('Test error message');

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Test error message',
        stack: undefined,
      });
    });

    it('should use custom status code when provided', () => {
      const error = new Error('Custom error');
      error.statusCode = 404;

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Custom error',
        stack: undefined,
      });
    });

    it('should use default message when error message is empty', () => {
      const error = new Error('');

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Lỗi server',
        stack: undefined,
      });
    });

    it('should handle error without message property', () => {
      const error = {};

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Lỗi server',
        stack: undefined,
      });
    });
  });

  describe('Validation Error Handling', () => {
    it('should handle MongoDB ValidationError with single field', () => {
      const error = {
        name: 'ValidationError',
        errors: {
          email: {
            message: 'Email is required',
          },
        },
      };

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Email is required',
        stack: undefined,
      });
    });

    it('should handle ValidationError with multiple fields', () => {
      const error = {
        name: 'ValidationError',
        errors: {
          email: {
            message: 'Email is required',
          },
          password: {
            message: 'Password must be at least 6 characters',
          },
          name: {
            message: 'Name is required',
          },
        },
      };

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Email is required, Password must be at least 6 characters, Name is required',
        stack: undefined,
      });
    });

    it('should handle ValidationError with empty errors object', () => {
      const error = {
        name: 'ValidationError',
        errors: {},
      };

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '',
        stack: undefined,
      });
    });
  });

  describe('Cast Error Handling', () => {
    it('should handle MongoDB CastError', () => {
      const error = {
        name: 'CastError',
        value: '507f1f77bcf86cd799439011',
      };

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Không tìm thấy tài nguyên với id: 507f1f77bcf86cd799439011',
        stack: undefined,
      });
    });

    it('should handle CastError with null value', () => {
      const error = {
        name: 'CastError',
        value: null,
      };

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Không tìm thấy tài nguyên với id: null',
        stack: undefined,
      });
    });

    it('should handle CastError with undefined value', () => {
      const error = {
        name: 'CastError',
        value: undefined,
      };

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Không tìm thấy tài nguyên với id: undefined',
        stack: undefined,
      });
    });
  });

  describe('Duplicate Key Error Handling', () => {
    it('should handle MongoDB duplicate key error with single field', () => {
      const error = {
        code: 11000,
        keyPattern: {
          email: 1,
        },
      };

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Trùng lặp giá trị cho trường email',
        stack: undefined,
      });
    });

    it('should handle duplicate key error with multiple fields', () => {
      const error = {
        code: 11000,
        keyPattern: {
          email: 1,
          username: 1,
        },
      };

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Trùng lặp giá trị cho trường email, username',
        stack: undefined,
      });
    });

    it('should handle duplicate key error with empty keyPattern', () => {
      const error = {
        code: 11000,
        keyPattern: {},
      };

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Trùng lặp giá trị cho trường ',
        stack: undefined,
      });
    });
  });

  describe('JWT Error Handling', () => {
    it('should handle JsonWebTokenError', () => {
      const error = {
        name: 'JsonWebTokenError',
        message: 'invalid signature',
      };

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Token không hợp lệ',
        stack: undefined,
      });
    });

    it('should handle TokenExpiredError', () => {
      const error = {
        name: 'TokenExpiredError',
        message: 'jwt expired',
      };

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Token đã hết hạn',
        stack: undefined,
      });
    });
  });

  describe('Environment-based Behavior', () => {
    it('should include stack trace in development environment', () => {
      process.env.NODE_ENV = 'development';
      const error = new Error('Test error');
      error.stack = 'Error: Test error\n    at test.js:1:1';

      errorHandler(error, req, res, next);

      expect(console.error).toHaveBeenCalledWith(error);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Test error',
        stack: 'Error: Test error\n    at test.js:1:1',
      });
    });

    it('should not include stack trace in production environment', () => {
      process.env.NODE_ENV = 'production';
      const error = new Error('Test error');
      error.stack = 'Error: Test error\n    at test.js:1:1';

      errorHandler(error, req, res, next);

      expect(console.error).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Test error',
        stack: undefined,
      });
    });

    it('should not log error in production environment', () => {
      process.env.NODE_ENV = 'production';
      const error = new Error('Production error');

      errorHandler(error, req, res, next);

      expect(console.error).not.toHaveBeenCalled();
    });

    it('should handle undefined NODE_ENV as production', () => {
      delete process.env.NODE_ENV;
      const error = new Error('Test error');
      error.stack = 'Error stack trace';

      errorHandler(error, req, res, next);

      expect(console.error).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Test error',
        stack: undefined,
      });
    });
  });

  describe('Error Priority Handling', () => {
    it('should prioritize ValidationError over custom statusCode', () => {
      const error = {
        name: 'ValidationError',
        statusCode: 500,
        errors: {
          field: { message: 'Validation failed' },
        },
      };

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400); // ValidationError takes precedence
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation failed',
        stack: undefined,
      });
    });

    it('should prioritize CastError over custom statusCode', () => {
      const error = {
        name: 'CastError',
        statusCode: 500,
        value: 'invalid-id',
      };

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Không tìm thấy tài nguyên với id: invalid-id',
        stack: undefined,
      });
    });

    it('should handle multiple error conditions (first match wins)', () => {
      const error = {
        name: 'ValidationError',
        code: 11000,
        errors: {
          field: { message: 'Validation error' },
        },
        keyPattern: {
          email: 1,
        },
      };

      errorHandler(error, req, res, next);

      // ValidationError should take precedence over duplicate key error
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation error',
        stack: undefined,
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle error with null properties', () => {
      const error = {
        name: null,
        message: null,
        statusCode: null,
      };

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Lỗi server',
        stack: undefined,
      });
    });

    it('should handle error with zero statusCode', () => {
      const error = new Error('Test error');
      error.statusCode = 0;

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500); // 0 is falsy, so default to 500
    });

    it('should handle error with string statusCode', () => {
      const error = new Error('Test error');
      error.statusCode = '404';

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith('404');
    });

    it('should not call next() function', () => {
      const error = new Error('Test error');

      errorHandler(error, req, res, next);

      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('Response Format Consistency', () => {
    it('should always return consistent response format', () => {
      const testCases = [
        new Error('Generic error'),
        { name: 'ValidationError', errors: { field: { message: 'Invalid' } } },
        { name: 'CastError', value: 'invalid' },
        { code: 11000, keyPattern: { email: 1 } },
        { name: 'JsonWebTokenError' },
        { name: 'TokenExpiredError' },
      ];

      testCases.forEach((error, index) => {
        // Clear previous calls
        res.status.mockClear();
        res.json.mockClear();

        errorHandler(error, req, res, next);

        // Check that response format is consistent
        expect(res.status).toHaveBeenCalledTimes(1);
        expect(res.json).toHaveBeenCalledTimes(1);

        const responseCall = res.json.mock.calls[0][0];
        expect(responseCall).toHaveProperty('success', false);
        expect(responseCall).toHaveProperty('message');
        expect(responseCall).toHaveProperty('stack');
      });
    });
  });
});
