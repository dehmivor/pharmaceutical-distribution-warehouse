// @project
// services/authService.js

/**
 * Service xử lý các chức năng liên quan đến authentication
 */
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

/**
 * Đăng ký người dùng mới
 * @param {Object} userData - Thông tin người dùng đăng ký
 * @returns {Promise<Object>} Kết quả từ API
 */
export const register = async (userData) => {
  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Đăng ký thất bại');
    }

    // Nếu API trả về token và thông tin người dùng, lưu vào localStorage
    if (data.data?.token) {
      localStorage.setItem('token', data.data.token);
      localStorage.setItem('user', JSON.stringify(data.data.user));
    }

    return data;
  } catch (error) {
    console.error('Register service error:', error);
    throw error;
  }
};

/**
 * Đăng nhập
 * @param {string} email - Email đăng nhập
 * @param {string} password - Mật khẩu đăng nhập
 * @returns {Promise<Object>} Kết quả từ API bao gồm token và thông tin người dùng
 */
export const login = async (email, password) => {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Đăng nhập thất bại');
    }

    // Lưu token vào localStorage nếu login thành công
    if (data.data?.token) {
      localStorage.setItem('token', data.data.token);
      localStorage.setItem('user', JSON.stringify(data.data.user));
    }

    return data;
  } catch (error) {
    console.error('Login service error:', error);
    throw error;
  }
};

/**
 * Kiểm tra người dùng đã đăng nhập hay chưa
 * @returns {boolean} Trạng thái đăng nhập
 */
export const isAuthenticated = () => {
  if (typeof window === 'undefined') return false;

  const token = localStorage.getItem('token');
  return !!token;
};

/**
 * Kiểm tra token có hợp lệ không
 * @returns {Promise<boolean>} Kết quả xác thực token
 */
export const verifyToken = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) return false;

    const response = await fetch(`${API_URL}/auth/verify`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error('Token verification error:', error);
    return false;
  }
};

/**
 * Lấy thông tin người dùng hiện tại
 * @returns {Object|null} Thông tin người dùng
 */
export const getCurrentUser = () => {
  if (typeof window === 'undefined') return null;

  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

/**
 * Lấy token hiện tại
 * @returns {string|null} JWT token
 */
export const getToken = () => {
  if (typeof window === 'undefined') return null;

  return localStorage.getItem('token');
};

/**
 * Đăng xuất
 */
export const logout = () => {
  if (typeof window === 'undefined') return;

  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

/**
 * Lấy header Authorization
 * @returns {Object} Header object chứa Authorization
 */
export const authHeader = () => {
  const token = getToken();

  if (token) {
    return { Authorization: `Bearer ${token}` };
  } else {
    return {};
  }
};

/**
 * Kiểm tra có phải admin không
 * @returns {boolean} Kết quả kiểm tra
 */
export const isAdmin = () => {
  const user = getCurrentUser();
  return user?.role === 'admin';
};

const authService = {
  register,
  login,
  isAuthenticated,
  verifyToken,
  getCurrentUser,
  getToken,
  logout,
  authHeader,
  isAdmin,
};

export default authService;
