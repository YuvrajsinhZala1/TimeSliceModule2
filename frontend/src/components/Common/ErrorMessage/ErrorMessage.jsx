import React from 'react';
import { logComponent, logInteraction } from '../../../utils/logger';
import Button from '../Button/Button';
import styles from './ErrorMessage.module.css';

const ErrorMessage = ({
  message = 'Something went wrong. Please try again.',
  title = 'Error',
  variant = 'error',
  size = 'medium',
  showIcon = true,
  showRetry = false,
  showReload = false,
  showDismiss = false,
  onRetry,
  onReload,
  onDismiss,
  className = '',
  details = null,
  showDetails = false,
  ...props
}) => {
  const [detailsVisible, setDetailsVisible] = React.useState(showDetails);

  React.useEffect(() => {
    logComponent('ErrorMessage', 'displayed', { message, variant, size });
  }, [message, variant, size]);

  const handleRetry = () => {
    logInteraction(document.createElement('button'), 'error_retry_clicked', { message });
    if (onRetry) {
      onRetry();
    }
  };

  const handleReload = () => {
    logInteraction(document.createElement('button'), 'error_reload_clicked', { message });
    if (onReload) {
      onReload();
    } else {
      window.location.reload();
    }
  };

  const handleDismiss = () => {
    logInteraction(document.createElement('button'), 'error_dismiss_clicked', { message });
    if (onDismiss) {
      onDismiss();
    }
  };

  const toggleDetails = () => {
    setDetailsVisible(!detailsVisible);
    logInteraction(document.createElement('button'), 'error_details_toggled', { visible: !detailsVisible });
  };

  const errorClasses = [
    styles.errorMessage,
    styles[variant],
    styles[size],
    className
  ].filter(Boolean).join(' ');

  const getIcon = () => {
    switch (variant) {
      case 'warning':
        return (
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.345 0-2.189-1.458-1.515-2.625L8.485 2.495zM12 9a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0112 9zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
        );
      case 'info':
        return (
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 11-.671-1.34l.041-.022zM12 9a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
          </svg>
        );
      case 'success':
        return (
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
          </svg>
        );
      default: // error
        return (
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  return (
    <div className={errorClasses} role="alert" {...props}>
      <div className={styles.content}>
        {/* Icon and Title */}
        <div className={styles.header}>
          {showIcon && (
            <div className={styles.icon}>
              {getIcon()}
            </div>
          )}
          
          <div className={styles.titleContainer}>
            {title && <h3 className={styles.title}>{title}</h3>}
            <p className={styles.message}>{message}</p>
          </div>

          {/* Dismiss Button */}
          {showDismiss && (
            <button
              className={styles.dismissButton}
              onClick={handleDismiss}
              aria-label="Dismiss error"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          )}
        </div>

        {/* Actions */}
        {(showRetry || showReload || details) && (
          <div className={styles.actions}>
            {showRetry && (
              <Button
                variant="outline"
                size="small"
                onClick={handleRetry}
              >
                Try Again
              </Button>
            )}
            
            {showReload && (
              <Button
                variant="outline"
                size="small"
                onClick={handleReload}
                icon={
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <polyline points="23 4 23 10 17 10"></polyline>
                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                  </svg>
                }
              >
                Reload Page
              </Button>
            )}

            {details && (
              <Button
                variant="ghost"
                size="small"
                onClick={toggleDetails}
                icon={
                  <svg 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor"
                    style={{ 
                      transform: detailsVisible ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease'
                    }}
                  >
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                }
              >
                {detailsVisible ? 'Hide' : 'Show'} Details
              </Button>
            )}
          </div>
        )}

        {/* Error Details */}
        {details && detailsVisible && (
          <div className={styles.details}>
            <h4 className={styles.detailsTitle}>Error Details:</h4>
            <pre className={styles.detailsContent}>
              {typeof details === 'string' ? details : JSON.stringify(details, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

// Preset error components for common use cases
export const NetworkError = ({ onRetry, ...props }) => (
  <ErrorMessage
    title="Connection Error"
    message="Unable to connect to the server. Please check your internet connection and try again."
    variant="error"
    showRetry
    onRetry={onRetry}
    {...props}
  />
);

export const NotFoundError = ({ onGoHome, ...props }) => (
  <ErrorMessage
    title="Page Not Found"
    message="The page you're looking for doesn't exist or has been moved."
    variant="warning"
    showRetry={false}
    {...props}
  />
);

export const PermissionError = ({ onLogin, ...props }) => (
  <ErrorMessage
    title="Access Denied"
    message="You don't have permission to access this resource. Please log in and try again."
    variant="warning"
    showRetry={false}
    {...props}
  />
);

export const ServerError = ({ onRetry, ...props }) => (
  <ErrorMessage
    title="Server Error"
    message="Our servers are experiencing issues. Please try again in a few moments."
    variant="error"
    showRetry
    showReload
    onRetry={onRetry}
    {...props}
  />
);

export const ValidationError = ({ errors = [], ...props }) => (
  <ErrorMessage
    title="Validation Error"
    message="Please correct the following errors:"
    variant="warning"
    showRetry={false}
    details={errors.length > 0 ? errors.join('\n') : null}
    showDetails={errors.length > 0}
    {...props}
  />
);

export default ErrorMessage;