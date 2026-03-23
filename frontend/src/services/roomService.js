import { apiCall } from '../config/api';

export const roomService = {
  getAllRooms: async (filters = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.roomTypeId) queryParams.append('roomTypeId', filters.roomTypeId);
      if (filters.floor) queryParams.append('floor', filters.floor);

      const queryString = queryParams.toString();
      const endpoint = `/rooms${queryString ? `?${queryString}` : ''}`;
      
      const data = await apiCall(endpoint);
      return data;
    } catch (error) {
      throw error;
    }
  },

  getRoomById: async (id) => {
    try {
      const data = await apiCall(`/rooms/${id}`);
      return data;
    } catch (error) {
      throw error;
    }
  },

  updateRoomStatus: async (id, status) => {
    try {
      const data = await apiCall(`/rooms/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
      return { success: true, data };
    } catch (error) {
      throw error;
    }
  },

  getAvailableRooms: async (checkInDate, checkOutDate, filters = {}) => {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('checkInDate', checkInDate);
      queryParams.append('checkOutDate', checkOutDate);
      if (filters.roomTypeId) queryParams.append('roomTypeId', filters.roomTypeId);
      if (filters.capacity) queryParams.append('capacity', filters.capacity);

      const data = await apiCall(`/rooms/available?${queryParams.toString()}`);
      return data;
    } catch (error) {
      throw error;
    }
  },

  getCleaningRooms: async () => {
    try {
      const data = await apiCall('/rooms/cleaning');
      return data;
    } catch (error) {
      throw error;
    }
  },

  getMaintenanceRooms: async () => {
    try {
      const data = await apiCall('/rooms/maintenance');
      return data;
    } catch (error) {
      throw error;
    }
  },

  getRealtimeRoomStatus: async () => {
    try {
      const data = await apiCall('/rooms/status/realtime');
      return data;
    } catch (error) {
      throw error;
    }
  },

  createRoom: async (roomData) => {
    try {
      const data = await apiCall('/rooms', {
        method: 'POST',
        body: JSON.stringify(roomData),
      });
      return { success: true, data };
    } catch (error) {
      throw error;
    }
  },

  updateRoomInfo: async (id, roomData) => {
    try {
      const data = await apiCall(`/rooms/${id}`, {
        method: 'PUT',
        body: JSON.stringify(roomData),
      });
      return { success: true, data };
    } catch (error) {
      throw error;
    }
  },
};
