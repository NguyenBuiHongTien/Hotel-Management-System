import { apiCall } from '../config/api';

export const dashboardService = {
  getRevenue: async (filters = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (filters.fromDate) queryParams.append('fromDate', filters.fromDate);
      if (filters.toDate) queryParams.append('toDate', filters.toDate);

      const queryString = queryParams.toString();
      const endpoint = `/dashboard/revenue${queryString ? `?${queryString}` : ''}`;
      
      const data = await apiCall(endpoint);
      return data;
    } catch (error) {
      throw error;
    }
  },
};

export default dashboardService;
