import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { bookingService } from '../services/bookingService';
import { reviewService } from '../services/reviewService';
import { logInfo, logError, logInteraction } from '../utils/logger';
import { formatDate, formatCredits } from '../utils/helpers';
import { STATUS_COLORS, BOOKING_STATUS } from '../utils/constants';
import Loading from '../components/Common/Loading';
import ErrorMessage from '../components/Common/ErrorMessage';

const MyBookings = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(searchParams.get('role') || 'student');
  const [statusFilter, setStatusFilter] = useState('');
  const [showReviewModal, setShowReviewModal] = useState(null);
  const [reviewData, setReviewData] = useState({ rating: 5, comment: '' });

  useEffect(() => {
    logInfo('MyBookings page loaded');
    fetchBookings();
  }, [activeTab, statusFilter]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        role: activeTab,
        ...(statusFilter && { status: statusFilter })
      };

      const response = await bookingService.getBookings(params);
      setBookings(response.data.bookings);
      
      logInfo('Bookings loaded successfully', { 
        count: response.data.bookings.length,
        role: activeTab
      });
    } catch (error) {
      logError('Error loading bookings:', error);
      setError('Failed to load bookings');
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ role: tab });
    logInteraction({ tagName: 'BUTTON' }, 'tab_changed', { tab });
  };

  const handleStatusUpdate = async (bookingId, status, reason = '') => {
    try {
      setActionLoading(bookingId);
      
      const response = await bookingService.updateBookingStatus(bookingId, {
        status,
        reason
      });

      if (response.success) {
        toast.success(`Booking ${status} successfully`);
        fetchBookings();
        logInfo('Booking status updated', { bookingId, status });
      }
    } catch (error) {
      logError('Error updating booking status:', error);
      toast.error(error.message || 'Failed to update booking');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    try {
      setActionLoading(bookingId);
      
      const response = await bookingService.cancelBooking(bookingId, 'Cancelled by user');

      if (response.success) {
        toast.success('Booking cancelled successfully');
        fetchBookings();
        logInfo('Booking cancelled', { bookingId });
      }
    } catch (error) {
      logError('Error cancelling booking:', error);
      toast.error(error.message || 'Failed to cancel booking');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSubmitReview = async (bookingId) => {
    try {
      setActionLoading(bookingId);
      
      const response = await reviewService.submitReview({
        bookingId,
        rating: reviewData.rating,
        comment: reviewData.comment,
        reviewerType: activeTab === 'mentor' ? 'mentor' : 'student'
      });

      if (response.success) {
        toast.success('Review submitted successfully');
        setShowReviewModal(null);
        setReviewData({ rating: 5, comment: '' });
        fetchBookings();
        logInfo('Review submitted', { bookingId, rating: reviewData.rating });
      }
    } catch (error) {
      logError('Error submitting review:', error);
      toast.error(error.message || 'Failed to submit review');
    } finally {
      setActionLoading(null);
    }
  };

  const getActionButtons = (booking) => {
    const isStudent = activeTab === 'student';
    const isMentor = activeTab === 'mentor';
    
    switch (booking.status) {
      case 'pending':
        return (
          <div className="flex space-x-2">
            {isMentor && (
              <button
                onClick={() => handleStatusUpdate(booking._id, 'confirmed')}
                disabled={actionLoading === booking._id}
                className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {actionLoading === booking._id ? <Loading size="small" color="white" /> : 'Accept'}
              </button>
            )}
            <button
              onClick={() => handleCancelBooking(booking._id)}
              disabled={actionLoading === booking._id}
              className="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        );
      
      case 'confirmed':
        return (
          <div className="flex space-x-2">
            {isMentor && (
              <button
                onClick={() => handleStatusUpdate(booking._id, 'completed')}
                disabled={actionLoading === booking._id}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {actionLoading === booking._id ? <Loading size="small" color="white" /> : 'Mark Complete'}
              </button>
            )}
            <button
              onClick={() => handleCancelBooking(booking._id)}
              disabled={actionLoading === booking._id}
              className="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        );
      
      case 'completed':
        const hasReviewed = isStudent ? booking.review?.rating : booking.mentorReview?.rating;
        if (!hasReviewed) {
          return (
            <button
              onClick={() => setShowReviewModal(booking._id)}
              className="px-3 py-1 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700"
            >
              Leave Review
            </button>
          );
        }
        return (
          <span className="text-sm text-green-600 font-medium">
            ✓ Reviewed
          </span>
        );
      
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="large" text="Loading bookings..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Bookings</h1>
          <p className="text-gray-600 mt-2">
            Manage your sessions as both student and mentor
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => handleTabChange('student')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'student'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              As Student
            </button>
            <button
              onClick={() => handleTabChange('mentor')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'mentor'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              As Mentor
            </button>
          </nav>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Bookings List */}
        {error ? (
          <ErrorMessage message={error} />
        ) : bookings.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📅</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No bookings found
            </h3>
            <p className="text-gray-500">
              {activeTab === 'student' 
                ? "You haven't booked any sessions yet." 
                : "No one has booked your slots yet."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div key={booking._id} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Title and User */}
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {booking.slotId.title}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {activeTab === 'student' ? 'with' : 'by'}{' '}
                          {activeTab === 'student' 
                            ? booking.bookedFrom.username 
                            : booking.bookedBy.username}
                        </p>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[booking.status]}`}>
                        {booking.status}
                      </span>
                    </div>

                    {/* Details */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <span className="mr-2">📅</span>
                        {formatDate(booking.slotId.dateTime, 'MMM dd, yyyy - h:mm a')}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <span className="mr-2">⏱️</span>
                        {booking.slotId.duration} minutes
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <span className="mr-2">💰</span>
                        {formatCredits(booking.cost)} credits
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-gray-700 text-sm mb-4">
                      {booking.slotId.description}
                    </p>

                    {/* Meeting Link */}
                    {booking.status === 'confirmed' && booking.slotId.meetingLink && (
                      <div className="mb-4 p-3 bg-blue-50 rounded-md">
                        <p className="text-sm text-blue-800 mb-2">
                          <strong>Meeting Link:</strong>
                        </p>
                        <a
                          href={booking.slotId.meetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-sm underline"
                        >
                          {booking.slotId.meetingLink}
                        </a>
                      </div>
                    )}

                    {/* Notes */}
                    {booking.notes && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-600">
                          <strong>Notes:</strong> {booking.notes}
                        </p>
                      </div>
                    )}

                    {/* Reviews */}
                    {booking.status === 'completed' && (
                      <div className="mb-4 space-y-2">
                        {booking.review?.rating && (
                          <div className="text-sm">
                            <strong>Student Review:</strong>
                            <div className="flex items-center space-x-2">
                              <div className="flex items-center">
                                {[...Array(5)].map((_, i) => (
                                  <span
                                    key={i}
                                    className={`text-sm ${
                                      i < booking.review.rating ? 'text-yellow-400' : 'text-gray-300'
                                    }`}
                                  >
                                    ⭐
                                  </span>
                                ))}
                              </div>
                              {booking.review.comment && (
                                <span className="text-gray-600">"{booking.review.comment}"</span>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {booking.mentorReview?.rating && (
                          <div className="text-sm">
                            <strong>Mentor Review:</strong>
                            <div className="flex items-center space-x-2">
                              <div className="flex items-center">
                                {[...Array(5)].map((_, i) => (
                                  <span
                                    key={i}
                                    className={`text-sm ${
                                      i < booking.mentorReview.rating ? 'text-yellow-400' : 'text-gray-300'
                                    }`}
                                  >
                                    ⭐
                                  </span>
                                ))}
                              </div>
                              {booking.mentorReview.comment && (
                                <span className="text-gray-600">"{booking.mentorReview.comment}"</span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="ml-4 flex-shrink-0">
                    {getActionButtons(booking)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Review Modal */}
        {showReviewModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowReviewModal(null)} />
              
              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Leave a Review
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Rating
                      </label>
                      <div className="flex space-x-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setReviewData(prev => ({ ...prev, rating: star }))}
                            className={`text-2xl ${
                              star <= reviewData.rating ? 'text-yellow-400' : 'text-gray-300'
                            } hover:text-yellow-400`}
                          >
                            ⭐
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Comment (Optional)
                      </label>
                      <textarea
                        value={reviewData.comment}
                        onChange={(e) => setReviewData(prev => ({ ...prev, comment: e.target.value }))}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Share your experience..."
                        maxLength={500}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    onClick={() => handleSubmitReview(showReviewModal)}
                    disabled={actionLoading === showReviewModal}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                  >
                    {actionLoading === showReviewModal ? <Loading size="small" color="white" /> : 'Submit Review'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowReviewModal(null)}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyBookings;