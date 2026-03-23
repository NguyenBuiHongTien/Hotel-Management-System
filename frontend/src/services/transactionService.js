import { apiCall } from '../config/api';

export const transactionService = {
  getTransactions: async (filters = {}) => {
    try {
      const qs = new URLSearchParams(filters).toString();
      const data = await apiCall(`/transactions${qs ? `?${qs}` : ''}`);
      return data;
    } catch (error) {
      throw error;
    }
  },
};

export default transactionService;
