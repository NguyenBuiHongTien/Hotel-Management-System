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
    try {
      const result = await bookingService.createBooking(bookingData);
      if (result.success) {
        await fetchBookings();
      }
      return result;
    } catch (err) {
      setError(err.message);
      return { success: false, message: err.message };
    }
  };

  const updateBooking = async (id, bookingData) => {
    try {
      const result = await bookingService.updateBooking(id, bookingData);
      if (result.success) {
        await fetchBookings();
      }
      return result;
    } catch (err) {
      setError(err.message);
      return { success: false, message: err.message };
    }
  };

  const cancelBooking = async (id) => {
    try {
      const result = await bookingService.cancelBooking(id);
      if (result.success) {
        await fetchBookings();
      }
      return result;
    } catch (err) {
      setError(err.message);
      return { success: false, message: err.message };
    }
  };

  return { bookings, isLoading, error, createBooking, updateBooking, cancelBooking, refetch: fetchBookings };
};
