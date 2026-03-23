import { apiCall } from '../config/api';

export const bookingService = {
  getAllBookings: async (filters = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.customerId) queryParams.append('customerId', filters.customerId);
      if (filters.roomId) queryParams.append('roomId', filters.roomId);
      if (filters.fromDate) queryParams.append('fromDate', filters.fromDate);
      if (filters.toDate) queryParams.append('toDate', filters.toDate);

      const queryString = queryParams.toString();
      const endpoint = `/bookings${queryString ? `?${queryString}` : ''}`;
      
      const data = await apiCall(endpoint);
      return data;
    } catch (error) {
      throw error;
    }
  },

  getBookingById: async (id) => {
    try {
      const data = await apiCall(`/bookings/${id}`);
      return data;
    } catch (error) {
      throw error;
    }
  },

  createBooking: async (bookingData) => {
    try {
      const data = await apiCall('/bookings', {
        method: 'POST',
        body: JSON.stringify(bookingData),
      });
      return { success: true, data };
    } catch (error) {
      throw error;
    }
  },

  updateBooking: async (id, bookingData) => {
    try {
      const data = await apiCall(`/bookings/${id}`, {
        method: 'PUT',
        body: JSON.stringify(bookingData),
      });
      return { success: true, data };
    } catch (error) {
      throw error;
    }
  },

  cancelBooking: async (id) => {
    try {
      const data = await apiCall(`/bookings/${id}/cancel`, {
        method: 'POST',
      });
      return { success: true, data };
    } catch (error) {
      throw error;
    }
  },

  checkIn: async (bookingId) => {
    try {
      const data = await apiCall('/checkin', {
        method: 'POST',
        body: JSON.stringify({ bookingId }),
      });
      return { success: true, data };
    } catch (error) {
      throw error;
    }
  },

  checkOut: async (bookingId) => {
    try {
      const data = await apiCall('/checkout', {
        method: 'POST',
        body: JSON.stringify({ bookingId }),
      });
      return { success: true, data };
    } catch (error) {
      throw error;
    }
  },
  generateInvoice: async (bookingId) => {
    try {
      const data = await apiCall(`/bookings/${bookingId}/invoice`, {
        method: 'POST',
      });
      return { success: true, data };
    } catch (error) {
      throw error;
    }
  },
};
