import { useState, useEffect } from 'react';
import { bookingService } from '../services/bookingService';

export const useBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setIsLoading(true);
      const data = await bookingService.getAllBookings();
      setBookings(data.bookings ?? data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const createBooking = async (bookingData) => {
    const result = await bookingService.createBooking(bookingData);
    if (!result.success) {
      const err = new Error(result.message || 'Tạo đặt phòng thất bại');
      setError(err.message);
      throw err;
    } 
    await fetchBookings();
  };

  const updateBooking = async (id, bookingData) => {
    const result = await bookingService.updateBooking(id, bookingData);
    if (!result.success) {
      const err = new Error(result.message || 'Tạo đặt phòng thất bại');
      setError(err.message);
      throw err;
    } 
    await fetchBookings();
  };

  const cancelBooking = async (id) => {
    const result = await bookingService.cancelBooking(id);
    if (!result.success) {
      const err = new Error(result.message || 'Tạo đặt phòng thất bại');
      setError(err.message);
      throw err;
    } 
    await fetchBookings();
  };

  return { bookings, isLoading, error, createBooking, updateBooking, cancelBooking, refetch: fetchBookings };
};
