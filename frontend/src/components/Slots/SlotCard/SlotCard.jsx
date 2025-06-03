import React, { useState } from 'react';
import { formatDate, formatCredits, getInitials, isPastDate } from '../../../utils/helpers';
import { logInteraction, logInfo } from '../../../utils/logger';
import Button from '../../Common/Button/Button';
import Modal from '../../Common/Modal/Modal';
import { toast } from 'react-toastify';
import styles from './SlotCard.module.css';

const SlotCard = ({ 
  slot, 
  onBook, 
  onEdit, 
  onDelete, 
  showActions = true, 
  variant = 'default', // 'default', 'compact', 'detailed'
  isOwn = false,
  loading = false 
}) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  if (!slot) {
    return null;
  }

  const isExpired = isPastDate(slot.dateTime);
  const isBooked = slot.status === 'booked' || slot.bookedBy;
  const isCompleted = slot.status === 'completed';
  const isAvailable = !isBooked && !isCompleted && !isExpired;

  const handleBookSlot = async () => {
    try {
      setActionLoading(true);
      logInteraction(document.createElement('button'), 'book_slot_clicked', { 
        slotId: slot._id, 
        title: slot.title 
      });
      
      await onBook(slot);
      logInfo('Slot booking initiated', { slotId: slot._id });
    } catch (error) {
      toast.error('Failed to book slot');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditSlot = () => {
    logInteraction(document.createElement('button'), 'edit_slot_clicked', { 
      slotId: slot._id 
    });
    onEdit(slot);
  };

  const handleDeleteConfirm = async () => {
    try {
      setActionLoading(true);
      logInteraction(document.createElement('button'), 'delete_slot_confirmed', { 
        slotId: slot._id 
      });
      
      await onDelete(slot._id);
      setShowDeleteModal(false);
      toast.success('Slot deleted successfully');
      logInfo('Slot deleted', { slotId: slot._id });
    } catch (error) {
      toast.error('Failed to delete slot');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = () => {
    if (isCompleted) {
      return <span className={`${styles.statusBadge} ${styles.statusCompleted}`}>Completed</span>;
    }
    if (isBooked) {
      return <span className={`${styles.statusBadge} ${styles.statusBooked}`}>Booked</span>;
    }
    if (isExpired) {
      return <span className={`${styles.statusBadge} ${styles.statusExpired}`}>Expired</span>;
    }
    return <span className={`${styles.statusBadge} ${styles.statusAvailable}`}>Available</span>;
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

  const cardClassName = `${styles.slotCard} ${styles[variant]} ${isExpired ? styles.expired : ''} ${isBooked ? styles.booked : ''}`;

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
            {slot.description.length > 120 
              ? `${slot.description.substring(0, 120)}...` 
              : slot.description
            }
          </p>
        )}

        {/* Slot Meta Information */}
        <div className={styles.slotMeta}>
          <div className={styles.metaRow}>
            <div className={styles.metaItem}>
              <span className={styles.metaIcon}>⏱️</span>
              <span className={styles.metaText}>{slot.duration} min</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaIcon}>💰</span>
              <span className={styles.metaText}>{formatCredits(slot.cost)} credits</span>
            </div>
          </div>

          <div className={styles.metaRow}>
            <div className={styles.metaItem}>
              <span className={styles.metaIcon}>📅</span>
              <span className={styles.metaText}>
                {formatDate(slot.dateTime, 'MMM dd, yyyy')}
              </span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaIcon}>🕐</span>
              <span className={styles.metaText}>
                {formatDate(slot.dateTime, 'h:mm a')}
              </span>
            </div>
          </div>

          {slot.platform && (
            <div className={styles.metaRow}>
              <div className={styles.metaItem}>
                <span className={styles.metaIcon}>🖥️</span>
                <span className={styles.metaText}>{slot.platform}</span>
              </div>
            </div>
          )}
        </div>

        {/* Mentor Information */}
        {slot.createdBy && !isOwn && (
          <div className={styles.mentorInfo}>
            <div className={styles.mentorAvatar}>
              <span className={styles.mentorInitials}>
                {getInitials(slot.createdBy.username)}
              </span>
            </div>
            <div className={styles.mentorDetails}>
              <span className={styles.mentorName}>{slot.createdBy.username}</span>
              {slot.createdBy.rating && (
                <div className={styles.mentorRating}>
                  <span className={styles.ratingStars}>
                    {[...Array(5)].map((_, i) => (
                      <span 
                        key={i} 
                        className={`${styles.star} ${i < Math.floor(slot.createdBy.rating.average) ? styles.starFilled : ''}`}
                      >
                        ⭐
                      </span>
                    ))}
                  </span>
                  <span className={styles.ratingText}>
                    ({slot.createdBy.rating.count})
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tags */}
        {slot.tags && slot.tags.length > 0 && (
          <div className={styles.tagsSection}>
            {slot.tags.slice(0, 3).map((tag, index) => (
              <span key={index} className={styles.tag}>
                {tag}
              </span>
            ))}
            {slot.tags.length > 3 && (
              <span className={styles.tagMore}>
                +{slot.tags.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Booking Information */}
        {isBooked && slot.bookedBy && (
          <div className={styles.bookingInfo}>
            <div className={styles.bookingLabel}>Booked by:</div>
            <div className={styles.bookingUser}>
              <span className={styles.bookedUserInitials}>
                {getInitials(slot.bookedBy.username)}
              </span>
              <span className={styles.bookedUserName}>
                {slot.bookedBy.username}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Card Actions */}
      {showActions && (
        <div className={styles.cardActions}>
          {isOwn ? (
            // Owner actions
            <div className={styles.ownerActions}>
              {isAvailable && (
                <Button
                  variant="outline"
                  size="small"
                  onClick={handleEditSlot}
                  disabled={loading}
                  icon={
                    <svg viewBox="0 0 20 20" fill="currentColor">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
                    </svg>
                  }
                >
                  Edit
                </Button>
              )}
              
              {(isAvailable || isExpired) && (
                <Button
                  variant="danger"
                  size="small"
                  onClick={() => setShowDeleteModal(true)}
                  disabled={loading}
                  icon={
                    <svg viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"/>
                    </svg>
                  }
                >
                  Delete
                </Button>
              )}
              
              {isBooked && (
                <div className={styles.bookedStatus}>
                  <span className={styles.bookedIcon}>✅</span>
                  <span className={styles.bookedText}>Booked</span>
                </div>
              )}
              
              {isCompleted && (
                <div className={styles.completedStatus}>
                  <span className={styles.completedIcon}>🎉</span>
                  <span className={styles.completedText}>Completed</span>
                </div>
              )}
            </div>
          ) : (
            // Student actions
            <div className={styles.studentActions}>
              {isAvailable && onBook && (
                <Button
                  variant="primary"
                  size="medium"
                  onClick={handleBookSlot}
                  loading={actionLoading}
                  disabled={loading || actionLoading}
                  icon={
                    <svg viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                    </svg>
                  }
                  fullWidth
                >
                  Book Session
                </Button>
              )}
              
              {isBooked && (
                <div className={styles.unavailableMessage}>
                  <span className={styles.unavailableIcon}>📅</span>
                  <span className={styles.unavailableText}>Already Booked</span>
                </div>
              )}
              
              {isExpired && (
                <div className={styles.unavailableMessage}>
                  <span className={styles.unavailableIcon}>⏰</span>
                  <span className={styles.unavailableText}>Session Expired</span>
                </div>
              )}
              
              {isCompleted && (
                <div className={styles.unavailableMessage}>
                  <span className={styles.unavailableIcon}>✅</span>
                  <span className={styles.unavailableText}>Session Completed</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Time Slot"
        size="medium"
      >
        <div className={styles.deleteConfirmation}>
          <div className={styles.deleteWarning}>
            <span className={styles.warningIcon}>⚠️</span>
            <div className={styles.warningContent}>
              <h4 className={styles.warningTitle}>Are you sure?</h4>
              <p className={styles.warningText}>
                This action cannot be undone. This will permanently delete your time slot.
              </p>
            </div>
          </div>

          <div className={styles.deleteDetails}>
            <h5 className={styles.deleteDetailsTitle}>Slot Details:</h5>
            <p><strong>Title:</strong> {slot.title}</p>
            <p><strong>Date:</strong> {formatDate(slot.dateTime, 'MMM dd, yyyy at h:mm a')}</p>
            <p><strong>Duration:</strong> {slot.duration} minutes</p>
            <p><strong>Cost:</strong> {formatCredits(slot.cost)} credits</p>
          </div>

          <div className={styles.deleteActions}>
            <Button
              variant="outline"
              onClick={() => setShowDeleteModal(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteConfirm}
              loading={actionLoading}
              disabled={actionLoading}
            >
              Delete Slot
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SlotCard;