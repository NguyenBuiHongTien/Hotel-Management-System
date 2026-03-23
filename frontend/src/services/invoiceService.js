import { apiCall } from '../config/api';

export const invoiceService = {
  getAllInvoices: async (filters = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.bookingId) queryParams.append('bookingId', filters.bookingId);
      if (filters.fromDate) queryParams.append('fromDate', filters.fromDate);
      if (filters.toDate) queryParams.append('toDate', filters.toDate);

      const queryString = queryParams.toString();
      const endpoint = `/invoices${queryString ? `?${queryString}` : ''}`;
      
      const data = await apiCall(endpoint);
      return data;
    } catch (error) {
      throw error;
    }
  },

  getInvoiceById: async (id) => {
    try {
      const data = await apiCall(`/invoices/${id}`);
      return data;
    } catch (error) {
      throw error;
    }
  },

  getGuestInvoice: async (bookingId) => {
    try {
      const data = await apiCall(`/invoices/guest/${bookingId}`);
      return data;
    } catch (error) {
      throw error;
    }
  },

  getFinancialInvoice: async (bookingId) => {
    try {
      const data = await apiCall(`/invoices/financial/${bookingId}`);
      return data;
    } catch (error) {
      throw error;
    }
  },
};

export default invoiceService;
