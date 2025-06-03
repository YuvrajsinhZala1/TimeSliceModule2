import React, { useState, useEffect } from 'react';

import { reviewService } from '../../services/reviewService';
import { formatDate, getInitials, formatRating } from '../../utils/helpers';
import Loading from '../Common/Loading/Loading';
import ErrorMessage from '../Common/ErrorMessage/ErrorMessage';

const UserProfile = ({ userId, isCurrentUser = false }) => {
  const [user, setUser] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('about');

  useEffect(() => {
    fetchUserData();
  }, [userId]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [userResponse, reviewsResponse, statsResponse] = await Promise.all([
        //authService.getUserProfile(userId),
        reviewService.getUserReviews(userId, { limit: 10 }),
        reviewService.getReviewStats(userId)
      ]);

      setUser(userResponse.data.user);
      setReviews(reviewsResponse.data.reviews);
      setReviewStats(statsResponse.data);
    } catch (error) {
      setError('Failed to load user profile');
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loading size="large" text="Loading profile..." />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  if (!user) {
    return <ErrorMessage message="User not found" />;
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Profile Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-start space-x-6">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className="w-24 h-24 bg-indigo-600 rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-white">
                {getInitials(user.username)}
              </span>
            </div>
          </div>

          {/* User Info */}
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {user.username}
            </h1>
            
            {/* Rating */}
            <div className="flex items-center mb-3">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <span
                    key={i}
                    className={`text-lg ${
                      i < Math.floor(user.rating?.average || 0) 
                        ? 'text-yellow-400' 
                        : 'text-gray-300'
                    }`}
                  >
                    ⭐
                  </span>
                ))}
              </div>
              <span className="ml-2 text-sm text-gray-600">
                {formatRating(user.rating?.average)} ({user.rating?.count || 0} review{user.rating?.count !== 1 ? 's' : ''})
              </span>
            </div>

            {/* Bio */}
            {user.bio && (
              <p className="text-gray-700 mb-4">
                {user.bio}
              </p>
            )}

            {/* Skills */}
            {user.skills && user.skills.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {user.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 text-sm font-medium bg-indigo-100 text-indigo-800 rounded-full"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Join Date */}
            <p className="text-sm text-gray-500">
              Member since {formatDate(user.joinedAt, 'MMMM yyyy')}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('about')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'about'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            About
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'reviews'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Reviews ({reviews.length})
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'about' && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">About</h2>
          
          {user.bio ? (
            <p className="text-gray-700 whitespace-pre-wrap">
              {user.bio}
            </p>
          ) : (
            <p className="text-gray-500 italic">
              No bio available.
            </p>
          )}

          {/* Stats */}
          {reviewStats && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-900 mb-2">As Mentor</h3>
                <p className="text-2xl font-bold text-indigo-600">
                  {reviewStats.asMentor.totalReviews}
                </p>
                <p className="text-sm text-gray-600">sessions completed</p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-900 mb-2">As Student</h3>
                <p className="text-2xl font-bold text-green-600">
                  {reviewStats.asStudent.totalReviews}
                </p>
                <p className="text-sm text-gray-600">sessions attended</p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Overall Rating</h3>
                <p className="text-2xl font-bold text-yellow-600">
                  {formatRating(user.rating?.average)}
                </p>
                <p className="text-sm text-gray-600">out of 5 stars</p>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'reviews' && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Reviews ({reviews.length})
          </h2>
          
          {reviews.length > 0 ? (
            <div className="space-y-6">
              {reviews.map((review, index) => (
                <div key={index} className="border-b border-gray-200 pb-6 last:border-b-0">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-700">
                          {getInitials(review.reviewer.username)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="text-sm font-medium text-gray-900">
                          {review.reviewer.username}
                        </h4>
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
                        <span className="text-xs text-gray-500">
                          {formatDate(review.reviewedAt)}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2">
                        Session: <span className="font-medium">{review.slot.title}</span>
                      </p>
                      
                      {review.comment && (
                        <p className="text-gray-700 text-sm">
                          "{review.comment}"
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              No reviews yet.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default UserProfile;