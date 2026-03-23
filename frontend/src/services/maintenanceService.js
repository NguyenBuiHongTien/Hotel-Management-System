import { apiCall } from '../config/api';

export const maintenanceService = {
  reportIssue: async ({ roomId, description, priority }) => {
    try {
      const data = await apiCall('/maintenance/issues', {
        method: 'POST',
        body: JSON.stringify({ roomId, description, priority }),
      });
      return { success: true, data };
    } catch (error) {
      throw error;
    }
  },

  getRequests: async () => {
    try {
      const data = await apiCall('/maintenance/requests');
      return data;
    } catch (error) {
      throw error;
    }
  },

  getRequestById: async (id) => {
    try {
      const data = await apiCall(`/maintenance/requests/${id}`);
      return data;
    } catch (error) {
      throw error;
    }
  },

  updateRequest: async (id, update) => {
    try {
      const data = await apiCall(`/maintenance/${id}`, {
        method: 'PUT',
        body: JSON.stringify(update),
      });
      return { success: true, data };
    } catch (error) {
      throw error;
    }
  },

  completeRequest: async (id) => {
    try {
      const data = await apiCall(`/maintenance/${id}/complete`, {
        method: 'PUT',
      });
      return { success: true, data };
    } catch (error) {
      throw error;
    }
  },
};

export default maintenanceService;
