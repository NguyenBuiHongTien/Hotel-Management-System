import { apiCall } from '../config/api';

export const paymentService = {
  recordPayment: async ({ invoiceId, paymentMethod }) => {
    try {
      const data = await apiCall('/payments', {
        method: 'POST',
        body: JSON.stringify({ invoiceId, paymentMethod }),
      });
      return { success: true, data };
    } catch (error) {
      throw error;
    }
  },

  getTransactionHistory: async (filters = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (filters.fromDate) queryParams.append('fromDate', filters.fromDate);
      if (filters.toDate) queryParams.append('toDate', filters.toDate);
      if (filters.method) queryParams.append('method', filters.method);

      const queryString = queryParams.toString();
      const endpoint = `/transactions${queryString ? `?${queryString}` : ''}`;
      
      const data = await apiCall(endpoint);
      return data;
    } catch (error) {
      throw error;
    }
  },
};

export default paymentService;
