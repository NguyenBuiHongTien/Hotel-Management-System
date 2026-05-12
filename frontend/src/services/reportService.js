import { apiCall } from '../config/api';

export const reportService = {
  /** Preview — not persisted */
  getOccupancyReport: async (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiCall(`/reports/occupancy${qs ? `?${qs}` : ''}`);
  },

  /** Save report to DB (used when clicking Create report in the UI) */
  saveOccupancyReport: async (params = {}) => {
    return apiCall('/reports/occupancy/save', {
      method: 'POST',
      body: JSON.stringify({
        fromDate: params.fromDate,
        toDate: params.toDate,
      }),
    });
  },

  getRevenueReport: async (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiCall(`/reports/revenue${qs ? `?${qs}` : ''}`);
  },

  saveRevenueReport: async (params = {}) => {
    return apiCall('/reports/revenue/save', {
      method: 'POST',
      body: JSON.stringify({
        fromDate: params.fromDate,
        toDate: params.toDate,
      }),
    });
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
