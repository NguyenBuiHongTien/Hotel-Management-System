import { apiCall } from '../config/api';

export const reportService = {
  getOccupancyReport: async (params = {}) => {
    try {
      const qs = new URLSearchParams(params).toString();
      const data = await apiCall(`/reports/occupancy${qs ? `?${qs}` : ''}`);
      return data;
    } catch (error) {
      throw error;
    }
  },

  getRevenueReport: async (params = {}) => {
    try {
      const qs = new URLSearchParams(params).toString();
      const data = await apiCall(`/reports/revenue${qs ? `?${qs}` : ''}`);
      return data;
    } catch (error) {
      throw error;
    }
  },

  listReports: async (filters = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (filters.type) queryParams.append('type', filters.type);

      const queryString = queryParams.toString();
      const endpoint = `/reports${queryString ? `?${queryString}` : ''}`;
      
      const data = await apiCall(endpoint);
      return data;
    } catch (error) {
      throw error;
    }
  },

  getReportById: async (id) => {
    try {
      const data = await apiCall(`/reports/${id}`);
      return data;
    } catch (error) {
      throw error;
    }
  },

  exportComprehensive: async (params = {}) => {
    try {
      const qs = new URLSearchParams(params).toString();
      const data = await apiCall(`/reports/comprehensive/export${qs ? `?${qs}` : ''}`);
      return data;
    } catch (error) {
      throw error;
    }
  },
};

export default reportService;
