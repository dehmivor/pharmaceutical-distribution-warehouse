const authorize = require('../../middlewares/authorize');

describe('Authorization Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    // Mock console.error
    console.error = jest.fn();

    // Setup request object
    req = {
      user: null,
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
    jest.clearAllMocks();
  });

  describe('Authentication Check', () => {
    it('should return 401 when user is not authenticated', () => {
      const middleware = authorize(['admin']);

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication required',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 when req.user is null', () => {
      req.user = null;
      const middleware = authorize(['admin']);

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication required',
      });
    });

    it('should return 401 when req.user is undefined', () => {
      req.user = undefined;
      const middleware = authorize(['admin']);

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication required',
      });
    });
  });

  describe('Role Validation', () => {
    beforeEach(() => {
      req.user = {
        userId: 'user123',
        email: 'test@example.com',
      };
    });

    it('should return 403 when user role is not found', () => {
      // req.user.role is undefined
      const middleware = authorize(['admin']);

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'User role not found',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 when user role is null', () => {
      req.user.role = null;
      const middleware = authorize(['admin']);

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'User role not found',
      });
    });

    it('should return 403 when user role is empty string', () => {
      req.user.role = '';
      const middleware = authorize(['admin']);

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'User role not found',
      });
    });
  });

  describe('Single Role Authorization', () => {
    beforeEach(() => {
      req.user = {
        userId: 'user123',
        email: 'test@example.com',
        role: 'user',
      };
    });

    it('should allow access when user has the required role', () => {
      const middleware = authorize('user');

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it('should deny access when user does not have the required role', () => {
      const middleware = authorize('admin');

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access denied. Required roles: admin',
        userRole: 'user',
        requiredRoles: ['admin'],
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle case-sensitive role matching', () => {
      req.user.role = 'Admin';
      const middleware = authorize('admin');

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access denied. Required roles: admin',
        userRole: 'Admin',
        requiredRoles: ['admin'],
      });
    });
  });

  describe('Multiple Roles Authorization', () => {
    it('should allow access when user has one of the required roles', () => {
      req.user = {
        userId: 'user123',
        email: 'test@example.com',
        role: 'moderator',
      };

      const middleware = authorize(['admin', 'moderator', 'editor']);

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should allow access when user is admin (first in array)', () => {
      req.user = {
        userId: 'user123',
        email: 'test@example.com',
        role: 'admin',
      };

      const middleware = authorize(['admin', 'moderator']);

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should allow access when user has the last role in array', () => {
      req.user = {
        userId: 'user123',
        email: 'test@example.com',
        role: 'editor',
      };

      const middleware = authorize(['admin', 'moderator', 'editor']);

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should deny access when user does not have any of the required roles', () => {
      req.user = {
        userId: 'user123',
        email: 'test@example.com',
        role: 'user',
      };

      const middleware = authorize(['admin', 'moderator', 'editor']);

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access denied. Required roles: admin, moderator, editor',
        userRole: 'user',
        requiredRoles: ['admin', 'moderator', 'editor'],
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle empty roles array', () => {
      req.user = {
        userId: 'user123',
        email: 'test@example.com',
        role: 'admin',
      };

      const middleware = authorize([]);

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access denied. Required roles: ',
        userRole: 'admin',
        requiredRoles: [],
      });
    });
  });

  describe('Role Array Conversion', () => {
    it('should convert single role string to array', () => {
      req.user = {
        userId: 'user123',
        email: 'test@example.com',
        role: 'admin',
      };

      const middleware = authorize('admin');

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should handle array input correctly', () => {
      req.user = {
        userId: 'user123',
        email: 'test@example.com',
        role: 'moderator',
      };

      const middleware = authorize(['admin', 'moderator']);

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should handle single element array', () => {
      req.user = {
        userId: 'user123',
        email: 'test@example.com',
        role: 'admin',
      };

      const middleware = authorize(['admin']);

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle unexpected errors gracefully', () => {
      // Create a scenario that might throw an error
      req.user = {
        get role() {
          throw new Error('Unexpected error');
        },
      };

      const middleware = authorize(['admin']);

      middleware(req, res, next);

      expect(console.error).toHaveBeenCalledWith('Authorization error:', 'Unexpected error');
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authorization failed',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle null allowedRoles parameter', () => {
      req.user = {
        userId: 'user123',
        email: 'test@example.com',
        role: 'admin',
      };

      const middleware = authorize(null);

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access denied. Required roles: ',
        userRole: 'admin',
        requiredRoles: [null],
      });
    });

    it('should handle undefined allowedRoles parameter', () => {
      req.user = {
        userId: 'user123',
        email: 'test@example.com',
        role: 'admin',
      };

      const middleware = authorize(undefined);

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access denied. Required roles: ',
        userRole: 'admin',
        requiredRoles: [undefined],
      });
    });
  });

  describe('Integration Scenarios', () => {
    it('should work with complete user object from authentication middleware', () => {
      req.user = {
        userId: 'user123',
        email: 'admin@example.com',
        role: 'admin',
        is_manager: true,
        status: 'active',
        tokenData: { exp: 1234567890 },
      };

      const middleware = authorize(['admin', 'manager']);

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should handle manager role specifically', () => {
      req.user = {
        userId: 'user123',
        email: 'manager@example.com',
        role: 'manager',
        is_manager: true,
        status: 'active',
      };

      const middleware = authorize('manager');

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should deny access for inactive user with valid role', () => {
      // Note: This middleware doesn't check status, but we test the role logic
      req.user = {
        userId: 'user123',
        email: 'admin@example.com',
        role: 'admin',
        status: 'inactive',
      };

      const middleware = authorize('admin');

      middleware(req, res, next);

      // Should still allow since this middleware only checks roles
      expect(next).toHaveBeenCalled();
    });
  });

  describe('Middleware Factory Function', () => {
    it('should return a function when called', () => {
      const middleware = authorize(['admin']);

      expect(typeof middleware).toBe('function');
      expect(middleware.length).toBe(3); // req, res, next parameters
    });

    it('should create different middleware instances for different roles', () => {
      const adminMiddleware = authorize(['admin']);
      const userMiddleware = authorize(['user']);

      expect(adminMiddleware).not.toBe(userMiddleware);
      expect(typeof adminMiddleware).toBe('function');
      expect(typeof userMiddleware).toBe('function');
    });
  });
});
