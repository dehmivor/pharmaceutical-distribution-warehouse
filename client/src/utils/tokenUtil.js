/**
 * Utility để xử lý JWT token
 */

// Khóa lưu trữ token trong localStorage
const TOKEN_KEY = 'token';
const USER_KEY = 'user';

/**
 * Lưu token vào localStorage
 * @param {string} token - JWT token
 */
export const setToken = (token) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(TOKEN_KEY, token);
  }
};

/**
 * Lấy token từ localStorage
 * @returns {string|null} JWT token hoặc null nếu không có
 */
export const getToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(TOKEN_KEY);
  }
  return null;
};

/**
 * Lưu thông tin người dùng vào localStorage
 * @param {Object} user - Thông tin người dùng
 */
export const setUser = (user) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
};

/**
 * Lấy thông tin người dùng từ localStorage
 * @returns {Object|null} Thông tin người dùng hoặc null nếu không có
 */
export const getUser = () => {
  if (typeof window !== 'undefined') {
    const user = localStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
  }
  return null;
};

/**
 * Xóa token và thông tin người dùng khỏi localStorage
 */
export const clearAuth = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
};

/**
 * Giải mã payload từ JWT token
 * @param {string} token - JWT token
 * @returns {Object|null} Payload đã giải mã hoặc null nếu token không hợp lệ
 */
export const decodeToken = (token) => {
  try {
    if (!token) return null;

    // JWT có 3 phần được phân tách bởi dấu chấm
    const payload = token.split('.')[1];

    // Giải mã payload (base64url)
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));

    return JSON.parse(decoded);
  } catch (error) {
    console.error('Failed to decode token:', error);
    return null;
  }
};

/**
 * Kiểm tra xem token có hết hạn hay không
 * @param {string} token - JWT token
 * @returns {boolean} true nếu token hết hạn, false nếu còn hạn
 */
export const isTokenExpired = (token) => {
  const decoded = decodeToken(token);
  if (!decoded) return true;

  // Thời gian hết hạn trong JWT là timestamp
  const currentTime = Date.now() / 1000;
  return decoded.exp < currentTime;
};
