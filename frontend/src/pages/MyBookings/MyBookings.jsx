import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { bookingService } from '../../services/bookingService';
import { reviewService } from '../../services/reviewService';
import { useAuth } from '../../context/AuthContext';
import { logInfo, logComponent, logError, logInteraction } from '../../utils/logger';
import { formatDate, formatCredits, formatRelativeTime } from '../../utils/helpers';
import { BOOKING_STATUS, STATUS_COLORS } from '../../utils/constants';
import Button from '../../components/Common/Button/Button';
import { ProductCard } from '../../components/Common/Card/Card';
import Loading, { PageLoading } from '../../components/Common/Loading/Loading';
import ErrorMessage from '../../components/Common/ErrorMessage/ErrorMessage';
import Modal, { ConfirmModal } from '../../components/Common/Modal/Modal';
import ReviewForm from '../../components/Reviews/ReviewForm';
import { toast } from 'react-toastify';
import styles from './MyBookings.module.css';

const MyBookings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // State management
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [cancelLoading, setCancelLoading] = useState(null);

  // Modal states
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewBooking, setReviewBooking] = useState(null);

  // Filtering
  const [filteredBookings, setFilteredBookings] = useState([]);

  useEffect(() => {
    logComponent('MyBookings', 'mounted', { userId: user?._id });
    fetchBookings();
  }, []);

  useEffect(() => {
    filterBookings();
  }, [bookings, activeTab]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);

      logInfo('Fetching user bookings');

      const response = await bookingService.getBookings({
        limit: 50,
        sort: '-createdAt'
      });

      if (response.success) {
        const userBookings = response.data.bookings || [];
        setBookings(userBookings);
        
        logInfo('Bookings fetched successfully', { 
          count: userBookings.length 
        });
      } else {
        throw new Error(response.message || 'Failed to fetch bookings');
      }
    } catch (error) {
      logError('Error fetching bookings:', error);
      setError('Failed to load your bookings. Please try again.');
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const filterBookings = () => {
    let filtered = [...bookings];

    switch (activeTab) {
      case 'upcoming':
        filtered = bookings.filter(booking => 
          booking.status === 'confirmed' && 
          new Date(booking.slotId.dateTime) > new Date()
        );
        break;
      case 'completed':
        filtered = bookings.filter(booking => 
          booking.status === 'completed'
        );
        break;
      case 'cancelled':
        filtered = bookings.filter(booking => 
          booking.status === 'cancelled'
        );
        break;
      case 'pending':
        filtered = bookings.filter(booking => 
          booking.status === 'pending'
        );
        break;
      default:
        // 'all' - no filtering
        break;
    }

    setFilteredBookings(filtered);
  };

  const handleCancelBooking = (booking) => {
    setSelectedBooking(booking);
    setShowCancelModal(true);
    
    logInteraction(document.createElement('button'), 'cancel_booking_clicked', {
      bookingId: booking._id,
      slotTitle: booking.slotId.title
    });
  };

  const confirmCancelBooking = async () => {
    if (!selectedBooking) return;

    try {
      setCancelLoading(selectedBooking._id);
      
      const response = await bookingService.cancelBooking(selectedBooking._id, 'Cancelled by user');

      if (response.success) {
        toast.success('Booking cancelled successfully');
        setShowCancelModal(false);
        setSelectedBooking(null);
        
        // Update local state
        setBookings(prev => 
          prev.map(booking => 
            booking._id === selectedBooking._id 
              ? { ...booking, status: 'cancelled' }
              : booking
          )
        );
        
        logInfo('Booking cancelled successfully', { 
          bookingId: selectedBooking._id 
        });
      } else {
        throw new Error(response.message || 'Failed to cancel booking');
      }
    } catch (error) {
      logError('Error cancelling booking:', error);
      toast.error(error.message || 'Failed to cancel booking');
    } finally {
      setCancelLoading(null);
    }
  };

  const handleLeaveReview = (booking) => {
    setReviewBooking(booking);
    setShowReviewModal(true);
    
    logInteraction(document.createElement('button'), 'leave_review_clicked', {
      bookingId: booking._id,
      slotTitle: booking.slotId.title
    });
  };

  const handleReviewSubmitted = (reviewData) => {
    toast.success('Review submitted successfully!');
    setShowReviewModal(false);
    setReviewBooking(null);
    
    // Update local state to show review was submitted
    setBookings(prev => 
      prev.map(booking => 
        booking._id === reviewData.bookingId 
          ? { ...booking, hasReview: true }
          : booking
      )
    );
    
    logInfo('Review submitted successfully', { 
      bookingId: reviewData.bookingId 
    });
  };

  const getBookingActions = (booking) => {
    const now = new Date();
    const sessionTime = new Date(booking.slotId.dateTime);
    const canCancel = booking.status === 'confirmed' && sessionTime > now;
    const canReview = booking.status === 'completed' && !booking.hasReview;
    const isPending = booking.status === 'pending';

    return (
      <div className={styles.bookingActions}>
        {isPending && (
          <span className={styles.pendingNote}>
            Waiting for mentor confirmation
          </span>
        )}
        
        {canCancel && (
          <Button
            variant="outline"
            size="small"
            onClick={() => handleCancelBooking(booking)}
            loading={cancelLoading === booking._id}
          >
            Cancel Booking
          </Button>
        )}
        
        {canReview && (
          <Button
            variant="primary"
            size="small"
            onClick={() => handleLeaveReview(booking)}
          >
            Leave Review
          </Button>
        )}
        
        {booking.status === 'completed' && booking.hasReview && (
          <span className={styles.reviewedNote}>
            ✓ Reviewed
          </span>
        )}
        
        {booking.status === 'cancelled' && (
          <span className={styles.cancelledNote}>
            Cancelled
          </span>
        )}
      </div>
    );
  };

  const getStatusBadge = (status) => {
    const statusClass = STATUS_COLORS[status] || STATUS_COLORS.pending;
    return (
      <span className={`${styles.statusBadge} ${statusClass}`}>
        {status.replace('-', ' ')}
      </span>
    );
  };

  const getTabCount = (tab) => {
    switch (tab) {
      case 'upcoming':
        return bookings.filter(booking => 
          booking.status === 'confirmed' && 
          new Date(booking.slotId.dateTime) > new Date()
        ).length;
      case 'completed':
        return bookings.filter(booking => booking.status === 'completed').length;
      case 'cancelled':
        return bookings.filter(booking => booking.status === 'cancelled').length;
      case 'pending':
        return bookings.filter(booking => booking.status === 'pending').length;
      default:
        return bookings.length;
    }
  };

  if (loading) {
    return <PageLoading text="Loading your bookings..." />;
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <ErrorMessage 
          message={error}
          showRetry
          onRetry={fetchBookings}
        />
      </div>
    );
  }

  return (
    <div className={styles.myBookingsPage}>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <h1 className={styles.title}>My Bookings</h1>
            <p className={styles.subtitle}>
              Manage your booked sessions and leave reviews
            </p>
          </div>
          
          <Button
            variant="primary"
            onClick={() => navigate('/explore')}
            icon={
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"/>
              </svg>
            }
          >
            Book New Session
          </Button>
        </div>

        {/* Tabs */}
        <div className={styles.tabsContainer}>
          <div className={styles.tabs}>
            {[
              { key: 'all', label: 'All Bookings' },
              { key: 'upcoming', label: 'Upcoming' },
              { key: 'completed', label: 'Completed' },
              { key: 'pending', label: 'Pending' },
              { key: 'cancelled', label: 'Cancelled' }
            ].map(tab => (
              <button
                key={tab.key}
                className={`${styles.tab} ${activeTab === tab.key ? styles.tabActive : ''}`}
                onClick={() => {
                  setActiveTab(tab.key);
                  logInteraction(document.createElement('button'), 'booking_tab_changed', { tab: tab.key });
                }}
              >
                {tab.label} ({getTabCount(tab.key)})
              </button>
            ))}
          </div>
        </div>

        {/* Bookings List */}
        <div className={styles.bookingsSection}>
          {filteredBookings.length > 0 ? (
            <div className={styles.bookingsGrid}>
              {filteredBookings.map((booking) => (
                <ProductCard
                  key={booking._id}
                  title={booking.slotId.title}
                  description={
                    <div className={styles.bookingDetails}>
                      <div className={styles.bookingMeta}>
                        <span className={styles.mentor}>
                          <strong>Mentor:</strong> {booking.bookedFrom?.username || 'Unknown'}
                        </span>
                        <span className={styles.duration}>
                          <strong>Duration:</strong> {booking.slotId.duration} minutes
                        </span>
                        <span className={styles.cost}>
                          <strong>Cost:</strong> {formatCredits(booking.slotId.cost)} credits
                        </span>
                      </div>
                      
                      <div className={styles.bookingTime}>
                        <span className={styles.sessionDate}>
                          <strong>Session:</strong> {formatDate(booking.slotId.dateTime, 'MMM dd, yyyy - h:mm a')}
                        </span>
                        <span className={styles.bookedAt}>
                          <strong>Booked:</strong> {formatRelativeTime(booking.createdAt)}
                        </span>
                      </div>

                      {booking.message && (
                        <div className={styles.bookingMessage}>
                          <strong>Message:</strong> {booking.message}
                        </div>
                      )}
                    </div>
                  }
                  badge={getStatusBadge(booking.status)}
                  image={
                    <div className={styles.bookingImage}>
                      <div className={styles.bookingIcon}>
                        {booking.slotId.category === 'Programming' && '💻'}
                        {booking.slotId.category === 'Design' && '🎨'}
                        {booking.slotId.category === 'Marketing' && '📈'}
                        {booking.slotId.category === 'Business' && '💼'}
                        {booking.slotId.category === 'Writing' && '✍️'}
                        {booking.slotId.category === 'Consulting' && '🤝'}
                        {booking.slotId.category === 'Teaching' && '📚'}
                        {booking.slotId.category === 'Mentoring' && '👨‍🏫'}
                        {booking.slotId.category === 'Career Advice' && '🎯'}
                        {booking.slotId.category === 'Code Review' && '🔍'}
                        {!booking.slotId.category && '⏰'}
                      </div>
                      <div className={styles.bookingCategory}>
                        {booking.slotId.category}
                      </div>
                    </div>
                  }
                  actions={getBookingActions(booking)}
                  hover
                />
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                {activeTab === 'all' && '📅'}
                {activeTab === 'upcoming' && '⏰'}
                {activeTab === 'completed' && '✅'}
                {activeTab === 'pending' && '⏳'}
                {activeTab === 'cancelled' && '❌'}
              </div>
              <h3 className={styles.emptyTitle}>
                {activeTab === 'all' && 'No bookings yet'}
                {activeTab === 'upcoming' && 'No upcoming sessions'}
                {activeTab === 'completed' && 'No completed sessions'}
                {activeTab === 'pending' && 'No pending bookings'}
                {activeTab === 'cancelled' && 'No cancelled bookings'}
              </h3>
              <p className={styles.emptyDescription}>
                {activeTab === 'all' 
                  ? 'Start by exploring available sessions and booking your first mentoring session'
                  : `You don't have any ${activeTab} bookings at the moment`
                }
              </p>
              {activeTab === 'all' && (
                <Button
                  variant="primary"
                  onClick={() => navigate('/explore')}
                >
                  Explore Sessions
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Cancel Booking Modal */}
        <ConfirmModal
          isOpen={showCancelModal}
          onClose={() => setShowCancelModal(false)}
          onConfirm={confirmCancelBooking}
          title="Cancel Booking"
          message={
            selectedBooking ? (
              <div className={styles.cancelConfirmation}>
                <p>Are you sure you want to cancel this booking?</p>
                <div className={styles.cancelDetails}>
                  <p><strong>Session:</strong> {selectedBooking.slotId?.title}</p>
                  <p><strong>Mentor:</strong> {selectedBooking.bookedFrom?.username}</p>
                  <p><strong>Date:</strong> {formatDate(selectedBooking.slotId?.dateTime, 'MMM dd, yyyy - h:mm a')}</p>
                  <p><strong>Cost:</strong> {formatCredits(selectedBooking.slotId?.cost)} credits</p>
                </div>
                <p className={styles.cancelWarning}>
                  ⚠️ Your credits will be refunded, but cancellations may affect your reputation.
                </p>
              </div>
            ) : ''
          }
          confirmText="Cancel Booking"
          cancelText="Keep Booking"
          variant="danger"
          loading={cancelLoading === selectedBooking?._id}
        />

        {/* Review Modal */}
        <Modal
          isOpen={showReviewModal}
          onClose={() => setShowReviewModal(false)}
          title="Leave a Review"
          size="medium"
        >
          {reviewBooking && (
            <ReviewForm
              booking={reviewBooking}
              onSubmit={handleReviewSubmitted}
              onCancel={() => setShowReviewModal(false)}
              reviewerType="student"
            />
          )}
        </Modal>
      </div>
    </div>
  );
};

export default MyBookings;