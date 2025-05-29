import api from './api';
import { logInfo, logError } from '../utils/logger';

export const bookingService = {
  // Create new booking
  createBooking: async (bookingData) => {
    try {
      logInfo('BookingService: Creating new booking');
      const response = await api.post('/bookings', bookingData);
      logInfo('BookingService: Booking created successfully');
      return response;
    } catch (error) {
      logError('BookingService: Create booking failed', error.message);
      throw error;
    }
  },

  // Get user bookings
  getBookings: async (params = {}) => {
    try {
      logInfo('BookingService: Fetching user bookings', params);
      const response = await api.get('/bookings', params);
      return response;
    } catch (error) {
      logError('BookingService: Get bookings failed', error.message);
      throw error;
    }
  },

  // Get single booking
  getBooking: async (bookingId) => {
    try {
      logInfo('BookingService: Fetching booking', { bookingId });
      const response = await api.get(`/bookings/${bookingId}`);
      return response;
    } catch (error) {
      logError('BookingService: Get booking failed', error.message);
      throw error;
    }
  },

  // Update booking status
  updateBookingStatus: async (bookingId, statusData) => {
    try {
      logInfo('BookingService: Updating booking status', { bookingId, status: statusData.status });
      const response = await api.put(`/bookings/${bookingId}/status`, statusData);
      logInfo('BookingService: Booking status updated successfully');
      return response;
    } catch (error) {
      logError('BookingService: Update booking status failed', error.message);
      throw error;
    }
  },

  // Cancel booking
  cancelBooking: async (bookingId, reason = '') => {
    try {
      logInfo('BookingService: Cancelling booking', { bookingId });
      const response = await api.put(`/bookings/${bookingId}/cancel`, { reason });
      logInfo('BookingService: Booking cancelled successfully');
      return response;
    } catch (error) {
      logError('BookingService: Cancel booking failed', error.message);
      throw error;
    }
  },

  // Get booking statistics
  getBookingStats: async () => {
    try {
      logInfo('BookingService: Fetching booking statistics');
      const response = await api.get('/bookings/stats');
      return response;
    } catch (error) {
      logError('BookingService: Get booking stats failed', error.message);
      throw error;
    }
  }
};