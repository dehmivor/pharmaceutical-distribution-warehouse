'use client';

import { useState, useEffect } from 'react';
import { useRole } from '@/contexts/RoleContext';

export const useAuth = () => {
  const { user, userRole, isLoading, updateUserRole } = useRole();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    setIsAuthenticated(!!user);
  }, [user]);

  const login = async (email, password) => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

      const response = await fetch(`${backendUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const result = await response.json();

      if (result.success) {
        // Store tokens
        localStorage.setItem('auth-token', result.data.token);
        localStorage.setItem('refresh-token', result.data.refreshToken);
        localStorage.setItem('user', JSON.stringify(result.data.user));
        updateUserRole(result.data.user);

        return result;
      }

      return result;
    } catch (error) {
      console.error('Login error:', error);
      throw new Error('Không thể kết nối đến server');
    }
  };

  const register = async (userData) => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

      const response = await fetch(`${backendUrl}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });

      const result = await response.json();

      if (result.success) {
        if (result.data?.token) {
          localStorage.setItem('auth-token', result.data.token);
          localStorage.setItem('refresh-token', result.data.refreshToken);
          localStorage.setItem('user', JSON.stringify(result.data.user));
        }
        return result;
      }

      return result;
    } catch (error) {
      console.error('Register error:', error);
      throw new Error('Không thể kết nối đến server');
    }
  };
  const activateAccount = async (activationData) => {
    try {
      console.log('🔄 Processing activation request for:', activationData.email);

      const { email, otp, newPassword, activationToken } = activationData;

      // 1. Validate đầu vào (tương tự backend)
      if (!email || !otp || !newPassword) {
        throw new Error('Email, OTP và mật khẩu mới là bắt buộc');
      }

      // Validate OTP format (6 digits)
      if (!/^\d{6}$/.test(otp)) {
        throw new Error('OTP phải là 6 chữ số');
      }

      // Validate password strength (tương tự backend)
      if (newPassword.length < 6) {
        throw new Error('Mật khẩu phải có ít nhất 6 ký tự');
      }

      if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
        throw new Error('Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường và 1 số');
      }

      console.log('✅ Frontend validation passed');

      // 2. Prepare API call
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const apiEndpoint = `${backendUrl}/api/auth/activate-account`;

      const requestBody = {
        email: email.toLowerCase().trim(),
        otp: otp.trim(),
        newPassword,
        ...(activationToken && { activationToken })
      };

      console.log('🌐 Making API request to:', apiEndpoint);

      // 3. Make API call với timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // 4. Handle response
      if (!response.ok) {
        console.error('❌ API response not ok:', response.status, response.statusText);

        // Handle specific HTTP status codes
        if (response.status === 404) {
          throw new Error('Không tìm thấy tài khoản với email này');
        } else if (response.status === 400) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Thông tin kích hoạt không hợp lệ');
        } else if (response.status === 423) {
          throw new Error('Tài khoản đã bị khóa do quá nhiều lần thử sai');
        } else if (response.status === 500) {
          throw new Error('Lỗi server. Vui lòng thử lại sau');
        } else {
          throw new Error(`HTTP Error: ${response.status}`);
        }
      }

      const result = await response.json();
      console.log('✅ API response received:', { success: result.success });

      // 5. Process successful response
      if (result.success && result.data) {
        console.log('✅ Account activation successful');

        // Auto-login user với tokens
        if (result.data.token && result.data.refreshToken) {
          console.log('🔐 Storing authentication tokens');

          // Store tokens securely
          localStorage.setItem('auth-token', result.data.token);
          localStorage.setItem('refresh-token', result.data.refreshToken);

          // Store user data
          if (result.data.user) {
            localStorage.setItem('user', JSON.stringify(result.data.user));
          }

          // Update authentication state
          setIsAuthenticated(true);
          console.log('✅ Authentication state updated');
        }

        // Determine redirect URL based on role
        const redirectUrl = result.data.user?.role ? getRedirectUrlByRole(result.data.user.role) : '/dashboard';

        console.log('🎯 Redirect URL determined:', redirectUrl);

        return {
          success: true,
          message: result.message || 'Kích hoạt tài khoản thành công!',
          data: {
            ...result.data,
            redirectUrl
          }
        };
      }

      // Handle unsuccessful response
      console.log('❌ Account activation failed:', result.message);
      throw new Error(result.message || 'Kích hoạt tài khoản thất bại');
    } catch (error) {
      console.error('❌ Account activation error:', error);

      // Handle specific error types
      let errorMessage = 'Lỗi kích hoạt tài khoản';

      if (error.name === 'AbortError') {
        errorMessage = 'Timeout: Yêu cầu mất quá nhiều thời gian. Vui lòng thử lại';
      } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
        errorMessage = 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối internet';
      } else if (error.message) {
        errorMessage = error.message;
      }

      // Log security-related errors
      if (error.message.includes('OTP') || error.message.includes('khóa')) {
        console.warn('🚨 Security event in account activation:', {
          email: activationData.email,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }

      return {
        success: false,
        message: errorMessage,
        data: null
      };
    }
  };

  const getRedirectUrlByRole = (role) => {
    const roleRedirects = {
      supervisor: '/manage-users',
      representative: '/manage-contracts',
      warehouse: '/manage-inspections',
    };

    return roleRedirects[role] || '/dashboard';
  };
  const logout = () => {
    try {
      localStorage.removeItem('auth-token');
      localStorage.removeItem('refresh-token');
      localStorage.removeItem('user');

      setIsAuthenticated(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const hasRole = (role) => {
    if (!userRole) return false;

    if (Array.isArray(role)) {
      return role.includes(userRole);
    }
    return userRole === role;
  };

  const isSupervisor = () => hasRole('supervisor');

  const isRepresentative = () => hasRole('representative');

  const isWarehouse = () => hasRole('warehouse');

  const refreshToken = async () => {
    try {
      const storedRefreshToken = localStorage.getItem('refresh-token');
      if (!storedRefreshToken) {
        throw new Error('No refresh token available');
      }

      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

      const response = await fetch(`${backendUrl}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refreshToken: storedRefreshToken })
      });

      const result = await response.json();

      if (result.success) {
        localStorage.setItem('auth-token', result.data.token);
        return result.data.token;
      }

      throw new Error(result.message || 'Failed to refresh token');
    } catch (error) {
      console.error('Refresh token error:', error);
      logout();
      throw error;
    }
  };

  const isTokenValid = () => {
    const token = localStorage.getItem('auth-token');
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;

      return payload.exp > currentTime;
    } catch (error) {
      return false;
    }
  };

  return {
    user,
    userRole,
    loading: isLoading,
    isAuthenticated,

    login,
    register,
    logout,
    refreshToken,

    activateAccount,

    hasRole,
    isRepresentative,
    isWarehouse,
    isSupervisor,

    isTokenValid
  };
};
