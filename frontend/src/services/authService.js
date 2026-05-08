import { apiCall } from '../config/api';

const ROLE_ALIASES = {
  accounttant: 'accountant',
};

const normalizeRole = (role) => {
  const normalized = String(role || '')
    .normalize('NFKC')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .trim()
    .toLowerCase();
  return ROLE_ALIASES[normalized] || normalized;
};

export const authService = {
  login: async (email, password) => {
    try {
      const response = await apiCall('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      // Store token and user data
      if (response.token) {
        const normalizedRole = normalizeRole(response.role);
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify({
          _id: response._id,
          name: response.name,
          email: response.email,
          role: normalizedRole,
        }));
      }

      return {
        success: true,
        user: {
          _id: response._id,
          name: response.name,
          email: response.email,
          role: normalizeRole(response.role),
        },
        message: 'Đăng nhập thành công',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Tên đăng nhập hoặc mật khẩu không đúng',
      };
    }
  },

  getProfile: async () => {
    try {
      const response = await apiCall('/auth/profile');
      return {
        success: true,
        user: response,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  },

  logout: async () => {
    try {
      await apiCall('/auth/logout', {
        method: 'POST',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage regardless of API call result
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    return true;
  },
};

export { normalizeRole };
