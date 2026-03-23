import { useState, useEffect } from 'react';
import { roomService } from '../services/roomService';

export const useRooms = () => {
  const [rooms, setRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      setIsLoading(true);
      const data = await roomService.getAllRooms();
      setRooms(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const updateRoomStatus = async (id, status) => {
    try {
      const result = await roomService.updateRoomStatus(id, status);
      if (result.success) {
        await fetchRooms();
      }
      return result;
    } catch (err) {
      setError(err.message);
      return { success: false, message: err.message };
    }
  };

  return { rooms, isLoading, error, updateRoomStatus, refetch: fetchRooms };
};