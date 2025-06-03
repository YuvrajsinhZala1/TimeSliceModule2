import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { reviewService } from '../../services/reviewService';
import { logInfo, logError } from '../../utils/logger';
import Loading from '../Common/Loading/Loading';

const ReviewForm = ({ booking, onSubmit, onCancel, reviewerType = 'student' }) => {
  const [formData, setFormData] = useState({
    rating: 5,
    comment: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      const reviewData = {
        bookingId: booking._id,
        rating: formData.rating,
        comment: formData.comment.trim(),
        reviewerType
      };

      const response = await reviewService.submitReview(reviewData);
      
      if (response.success) {
        toast.success('Review submitted successfully!');
        logInfo('Review submitted successfully', { bookingId: booking._id });
        if (onSubmit) onSubmit(response.data);
      }
    } catch (error) {
      logError('Error submitting review:', error);
      toast.error(error.message || 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  const handleRatingChange = (rating) => {
    setFormData(prev => ({ ...prev, rating }));
  };

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Leave a Review</h3>
        <p className="text-sm text-gray-600 mt-1">
          Share your experience with this session
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-6">
        {/* Session Info */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h4 className="font-medium text-gray-900 mb-2">
            {booking.slotId.title}
          </h4>
          <p className="text-sm text-gray-600">
            {reviewerType === 'student' ? 'with' : 'by'}{' '}
            {reviewerType === 'student' 
              ? booking.bookedFrom.username 
              : booking.bookedBy.username}
          </p>
        </div>

        {/* Rating */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Rating *
          </label>
          <div className="flex items-center space-x-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => handleRatingChange(star)}
                className={`text-3xl transition-colors duration-200 ${
                  star <= formData.rating 
                    ? 'text-yellow-400 hover:text-yellow-500' 
                    : 'text-gray-300 hover:text-yellow-300'
                }`}
              >
                ⭐
              </button>
            ))}
            <span className="ml-3 text-sm text-gray-600">
              {formData.rating} star{formData.rating !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Comment */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Comment (Optional)
          </label>
          <textarea
            value={formData.comment}
            onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Share details about your experience..."
            maxLength={500}
          />
          <p className="mt-1 text-xs text-gray-500">
            {formData.comment.length}/500 characters
          </p>
        </div>

        {/* Rating Guidelines */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h5 className="text-sm font-medium text-blue-900 mb-2">Rating Guidelines:</h5>
          <ul className="text-xs text-blue-800 space-y-1">
            <li>⭐ Poor - Session was not helpful</li>
            <li>⭐⭐ Fair - Some value but could be better</li>
            <li>⭐⭐⭐ Good - Decent session, met expectations</li>
            <li>⭐⭐⭐⭐ Very Good - Exceeded expectations</li>
            <li>⭐⭐⭐⭐⭐ Excellent - Outstanding session, highly recommend</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-medium disabled:opacity-50"
          >
            {loading ? <Loading size="small" color="white" /> : 'Submit Review'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReviewForm;