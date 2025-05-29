import React from 'react';
import { formatDate, getInitials } from '../../utils/helpers';

const ReviewCard = ({ review, showSlotInfo = true, showReviewer = true }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start space-x-4">
        {/* Reviewer Avatar */}
        {showReviewer && (
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center">
              <span className="text-white font-medium text-sm">
                {getInitials(review.reviewer.username)}
              </span>
            </div>
          </div>
        )}
        
        <div className="flex-1">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-3">
              {showReviewer && (
                <h4 className="text-sm font-medium text-gray-900">
                  {review.reviewer.username}
                </h4>
              )}
              
              {/* Rating */}
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <span
                    key={i}
                    className={`text-sm ${
                      i < review.rating ? 'text-yellow-400' : 'text-gray-300'
                    }`}
                  >
                    ⭐
                  </span>
                ))}
              </div>
            </div>
            
            {/* Date */}
            <span className="text-xs text-gray-500">
              {formatDate(review.reviewedAt)}
            </span>
          </div>

          {/* Slot Info */}
          {showSlotInfo && review.slot && (
            <div className="mb-3">
              <p className="text-sm text-gray-600">
                Session: <span className="font-medium text-gray-900">{review.slot.title}</span>
              </p>
              {review.slot.category && (
                <p className="text-xs text-gray-500">
                  Category: {review.slot.category}
                </p>
              )}
            </div>
          )}

          {/* Review Comment */}
          {review.comment && (
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-gray-700 text-sm italic">
                "{review.comment}"
              </p>
            </div>
          )}

          {/* Review Type Badge */}
          {review.type && (
            <div className="mt-3">
              <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                review.type === 'given_as_student' 
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-green-100 text-green-800'
              }`}>
                {review.type === 'given_as_student' ? 'As Student' : 'As Mentor'}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReviewCard;