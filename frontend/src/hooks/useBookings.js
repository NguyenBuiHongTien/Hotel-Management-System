import { useState, useEffect } from 'react';
import { bookingService } from '../services/bookingService';
import { asArray } from '../utils/apiNormalize';

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
      setBookings(asArray(data, 'bookings'));
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const createBooking = async (bookingData) => {
    try {
      await bookingService.createBooking(bookingData);
      setError(null);
      await fetchBookings();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const updateBooking = async (id, bookingData) => {
    try {
      await bookingService.updateBooking(id, bookingData);
      setError(null);
      await fetchBookings();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const cancelBooking = async (id) => {
    try {
      await bookingService.cancelBooking(id);
      setError(null);
      await fetchBookings();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  return { bookings, isLoading, error, createBooking, updateBooking, cancelBooking, refetch: fetchBookings };
};
