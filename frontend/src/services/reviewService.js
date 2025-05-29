import api from './api';
import { logInfo, logError } from '../utils/logger';

export const reviewService = {
  // Submit review
  submitReview: async (reviewData) => {
    try {
      logInfo('ReviewService: Submitting review');
      const response = await api.post('/reviews', reviewData);
      logInfo('ReviewService: Review submitted successfully');
      return response;
    } catch (error) {
      logError('ReviewService: Submit review failed', error.message);
      throw error;
    }
  },

  // Get reviews for a user
  getUserReviews: async (userId, params = {}) => {
    try {
      logInfo('ReviewService: Fetching user reviews', { userId });
      const response = await api.get(`/reviews/user/${userId}`, params);
      return response;
    } catch (error) {
      logError('ReviewService: Get user reviews failed', error.message);
      throw error;
    }
  },

  // Get reviews given by current user
  getGivenReviews: async (params = {}) => {
    try {
      logInfo('ReviewService: Fetching given reviews');
      const response = await api.get('/reviews/given', params);
      return response;
    } catch (error) {
      logError('ReviewService: Get given reviews failed', error.message);
      throw error;
    }
  },

  // Get review statistics
  getReviewStats: async (userId) => {
    try {
      logInfo('ReviewService: Fetching review statistics', { userId });
      const response = await api.get(`/reviews/stats/${userId}`);
      return response;
    } catch (error) {
      logError('ReviewService: Get review stats failed', error.message);
      throw error;
    }
  },

  // Update review
  updateReview: async (bookingId, reviewData) => {
    try {
      logInfo('ReviewService: Updating review', { bookingId });
      const response = await api.put(`/reviews/${bookingId}`, reviewData);
      logInfo('ReviewService: Review updated successfully');
      return response;
    } catch (error) {
      logError('ReviewService: Update review failed', error.message);
      throw error;
    }
  }
};