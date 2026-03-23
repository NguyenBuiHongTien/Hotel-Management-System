import { apiCall } from '../config/api';

export const guestService = {
  getAllGuests: async (filters = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (filters.name) queryParams.append('name', filters.name);
      if (filters.phoneNumber) queryParams.append('phoneNumber', filters.phoneNumber);

      const queryString = queryParams.toString();
      const endpoint = `/guests${queryString ? `?${queryString}` : ''}`;
      
      const data = await apiCall(endpoint);
      return data;
    } catch (error) {
      throw error;
    }
  },

  getGuestById: async (id) => {
    try {
      const data = await apiCall(`/guests/${id}`);
      return data;
    } catch (error) {
      throw error;
    }
  },

  createGuest: async (guestData) => {
    try {
      const data = await apiCall('/guests', {
        method: 'POST',
        body: JSON.stringify(guestData),
      });
      return { success: true, data };
    } catch (error) {
      throw error;
    }
  },

  updateGuest: async (id, guestData) => {
    try {
      const data = await apiCall(`/guests/${id}`, {
        method: 'PUT',
        body: JSON.stringify(guestData),
      });
      return { success: true, data };
    } catch (error) {
      throw error;
    }
  },
};

