import React, { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { logComponent, logInteraction } from '../../../utils/logger';
import Button from '../Button/Button';
import styles from './Modal.module.css';

const Modal = ({
  isOpen = false,
  onClose,
  title = '',
  children,
  size = 'medium',
  variant = 'default',
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscapeKey = true,
  preventScroll = true,
  className = '',
  overlayClassName = '',
  contentClassName = '',
  headerClassName = '',
  bodyClassName = '',
  footerClassName = '',
  footer,
  loading = false,
  ...props
}) => {
  const modalRef = useRef(null);
  const previousActiveElement = useRef(null);
  const firstFocusableElement = useRef(null);
  const lastFocusableElement = useRef(null);

  // Log modal usage
  useEffect(() => {
    if (isOpen) {
      logComponent('Modal', 'opened', { title, size, variant });
    }
  }, [isOpen, title, size, variant]);

  // Handle escape key
  const handleEscapeKey = useCallback((event) => {
    if (event.key === 'Escape' && closeOnEscapeKey) {
      event.preventDefault();
      handleClose();
    }
  }, [closeOnEscapeKey]);

  // Handle overlay click
  const handleOverlayClick = useCallback((event) => {
    if (event.target === event.currentTarget && closeOnOverlayClick) {
      handleClose();
    }
  }, [closeOnOverlayClick]);

  // Handle close
  const handleClose = useCallback(() => {
    logInteraction(modalRef.current, 'modal_closed', { title });
    if (onClose) {
      onClose();
    }
  }, [onClose, title]);

  // Handle tab key for focus trapping
  const handleTabKey = useCallback((event) => {
    if (event.key === 'Tab') {
      if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstFocusableElement.current) {
          event.preventDefault();
          lastFocusableElement.current?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastFocusableElement.current) {
          event.preventDefault();
          firstFocusableElement.current?.focus();
        }
      }
    }
  }, []);

  // Focus management
  useEffect(() => {
    if (isOpen) {
      // Store the current active element
      previousActiveElement.current = document.activeElement;

      // Prevent body scroll
      if (preventScroll) {
        document.body.style.overflow = 'hidden';
      }

      // Find focusable elements
      const modal = modalRef.current;
      if (modal) {
        const focusableElements = modal.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        firstFocusableElement.current = focusableElements[0];
        lastFocusableElement.current = focusableElements[focusableElements.length - 1];

        // Focus the first focusable element or the modal itself
        if (firstFocusableElement.current) {
          firstFocusableElement.current.focus();
        } else {
          modal.focus();
        }
      }

      // Add event listeners
      document.addEventListener('keydown', handleEscapeKey);
      document.addEventListener('keydown', handleTabKey);

      return () => {
        // Cleanup
        document.removeEventListener('keydown', handleEscapeKey);
        document.removeEventListener('keydown', handleTabKey);
        
        if (preventScroll) {
          document.body.style.overflow = '';
        }

        // Restore focus
        if (previousActiveElement.current) {
          previousActiveElement.current.focus();
        }
      };
    }
  }, [isOpen, preventScroll, handleEscapeKey, handleTabKey]);

  // Don't render if not open
  if (!isOpen) {
    return null;
  }

  const modalClasses = [
    styles.modal,
    styles[size],
    styles[variant],
    loading && styles.loading,
    className
  ].filter(Boolean).join(' ');

  const overlayClasses = [
    styles.overlay,
    overlayClassName
  ].filter(Boolean).join(' ');

  const contentClasses = [
    styles.content,
    contentClassName
  ].filter(Boolean).join(' ');

  const modalContent = (
    <div className={overlayClasses} onClick={handleOverlayClick}>
      <div
        ref={modalRef}
        className={modalClasses}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        tabIndex={-1}
        {...props}
      >
        <div className={contentClasses}>
          {/* Header */}
          {(title || showCloseButton) && (
            <div className={`${styles.header} ${headerClassName}`}>
              {title && (
                <h2 id="modal-title" className={styles.title}>
                  {title}
                </h2>
              )}
              
              {showCloseButton && (
                <Button
                  variant="ghost"
                  size="small"
                  className={styles.closeButton}
                  onClick={handleClose}
                  aria-label="Close modal"
                  icon={
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  }
                />
              )}
            </div>
          )}

          {/* Body */}
          <div className={`${styles.body} ${bodyClassName}`}>
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className={`${styles.footer} ${footerClassName}`}>
              {footer}
            </div>
          )}
        </div>

        {/* Loading overlay */}
        {loading && (
          <div className={styles.loadingOverlay}>
            <div className={styles.loadingSpinner}>
              <svg viewBox="0 0 24 24" fill="none">
                <circle 
                  cx="12" 
                  cy="12" 
                  r="10" 
                  stroke="currentColor" 
                  strokeWidth="4"
                  className={styles.spinnerCircle}
                />
                <path 
                  fill="currentColor" 
                  d="m12 2a10 10 0 0 1 10 10h-2a8 8 0 0 0-8-8v-2z"
                  className={styles.spinnerPath}
                />
              </svg>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Render modal in portal
  return createPortal(modalContent, document.body);
};

// Preset modal components for common use cases
export const ConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  loading = false,
  ...props 
}) => {
  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
  };

  const footer = (
    <div className={styles.confirmModalFooter}>
      <Button
        variant="outline"
        onClick={onClose}
        disabled={loading}
      >
        {cancelText}
      </Button>
      <Button
        variant={variant}
        onClick={handleConfirm}
        loading={loading}
      >
        {confirmText}
      </Button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="small"
      footer={footer}
      loading={loading}
      {...props}
    >
      <p className={styles.confirmMessage}>{message}</p>
    </Modal>
  );
};

export const AlertModal = ({ 
  isOpen, 
  onClose, 
  title = 'Alert',
  message = '',
  buttonText = 'OK',
  variant = 'primary',
  ...props 
}) => {
  const footer = (
    <div className={styles.alertModalFooter}>
      <Button
        variant={variant}
        onClick={onClose}
        fullWidth
      >
        {buttonText}
      </Button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="small"
      footer={footer}
      {...props}
    >
      <p className={styles.alertMessage}>{message}</p>
    </Modal>
  );
};

export const LoadingModal = ({ 
  isOpen, 
  title = 'Loading...',
  message = 'Please wait while we process your request.',
  ...props 
}) => {
  return (
    <Modal
      isOpen={isOpen}
      title={title}
      size="small"
      showCloseButton={false}
      closeOnOverlayClick={false}
      closeOnEscapeKey={false}
      loading={true}
      {...props}
    >
      <p className={styles.loadingMessage}>{message}</p>
    </Modal>
  );
};

export default Modal;