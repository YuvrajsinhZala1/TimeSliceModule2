import React, { useState } from 'react';
import { formatDate, formatCredits, getInitials, isPastDate } from '../../../utils/helpers';
import { BOOKING_STATUS, STATUS_COLORS } from '../../../utils/constants';
import { logInteraction, logInfo } from '../../../utils/logger';
import Button from '../../Common/Button/Button';
import Modal from '../../Common/Modal/Modal';
import ReviewForm from '../../Reviews/ReviewForm';
import { toast } from 'react-toastify';
import styles from './BookingCard.module.css';

const BookingCard = ({ 
  booking, 
  onCancel, 
  onUpdateStatus, 
  onReview,
  showActions = true, 
  variant = 'default', // 'default', 'compact', 'detailed'
  userRole = 'student' // 'student' or 'mentor'
}) => {
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  if (!booking || !booking.slotId) {
    return null;
  }

  const slot = booking.slotId;
  const isExpired = isPastDate(slot.dateTime);
  const isCompleted = booking.status === BOOKING_STATUS.COMPLETED;
  const isCancelled = booking.status === BOOKING_STATUS.CANCELLED;
  const isConfirmed = booking.status === BOOKING_STATUS.CONFIRMED;
  const isPending = booking.status === BOOKING_STATUS.PENDING;
  const isNoShow = booking.status === BOOKING_STATUS.NO_SHOW;

  const canCancel = (isPending || isConfirmed) && !isExpired && !isCompleted;
  const canReview = isCompleted && !booking.reviewed;
  const canConfirm = userRole === 'mentor' && isPending;
  const canMarkComplete = userRole === 'mentor' && isConfirmed && isExpired;
  const canMarkNoShow = userRole === 'mentor' && isConfirmed && isExpired;

  const handleCancelBooking = async () => {
    try {
      setActionLoading(true);
      logInteraction(document.createElement('button'), 'cancel_booking_clicked', { 
        bookingId: booking._id 
      });
      
      await onCancel(booking._id, cancelReason);
      setShowCancelModal(false);
      setCancelReason('');
      toast.success('Booking cancelled successfully');
      logInfo('Booking cancelled', { bookingId: booking._id });
    } catch (error) {
      toast.error('Failed to cancel booking');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmBooking = async () => {
    try {
      setActionLoading(true);
      logInteraction(document.createElement('button'), 'confirm_booking_clicked', { 
        bookingId: booking._id 
      });
      
      await onUpdateStatus(booking._id, { status: BOOKING_STATUS.CONFIRMED });
      toast.success('Booking confirmed successfully');
      logInfo('Booking confirmed', { bookingId: booking._id });
    } catch (error) {
      toast.error('Failed to confirm booking');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkComplete = async () => {
    try {
      setActionLoading(true);
      logInteraction(document.createElement('button'), 'mark_complete_clicked', { 
        bookingId: booking._id 
      });
      
      await onUpdateStatus(booking._id, { status: BOOKING_STATUS.COMPLETED });
      toast.success('Session marked as completed');
      logInfo('Booking marked complete', { bookingId: booking._id });
    } catch (error) {
      toast.error('Failed to mark as complete');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkNoShow = async () => {
    try {
      setActionLoading(true);
      logInteraction(document.createElement('button'), 'mark_no_show_clicked', { 
        bookingId: booking._id 
      });
      
      await onUpdateStatus(booking._id, { status: BOOKING_STATUS.NO_SHOW });
      toast.success('Session marked as no-show');
      logInfo('Booking marked no-show', { bookingId: booking._id });
    } catch (error) {
      toast.error('Failed to mark as no-show');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReviewSubmit = async (reviewData) => {
    try {
      await onReview(reviewData);
      setShowReviewModal(false);
      toast.success('Review submitted successfully');
      logInfo('Review submitted', { bookingId: booking._id });
    } catch (error) {
      toast.error('Failed to submit review');
    }
  };

  const getStatusBadge = () => {
    const statusClass = STATUS_COLORS[booking.status] || 'bg-gray-100 text-gray-800';
    const statusText = booking.status.charAt(0).toUpperCase() + booking.status.slice(1).replace('-', ' ');
    
    return (
      <span className={`${styles.statusBadge} ${styles[booking.status]}`}>
        {statusText}
      </span>
    );
  };

  const getCategoryIcon = (category) => {
    const icons = {
      'Programming': '💻',
      'Design': '🎨',
      'Marketing': '📈',
      'Business': '💼',
      'Writing': '✍️',
      'Consulting': '💭',
      'Teaching': '🎓',
      'Mentoring': '👥',
      'Career Advice': '🚀',
      'Code Review': '🔍',
      'Other': '🔧'
    };
    return icons[category] || '📚';
  };

  const getOtherUser = () => {
    return userRole === 'student' ? booking.bookedFrom : booking.bookedBy;
  };

  const otherUser = getOtherUser();
  const cardClassName = `${styles.bookingCard} ${styles[variant]} ${styles[booking.status]}`;

  return (
    <div className={cardClassName}>
      {/* Card Header */}
      <div className={styles.cardHeader}>
        <div className={styles.categorySection}>
          <span className={styles.categoryIcon}>
            {getCategoryIcon(slot.category)}
          </span>
          <span className={styles.categoryName}>{slot.category}</span>
        </div>
        {getStatusBadge()}
      </div>

      {/* Card Content */}
      <div className={styles.cardContent}>
        <h3 className={styles.slotTitle} title={slot.title}>
          {slot.title}
        </h3>

        {slot.description && (
          <p className={styles.slotDescription} title={slot.description}>
            {slot.description.length > 100 
              ? `${slot.description.substring(0, 100)}...` 
              : slot.description
            }
          </p>
        )}

        {/* Booking Details */}
        <div className={styles.bookingDetails}>
          <div className={styles.detailRow}>
            <div className={styles.detailItem}>
              <span className={styles.detailIcon}>📅</span>
              <span className={styles.detailText}>
                {formatDate(slot.dateTime, 'MMM dd, yyyy')}
              </span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailIcon}>🕐</span>
              <span className={styles.detailText}>
                {formatDate(slot.dateTime, 'h:mm a')}
              </span>
            </div>
          </div>

          <div className={styles.detailRow}>
            <div className={styles.detailItem}>
              <span className={styles.detailIcon}>⏱️</span>
              <span className={styles.detailText}>{slot.duration} min</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailIcon}>💰</span>
              <span className={styles.detailText}>{formatCredits(slot.cost)} credits</span>
            </div>
          </div>

          {slot.platform && (
            <div className={styles.detailRow}>
              <div className={styles.detailItem}>
                <span className={styles.detailIcon}>🖥️</span>
                <span className={styles.detailText}>{slot.platform}</span>
              </div>
            </div>
          )}
        </div>

        {/* Other User Info */}
        {otherUser && (
          <div className={styles.userInfo}>
            <div className={styles.userAvatar}>
              <span className={styles.userInitials}>
                {getInitials(otherUser.username)}
              </span>
            </div>
            <div className={styles.userDetails}>
              <span className={styles.userRole}>
                {userRole === 'student' ? 'Mentor' : 'Student'}:
              </span>
              <span className={styles.userName}>{otherUser.username}</span>
              {otherUser.rating && (
                <div className={styles.userRating}>
                  <span className={styles.ratingStars}>
                    {[...Array(5)].map((_, i) => (
                      <span 
                        key={i} 
                        className={`${styles.star} ${i < Math.floor(otherUser.rating.average) ? styles.starFilled : ''}`}
                      >
                        ⭐
                      </span>
                    ))}
                  </span>
                  <span className={styles.ratingText}>
                    ({otherUser.rating.count})
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Booking Timeline */}
        <div className={styles.timeline}>
          <div className={styles.timelineItem}>
            <span className={styles.timelineLabel}>Booked:</span>
            <span className={styles.timelineValue}>
              {formatDate(booking.bookedAt, 'MMM dd, h:mm a')}
            </span>
          </div>
          
          {booking.confirmedAt && (
            <div className={styles.timelineItem}>
              <span className={styles.timelineLabel}>Confirmed:</span>
              <span className={styles.timelineValue}>
                {formatDate(booking.confirmedAt, 'MMM dd, h:mm a')}
              </span>
            </div>
          )}
          
          {booking.completedAt && (
            <div className={styles.timelineItem}>
              <span className={styles.timelineLabel}>Completed:</span>
              <span className={styles.timelineValue}>
                {formatDate(booking.completedAt, 'MMM dd, h:mm a')}
              </span>
            </div>
          )}
          
          {booking.cancelledAt && (
            <div className={styles.timelineItem}>
              <span className={styles.timelineLabel}>Cancelled:</span>
              <span className={styles.timelineValue}>
                {formatDate(booking.cancelledAt, 'MMM dd, h:mm a')}
              </span>
            </div>
          )}
        </div>

        {/* Cancel Reason */}
        {isCancelled && booking.cancelReason && (
          <div className={styles.cancelInfo}>
            <span className={styles.cancelLabel}>Cancellation reason:</span>
            <p className={styles.cancelReason}>{booking.cancelReason}</p>
          </div>
        )}
      </div>

      {/* Card Actions */}
      {showActions && (
        <div className={styles.cardActions}>
          <div className={styles.actionButtons}>
            {/* Student Actions */}
            {userRole === 'student' && (
              <>
                {canCancel && (
                  <Button
                    variant="outline"
                    size="small"
                    onClick={() => setShowCancelModal(true)}
                    disabled={actionLoading}
                    icon={
                      <svg viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
                      </svg>
                    }
                  >
                    Cancel
                  </Button>
                )}
                
                {canReview && (
                  <Button
                    variant="primary"
                    size="small"
                    onClick={() => setShowReviewModal(true)}
                    icon={
                      <svg viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                      </svg>
                    }
                  >
                    Review
                  </Button>
                )}
              </>
            )}

            {/* Mentor Actions */}
            {userRole === 'mentor' && (
              <>
                {canConfirm && (
                  <Button
                    variant="primary"
                    size="small"
                    onClick={handleConfirmBooking}
                    loading={actionLoading}
                    disabled={actionLoading}
                    icon={
                      <svg viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                      </svg>
                    }
                  >
                    Confirm
                  </Button>
                )}
                
                {canCancel && (
                  <Button
                    variant="outline"
                    size="small"
                    onClick={() => setShowCancelModal(true)}
                    disabled={actionLoading}
                    icon={
                      <svg viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
                      </svg>
                    }
                  >
                    Cancel
                  </Button>
                )}
                
                {canMarkComplete && (
                  <Button
                    variant="success"
                    size="small"
                    onClick={handleMarkComplete}
                    loading={actionLoading}
                    disabled={actionLoading}
                    icon={
                      <svg viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                      </svg>
                    }
                  >
                    Mark Complete
                  </Button>
                )}
                
                {canMarkNoShow && (
                  <Button
                    variant="warning"
                    size="small"
                    onClick={handleMarkNoShow}
                    loading={actionLoading}
                    disabled={actionLoading}
                    icon={
                      <svg viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd"/>
                      </svg>
                    }
                  >
                    No Show
                  </Button>
                )}
              </>
            )}
          </div>

          {/* Status Messages */}
          {isPending && userRole === 'student' && (
            <div className={styles.statusMessage}>
              <span className={styles.statusIcon}>⏳</span>
              <span className={styles.statusText}>Waiting for mentor confirmation</span>
            </div>
          )}
          
          {isCompleted && booking.reviewed && (
            <div className={styles.statusMessage}>
              <span className={styles.statusIcon}>⭐</span>
              <span className={styles.statusText}>Session completed and reviewed</span>
            </div>
          )}
        </div>
      )}

      {/* Cancel Booking Modal */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title="Cancel Booking"
        size="medium"
      >
        <div className={styles.cancelModal}>
          <div className={styles.cancelWarning}>
            <span className={styles.warningIcon}>⚠️</span>
            <div className={styles.warningContent}>
              <h4 className={styles.warningTitle}>Cancel this booking?</h4>
              <p className={styles.warningText}>
                This action cannot be undone. Please provide a reason for cancellation.
              </p>
            </div>
          </div>

          <div className={styles.cancelForm}>
            <label className={styles.cancelLabel}>
              Reason for cancellation (optional):
            </label>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className={styles.cancelTextarea}
              placeholder="Please provide a brief reason for cancelling this booking..."
              rows={3}
              maxLength={500}
            />
            <span className={styles.characterCount}>
              {cancelReason.length}/500 characters
            </span>
          </div>

          <div className={styles.cancelActions}>
            <Button
              variant="outline"
              onClick={() => setShowCancelModal(false)}
              disabled={actionLoading}
            >
              Keep Booking
            </Button>
            <Button
              variant="danger"
              onClick={handleCancelBooking}
              loading={actionLoading}
              disabled={actionLoading}
            >
              Cancel Booking
            </Button>
          </div>
        </div>
      </Modal>

      {/* Review Modal */}
      <Modal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        title="Leave a Review"
        size="large"
      >
        <ReviewForm
          booking={booking}
          onSubmit={handleReviewSubmit}
          onCancel={() => setShowReviewModal(false)}
          reviewerType={userRole === 'student' ? 'student' : 'mentor'}
        />
      </Modal>
    </div>
  );
};

export default BookingCard;