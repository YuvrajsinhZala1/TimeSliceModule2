import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { reviewService } from '../../services/reviewService';
import { authService } from '../../services/authService';
import { logInfo, logComponent, logError, logInteraction } from '../../utils/logger';
import { formatDate, getInitials, formatRating } from '../../utils/helpers';
import Button from '../../components/Common/Button/Button';
import Loading, { PageLoading } from '../../components/Common/Loading/Loading';
import ErrorMessage from '../../components/Common/ErrorMessage/ErrorMessage';
import Modal from '../../components/Common/Modal/Modal';
import EditProfile from '../../components/Profile/EditProfile';
import ReviewCard from '../../components/Reviews/ReviewCard';
import SkillsVisualization from '../../components/Profile/SkillsVisualization';
import { toast } from 'react-toastify';
import styles from './Profile.module.css';

const Profile = () => {
  const { user, updateUser } = useAuth();
  
  // State management
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Profile data
  const [profileStats, setProfileStats] = useState(null);
  const [givenReviews, setGivenReviews] = useState([]);
  const [receivedReviews, setReceivedReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState(null);

  useEffect(() => {
    logComponent('Profile', 'mounted', { userId: user?._id });
    fetchProfileData();
  }, [user]);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      setError(null);

      logInfo('Fetching profile data');

      // Fetch profile statistics and reviews
      const [
        reviewStatsResponse,
        givenReviewsResponse,
        receivedReviewsResponse
      ] = await Promise.all([
        reviewService.getReviewStats(user._id),
        reviewService.getGivenReviews({ limit: 10 }),
        reviewService.getUserReviews(user._id, { limit: 10 })
      ]);

      setReviewStats(reviewStatsResponse.data || {});
      setGivenReviews(givenReviewsResponse.data?.reviews || []);
      setReceivedReviews(receivedReviewsResponse.data?.reviews || []);

      // Calculate profile stats
      const stats = {
        totalSessions: (reviewStatsResponse.data?.asMentor?.totalReviews || 0) + 
                      (reviewStatsResponse.data?.asStudent?.totalReviews || 0),
        mentorSessions: reviewStatsResponse.data?.asMentor?.totalReviews || 0,
        studentSessions: reviewStatsResponse.data?.asStudent?.totalReviews || 0,
        averageRating: reviewStatsResponse.data?.averageRating || 0,
        totalReviews: (receivedReviewsResponse.data?.reviews?.length || 0),
        joinedAt: user.createdAt
      };

      setProfileStats(stats);

      logInfo('Profile data loaded successfully');
    } catch (error) {
      logError('Error fetching profile data:', error);
      setError('Failed to load profile data. Please try again.');
      toast.error('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleEditProfile = () => {
    setShowEditModal(true);
    logInteraction(document.createElement('button'), 'edit_profile_clicked');
  };

  const handleProfileUpdated = (updatedUser) => {
    updateUser(updatedUser);
    setShowEditModal(false);
    toast.success('Profile updated successfully!');
    
    logInfo('Profile updated successfully', { 
      userId: updatedUser._id 
    });
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    logInteraction(document.createElement('button'), 'profile_tab_changed', { tab });
  };

  if (loading) {
    return <PageLoading text="Loading your profile..." />;
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <ErrorMessage 
          message={error}
          showRetry
          onRetry={fetchProfileData}
        />
      </div>
    );
  }

  return (
    <div className={styles.profilePage}>
      <div className={styles.container}>
        {/* Profile Header */}
        <div className={styles.profileHeader}>
          <div className={styles.profileHero}>
            <div className={styles.avatarSection}>
              <div className={styles.avatar}>
                <span className={styles.avatarText}>
                  {getInitials(user.username)}
                </span>
              </div>
              <div className={styles.profileBadge}>
                <span className={styles.badgeText}>Pro</span>
              </div>
            </div>

            <div className={styles.profileInfo}>
              <h1 className={styles.profileName}>{user.username}</h1>
              <p className={styles.profileEmail}>{user.email}</p>
              
              {/* Rating Display */}
              {reviewStats && reviewStats.averageRating > 0 && (
                <div className={styles.profileRating}>
                  <div className={styles.stars}>
                    {[...Array(5)].map((_, i) => (
                      <span
                        key={i}
                        className={`${styles.star} ${
                          i < Math.floor(reviewStats.averageRating) ? styles.starFilled : ''
                        }`}
                      >
                        ⭐
                      </span>
                    ))}
                  </div>
                  <span className={styles.ratingText}>
                    {formatRating(reviewStats.averageRating)} ({receivedReviews.length} review{receivedReviews.length !== 1 ? 's' : ''})
                  </span>
                </div>
              )}

              {/* Bio */}
              {user.bio && (
                <p className={styles.profileBio}>{user.bio}</p>
              )}

              {/* Skills */}
              {user.skills && user.skills.length > 0 && (
                <div className={styles.skillsSection}>
                  <h3 className={styles.skillsTitle}>Skills</h3>
                  <div className={styles.skillsList}>
                    {user.skills.map((skill, index) => (
                      <span key={index} className={styles.skillTag}>
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Join Date */}
              <div className={styles.joinDate}>
                <span className={styles.joinDateLabel}>Member since </span>
                <span className={styles.joinDateValue}>
                  {formatDate(user.createdAt, 'MMMM yyyy')}
                </span>
              </div>
            </div>

            <div className={styles.profileActions}>
              <Button
                variant="primary"
                size="medium"
                onClick={handleEditProfile}
                icon={
                  <svg viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
                  </svg>
                }
              >
                Edit Profile
              </Button>
            </div>
          </div>

          {/* Stats Grid */}
          {profileStats && (
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statValue}>{profileStats.totalSessions}</div>
                <div className={styles.statLabel}>Total Sessions</div>
              </div>
              
              <div className={styles.statCard}>
                <div className={styles.statValue}>{profileStats.mentorSessions}</div>
                <div className={styles.statLabel}>As Mentor</div>
              </div>
              
              <div className={styles.statCard}>
                <div className={styles.statValue}>{profileStats.studentSessions}</div>
                <div className={styles.statLabel}>As Student</div>
              </div>
              
              <div className={styles.statCard}>
                <div className={styles.statValue}>{user.credits || 0}</div>
                <div className={styles.statLabel}>Available Credits</div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className={styles.tabsContainer}>
          <div className={styles.tabs}>
            {[
              { key: 'overview', label: 'Overview', icon: '👤' },
              { key: 'reviews-received', label: `Reviews Received (${receivedReviews.length})`, icon: '⭐' },
              { key: 'reviews-given', label: `Reviews Given (${givenReviews.length})`, icon: '📝' },
              { key: 'skills', label: 'Skills Analysis', icon: '📊' }
            ].map(tab => (
              <button
                key={tab.key}
                className={`${styles.tab} ${activeTab === tab.key ? styles.tabActive : ''}`}
                onClick={() => handleTabChange(tab.key)}
              >
                <span className={styles.tabIcon}>{tab.icon}</span>
                <span className={styles.tabLabel}>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className={styles.tabContent}>
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className={styles.overviewSection}>
              <div className={styles.overviewGrid}>
                {/* About Section */}
                <div className={styles.aboutCard}>
                  <h3 className={styles.cardTitle}>About</h3>
                  <div className={styles.cardContent}>
                    {user.bio ? (
                      <p className={styles.bioText}>{user.bio}</p>
                    ) : (
                      <div className={styles.emptyState}>
                        <p className={styles.emptyText}>No bio added yet</p>
                        <Button
                          variant="outline"
                          size="small"
                          onClick={handleEditProfile}
                        >
                          Add Bio
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Activity Summary */}
                <div className={styles.activityCard}>
                  <h3 className={styles.cardTitle}>Activity Summary</h3>
                  <div className={styles.cardContent}>
                    <div className={styles.activityList}>
                      <div className={styles.activityItem}>
                        <span className={styles.activityIcon}>🎯</span>
                        <div className={styles.activityInfo}>
                          <span className={styles.activityLabel}>Sessions Completed</span>
                          <span className={styles.activityValue}>
                            {profileStats?.totalSessions || 0}
                          </span>
                        </div>
                      </div>
                      
                      <div className={styles.activityItem}>
                        <span className={styles.activityIcon}>⭐</span>
                        <div className={styles.activityInfo}>
                          <span className={styles.activityLabel}>Average Rating</span>
                          <span className={styles.activityValue}>
                            {formatRating(reviewStats?.averageRating || 0)}
                          </span>
                        </div>
                      </div>
                      
                      <div className={styles.activityItem}>
                        <span className={styles.activityIcon}>💰</span>
                        <div className={styles.activityInfo}>
                          <span className={styles.activityLabel}>Credits Balance</span>
                          <span className={styles.activityValue}>
                            {user.credits || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Reviews Preview */}
                {receivedReviews.length > 0 && (
                  <div className={styles.recentReviewsCard}>
                    <h3 className={styles.cardTitle}>Recent Reviews</h3>
                    <div className={styles.cardContent}>
                      <div className={styles.reviewsList}>
                        {receivedReviews.slice(0, 3).map((review, index) => (
                          <div key={index} className={styles.reviewPreview}>
                            <div className={styles.reviewHeader}>
                              <span className={styles.reviewerName}>
                                {review.reviewer.username}
                              </span>
                              <div className={styles.reviewRating}>
                                {[...Array(review.rating)].map((_, i) => (
                                  <span key={i} className={styles.reviewStar}>⭐</span>
                                ))}
                              </div>
                            </div>
                            {review.comment && (
                              <p className={styles.reviewComment}>
                                "{review.comment.length > 100 
                                  ? review.comment.substring(0, 100) + '...' 
                                  : review.comment}"
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                      <Button
                        variant="outline"
                        size="small"
                        onClick={() => handleTabChange('reviews-received')}
                      >
                        View All Reviews
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Reviews Received Tab */}
          {activeTab === 'reviews-received' && (
            <div className={styles.reviewsSection}>
              <div className={styles.sectionHeader}>
                <h3 className={styles.sectionTitle}>Reviews Received</h3>
                <p className={styles.sectionSubtitle}>
                  What others say about your sessions
                </p>
              </div>
              
              {receivedReviews.length > 0 ? (
                <div className={styles.reviewsGrid}>
                  {receivedReviews.map((review, index) => (
                    <ReviewCard
                      key={index}
                      review={review}
                      showSlotInfo={true}
                      showReviewer={true}
                    />
                  ))}
                </div>
              ) : (
                <div className={styles.emptyReviews}>
                  <div className={styles.emptyIcon}>⭐</div>
                  <h4 className={styles.emptyTitle}>No reviews yet</h4>
                  <p className={styles.emptyDescription}>
                    Complete some sessions as a mentor to start receiving reviews
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Reviews Given Tab */}
          {activeTab === 'reviews-given' && (
            <div className={styles.reviewsSection}>
              <div className={styles.sectionHeader}>
                <h3 className={styles.sectionTitle}>Reviews Given</h3>
                <p className={styles.sectionSubtitle}>
                  Reviews you've left for mentors
                </p>
              </div>
              
              {givenReviews.length > 0 ? (
                <div className={styles.reviewsGrid}>
                  {givenReviews.map((review, index) => (
                    <ReviewCard
                      key={index}
                      review={review}
                      showSlotInfo={true}
                      showReviewer={false}
                    />
                  ))}
                </div>
              ) : (
                <div className={styles.emptyReviews}>
                  <div className={styles.emptyIcon}>📝</div>
                  <h4 className={styles.emptyTitle}>No reviews given yet</h4>
                  <p className={styles.emptyDescription}>
                    Book and complete sessions to leave reviews for mentors
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Skills Analysis Tab */}
          {activeTab === 'skills' && (
            <div className={styles.skillsAnalysisSection}>
              <div className={styles.sectionHeader}>
                <h3 className={styles.sectionTitle}>Skills Analysis</h3>
                <p className={styles.sectionSubtitle}>
                  Visual breakdown of your skills and expertise
                </p>
              </div>
              
              {user.skills && user.skills.length > 0 ? (
                <SkillsVisualization skills={user.skills} />
              ) : (
                <div className={styles.emptySkills}>
                  <div className={styles.emptyIcon}>📊</div>
                  <h4 className={styles.emptyTitle}>No skills added yet</h4>
                  <p className={styles.emptyDescription}>
                    Add skills to your profile to see the analysis
                  </p>
                  <Button
                    variant="primary"
                    onClick={handleEditProfile}
                  >
                    Add Skills
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Edit Profile Modal */}
        <Modal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          title="Edit Profile"
          size="large"
        >
          <EditProfile
            onCancel={() => setShowEditModal(false)}
            onSave={handleProfileUpdated}
          />
        </Modal>
      </div>
    </div>
  );
};

export default Profile;