import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { bookingService } from '../../../services/bookingService';
import { formatDate, formatCredits } from '../../../utils/helpers';
import { logInfo, logError, logComponent } from '../../../utils/logger';
import Button from '../../Common/Button/Button';
import Modal from '../../Common/Modal/Modal';
import Loading from '../../Common/Loading/Loading';
import styles from './BookingModal.module.css';

const BookingModal = ({ 
  isOpen, 
  onClose, 
  slot, 
  onBookingSuccess,
  user 
}) => {
  const [loading, setLoading] = useState(false);
  const [bookingData, setBookingData] = useState({
    message: '',
    platform: slot?.platform || 'Zoom'
  });
  const [step, setStep] = useState(1); // 1: Confirm, 2: Details, 3: Success

  useEffect(() => {
    if (isOpen) {
      logComponent('BookingModal', 'opened', { slotId: slot?._id });
      setStep(1);
      setBookingData({
        message: '',
        platform: slot?.platform || 'Zoom'
      });
    }
  }, [isOpen, slot]);

  const handleBooking = async () => {
    if (!slot || !user) return;

    try {
      setLoading(true);
      logInfo('Creating booking', { slotId: slot._id });

      const booking = {
        slotId: slot._id,
        message: bookingData.message.trim(),
        platform: bookingData.platform
      };

      const response = await bookingService.createBooking(booking);
      
      if (response.success) {
        logInfo('Booking created successfully', { bookingId: response.data._id });
        setStep(3);
        
        if (onBookingSuccess) {
          onBookingSuccess(response.data);
        }
        
        setTimeout(() => {
          onClose();
          toast.success('Booking request sent successfully!');
        }, 2000);
      }
    } catch (error) {
      logError('Booking creation failed:', error);
      toast.error(error.message || 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setBookingData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const canProceed = () => {
    if (step === 1) return true;
    if (step === 2) return bookingData.platform.trim().length > 0;
    return false;
  };

  const renderStep1 = () => (
    <div className={styles.stepContent}>
      <div className={styles.slotDetails}>
        <div className={styles.slotHeader}>
          <h3 className={styles.slotTitle}>{slot?.title}</h3>
          <span className={styles.slotCategory}>{slot?.category}</span>
        </div>
        
        <div className={styles.slotInfo}>
          <div className={styles.infoRow}>
            <span className={styles.infoIcon}>📅</span>
            <span>{formatDate(slot?.dateTime, 'EEEE, MMMM d, yyyy')}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoIcon}>🕐</span>
            <span>{formatDate(slot?.dateTime, 'h:mm a')}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoIcon}>⏱️</span>
            <span>{slot?.duration} minutes</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoIcon}>💰</span>
            <span>{formatCredits(slot?.cost)} credits</span>
          </div>
        </div>

        {slot?.description && (
          <div className={styles.slotDescription}>
            <h4>Description</h4>
            <p>{slot.description}</p>
          </div>
        )}

        <div className={styles.mentorInfo}>
          <h4>Session with</h4>
          <div className={styles.mentorProfile}>
            <div className={styles.mentorAvatar}>
              {slot?.createdBy?.username?.charAt(0).toUpperCase()}
            </div>
            <div className={styles.mentorDetails}>
              <span className={styles.mentorName}>{slot?.createdBy?.username}</span>
              {slot?.createdBy?.rating && (
                <div className={styles.mentorRating}>
                  <span className={styles.rating}>
                    ⭐ {slot.createdBy.rating.average?.toFixed(1)}
                  </span>
                  <span className={styles.reviewCount}>
                    ({slot.createdBy.rating.count} reviews)
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className={styles.confirmationText}>
        <p>You're about to book this session. Are you sure you want to proceed?</p>
        <div className={styles.creditWarning}>
          <span className={styles.warningIcon}>ℹ️</span>
          <span>
            {formatCredits(slot?.cost)} credits will be deducted from your wallet upon confirmation.
          </span>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className={styles.stepContent}>
      <div className={styles.detailsForm}>
        <h3>Booking Details</h3>
        
        <div className={styles.formGroup}>
          <label className={styles.label}>
            Platform for the session *
          </label>
          <select
            value={bookingData.platform}
            onChange={(e) => handleChange('platform', e.target.value)}
            className={styles.select}
            required
          >
            <option value="Zoom">Zoom</option>
            <option value="Google Meet">Google Meet</option>
            <option value="Microsoft Teams">Microsoft Teams</option>
            <option value="Discord">Discord</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>
            Message to mentor (optional)
          </label>
          <textarea
            value={bookingData.message}
            onChange={(e) => handleChange('message', e.target.value)}
            className={styles.textarea}
            placeholder="Let the mentor know what you'd like to focus on..."
            rows={4}
            maxLength={500}
          />
          <span className={styles.charCount}>
            {bookingData.message.length}/500 characters
          </span>
        </div>

        <div className={styles.bookingSummary}>
          <h4>Booking Summary</h4>
          <div className={styles.summaryItem}>
            <span>Session:</span>
            <span>{slot?.title}</span>
          </div>
          <div className={styles.summaryItem}>
            <span>Date & Time:</span>
            <span>
              {formatDate(slot?.dateTime, 'MMM d, yyyy - h:mm a')}
            </span>
          </div>
          <div className={styles.summaryItem}>
            <span>Duration:</span>
            <span>{slot?.duration} minutes</span>
          </div>
          <div className={styles.summaryItem}>
            <span>Platform:</span>
            <span>{bookingData.platform}</span>
          </div>
          <div className={`${styles.summaryItem} ${styles.totalCost}`}>
            <span>Total Cost:</span>
            <span>{formatCredits(slot?.cost)} credits</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className={styles.stepContent}>
      <div className={styles.successContent}>
        <div className={styles.successIcon}>🎉</div>
        <h3>Booking Request Sent!</h3>
        <p>
          Your booking request has been sent to the mentor. You'll receive a notification 
          once they confirm your session.
        </p>
        
        <div className={styles.nextSteps}>
          <h4>What's next?</h4>
          <ul>
            <li>The mentor will review and confirm your booking</li>
            <li>You'll receive a notification with session details</li>
            <li>Credits will be deducted only after confirmation</li>
            <li>You can track your booking in "My Bookings"</li>
          </ul>
        </div>
      </div>
    </div>
  );

  const getStepTitle = () => {
    switch (step) {
      case 1: return 'Confirm Booking';
      case 2: return 'Booking Details';
      case 3: return 'Success!';
      default: return 'Book Session';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={getStepTitle()}
      size="large"
      className={styles.bookingModal}
    >
      <div className={styles.modalContent}>
        {/* Progress Indicator */}
        <div className={styles.progressBar}>
          <div className={styles.progressSteps}>
            <div className={`${styles.step} ${step >= 1 ? styles.active : ''}`}>
              <span>1</span>
              <label>Confirm</label>
            </div>
            <div className={`${styles.stepLine} ${step >= 2 ? styles.active : ''}`} />
            <div className={`${styles.step} ${step >= 2 ? styles.active : ''}`}>
              <span>2</span>
              <label>Details</label>
            </div>
            <div className={`${styles.stepLine} ${step >= 3 ? styles.active : ''}`} />
            <div className={`${styles.step} ${step >= 3 ? styles.active : ''}`}>
              <span>3</span>
              <label>Success</label>
            </div>
          </div>
        </div>

        {/* Step Content */}
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}

        {/* Actions */}
        {step < 3 && (
          <div className={styles.modalActions}>
            <Button
              variant="outline"
              onClick={step === 1 ? onClose : () => setStep(step - 1)}
              disabled={loading}
            >
              {step === 1 ? 'Cancel' : 'Back'}
            </Button>
            
            <Button
              variant="primary"
              onClick={step === 1 ? () => setStep(2) : handleBooking}
              disabled={loading || !canProceed()}
              loading={loading}
            >
              {step === 1 ? 'Next' : 'Confirm Booking'}
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default BookingModal;