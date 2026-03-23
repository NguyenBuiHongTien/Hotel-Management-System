import { apiCall } from '../config/api';

export const roomTypeService = {
  getAllRoomTypes: async () => {
    try {
      const data = await apiCall('/room-types');
      return data;
    } catch (error) {
      throw error;
    }
  },

  getRoomTypeById: async (id) => {
    try {
      const data = await apiCall(`/room-types/${id}`);
      return data;
    } catch (error) {
      throw error;
    }
  },

  createRoomType: async (roomTypeData) => {
    try {
      const data = await apiCall('/room-types', {
        method: 'POST',
        body: JSON.stringify(roomTypeData),
      });
      return { success: true, data };
    } catch (error) {
      throw error;
    }
  },

  updateRoomType: async (id, roomTypeData) => {
    try {
      const data = await apiCall(`/room-types/${id}`, {
        method: 'PUT',
        body: JSON.stringify(roomTypeData),
      });
      return { success: true, data };
    } catch (error) {
      throw error;
    }
  },

  deleteRoomType: async (id) => {
    try {
      const data = await apiCall(`/room-types/${id}`, {
        method: 'DELETE',
      });
      return { success: true, data };
    } catch (error) {
      throw error;
    }
  },
};

