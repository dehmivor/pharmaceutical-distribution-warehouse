// utils/tokenManager.js
export const tokenManager = {
  // Lấy token với validation
  getToken: () => {
    if (typeof window === 'undefined') return null;

    const token = localStorage.getItem('authToken');
    if (!token || !isValidJWT(token)) {
      tokenManager.clearToken();
      return null;
    }
    return token;
  },

  // Lưu token với validation
  setToken: (token) => {
    if (!isValidJWT(token)) {
      console.error('Attempted to save invalid token');
      return false;
    }
    localStorage.setItem('authToken', token);
    return true;
  },

  // Xóa token
  clearToken: () => {
    localStorage.removeItem('authToken');
    sessionStorage.removeItem('authToken');
  },

  // Kiểm tra token có hợp lệ không
  isValid: () => {
    const token = tokenManager.getToken();
    return !!token && isValidJWT(token);
  },
};
