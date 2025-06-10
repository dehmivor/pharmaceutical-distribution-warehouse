// controllers/authController.js
const authService = require('../services/auth.service');

const authController = {
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
        redirectUrl: '/auth/login',
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
    admin: '/admin/dashboard',
    warehouse_manager: '/warehouse/dashboard',
    pharmacist: '/pharmacy/dashboard',
    distributor: '/distributor/dashboard',
    viewer: '/dashboard',
  };

  return roleRoutes[role] || '/dashboard';
}

function getRolePermissions(role) {
  const permissions = {
    admin: ['read', 'write', 'delete', 'manage_users'],
    warehouse_manager: ['read', 'write', 'manage_inventory'],
    pharmacist: ['read', 'write', 'process_orders'],
    distributor: ['read', 'view_orders'],
    viewer: ['read'],
  };

  return permissions[role] || ['read'];
}

module.exports = authController;
