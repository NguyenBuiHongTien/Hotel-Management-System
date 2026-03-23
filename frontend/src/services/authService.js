import { apiCall } from '../config/api';

export const authService = {
  login: async (email, password) => {
    try {
      const response = await apiCall('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      // Store token and user data
      if (response.token) {
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify({
          _id: response._id,
          name: response.name,
          email: response.email,
          role: response.role,
        }));
      }

      return {
        success: true,
        user: {
          _id: response._id,
          name: response.name,
          email: response.email,
          role: response.role,
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
