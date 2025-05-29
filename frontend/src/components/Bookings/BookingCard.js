import React from 'react';
import { formatDate, formatCredits } from '../../utils/helpers';
import { STATUS_COLORS } from '../../utils/constants';

const BookingCard = ({ booking, onStatusUpdate, onCancel, onReview, currentUserRole, loading }) => {
  const getActionButtons = () => {
    const isStudent = currentUserRole === 'student';
    const isMentor = currentUserRole === 'mentor';
    
    switch (booking.status) {
      case 'pending':
        return (
          <div className="flex space-x-2">
            {isMentor && (
              <button
                onClick={() => onStatusUpdate && onStatusUpdate(booking._id, 'confirmed')}
                disabled={loading === booking._id}
                className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading === booking._id ? 'Processing...' : 'Accept'}
              </button>
            )}
            <button
              onClick={() => onCancel && onCancel(booking._id)}
              disabled={loading === booking._id}
              className="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading === booking._id ? 'Processing...' : 'Cancel'}
            </button>
          </div>
        );
      
      case 'confirmed':
        return (
          <div className="flex space-x-2">
            {isMentor && (
              <button
                onClick={() => onStatusUpdate && onStatusUpdate(booking._id, 'completed')}
                disabled={loading === booking._id}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading === booking._id ? 'Processing...' : 'Mark Complete'}
              </button>
            )}
            <button
              onClick={() => onCancel && onCancel(booking._id)}
              disabled={loading === booking._id}
              className="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading === booking._id ? 'Processing...' : 'Cancel'}
            </button>
          </div>
        );
      
      case 'completed':
        const hasReviewed = isStudent ? booking.review?.rating : booking.mentorReview?.rating;
        if (!hasReviewed) {
          return (
            <button
              onClick={() => onReview && onReview(booking._id)}
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

  if (!booking || !booking.slotId) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <p className="text-gray-500">Loading booking data...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {booking.slotId.title}
          </h3>
          <p className="text-sm text-gray-600">
            {currentUserRole === 'student' ? 'with' : 'by'}{' '}
            {currentUserRole === 'student' 
              ? booking.bookedFrom?.username || 'Unknown User'
              : booking.bookedBy?.username || 'Unknown User'}
          </p>
        </div>
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[booking.status] || 'bg-gray-100 text-gray-800'}`}>
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
      {booking.slotId.description && (
        <p className="text-gray-700 text-sm mb-4">
          {booking.slotId.description}
        </p>
      )}

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
            className="text-blue-600 hover:text-blue-800 text-sm underline break-all"
          >
            {booking.slotId.meetingLink}
          </a>
        </div>
      )}

      {/* Notes */}
      {booking.notes && (
        <div className="mb-4 p-3 bg-gray-50 rounded-md">
          <p className="text-sm text-gray-600">
            <strong>Notes:</strong> {booking.notes}
          </p>
        </div>
      )}

      {/* Reviews */}
      {booking.status === 'completed' && (booking.review?.rating || booking.mentorReview?.rating) && (
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

      {/* Actions */}
      <div className="flex justify-end pt-4 border-t border-gray-200">
        {getActionButtons()}
      </div>
    </div>
  );
};

export default BookingCard;
