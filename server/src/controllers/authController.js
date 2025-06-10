// controllers/authController.js
const authService = require('../services/authService');

const authController = {
  register: async (req, res) => {
    try {
      const { email, password, fullName, role } = req.body;

      // Validate input
      if (!email || !password || !fullName) {
        return res.status(400).json({
          success: false,
          message: 'Email, password và fullName là bắt buộc',
        });
      }

      const result = await authService.register({
        email,
        password,
        fullName,
        role: 'supervisor', // default role
      });

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.status(201).json({
        success: true,
        message: 'Đăng ký thành công',
        data: {
          user: result.data.user,
          // Không trả về token cho register, user cần login
        },
      });
    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi đăng ký',
      });
    }
  },

  refreshToken: async (req, res) => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          message: 'Refresh token is required',
        });
      }

      const result = await authService.refreshToken(refreshToken);

      if (!result.success) {
        return res.status(401).json(result);
      }

      const { user, token, refreshToken: newRefreshToken } = result.data;

      res.json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          user,
          token,
          refreshToken: newRefreshToken,
          redirectUrl: getRedirectByRole(user.role),
        },
      });
    } catch (error) {
      console.error('Refresh token error:', error);
      res.status(401).json({
        success: false,
        message: 'Invalid refresh token',
      });
    }
  },
  // Login với thông tin điều hướng
  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      const result = await authService.login(email, password);

      if (!result.success) {
        return res.status(401).json(result);
      }

      const { user, token, refreshToken } = result.data;

      // Xác định redirect URL dựa theo role
      const redirectUrl = getRedirectByRole(user.role);

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user,
          token,
          refreshToken,
          redirectUrl, // ← Frontend sẽ dùng này để điều hướng
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  },

  // Validate session cho middleware check
  validateSession: (req, res) => {
    try {
      const user = req.user; // Từ authenticate middleware

      res.json({
        success: true,
        data: {
          user,
          isAuthenticated: true,
          redirectUrl: getRedirectByRole(user.role),
        },
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        message: 'Invalid session',
      });
    }
  },

  // Get current user info
  getCurrentUser: (req, res) => {
    try {
      const user = req.user;

      res.json({
        success: true,
        data: {
          ...user,
          permissions: getRolePermissions(user.role),
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Could not fetch user data',
      });
    }
  },

  // Role-based redirect endpoint
  getRoleBasedRedirect: (req, res) => {
    try {
      const user = req.user;
      const redirectUrl = getRedirectByRole(user.role);

      res.json({
        success: true,
        data: { redirectUrl },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Could not determine redirect',
      });
    }
  },

  logout: async (req, res) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];

      // Blacklist token hoặc remove từ database
      await authService.logout(token);

      res.json({
        success: true,
        message: 'Logout successful',
        redirectUrl: '/auth/login', // Redirect đến trang login
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Logout failed',
      });
    }
  },
};

// Helper functions
function getRedirectByRole(role) {
  const roleRoutes = {
    supervisor: '/(supervisor)',
  };

  return roleRoutes[role] || '/dashboard';
}

function getRolePermissions(role) {
  const permissions = {
    admin: ['read', 'write', 'delete', 'manage_users'],
    warehouse_manager: ['read', 'write', 'manage_inventory'],
  };

  return permissions[role] || ['read'];
}

module.exports = authController;
