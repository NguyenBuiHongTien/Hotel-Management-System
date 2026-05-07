import { apiCall } from '../config/api';

export const reportService = {
  /** Xem nhanh — không lưu DB */
  getOccupancyReport: async (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiCall(`/reports/occupancy${qs ? `?${qs}` : ''}`);
  },

  /** Lưu báo cáo vào DB (dùng khi bấm "Tạo báo cáo" trên UI) */
  saveOccupancyReport: async (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiCall(`/reports/occupancy/save${qs ? `?${qs}` : ''}`, { method: 'POST' });
  },

  getRevenueReport: async (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiCall(`/reports/revenue${qs ? `?${qs}` : ''}`);
  },

  saveRevenueReport: async (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiCall(`/reports/revenue/save${qs ? `?${qs}` : ''}`, { method: 'POST' });
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
