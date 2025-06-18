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

  loginStep1: async (req, res) => {
    try {
      const { email, password } = req.body;

      const result = await authService.loginStep1(email, password);

      if (!result.success) {
        return res.status(401).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error('Login step 1 error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  },

  loginStep2: async (req, res) => {
    try {
      const { tempToken, otp } = req.body;

      const result = await authService.loginStep2(tempToken, otp);

      if (!result.success) {
        return res.status(401).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error('Login step 2 error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  },
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

function getRedirectByRole(role) {
  const roleRoutes = {
    supervisor: '/manage-users',
    warehouse_manager: '/manage-inventory',
    warehouse: '/manage-inspections',
    representative: '/manage-contracts',
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
