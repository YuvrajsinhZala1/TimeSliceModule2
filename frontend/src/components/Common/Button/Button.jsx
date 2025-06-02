import React, { forwardRef } from 'react';
import { logInteraction, logComponent } from '../../../utils/logger';
import styles from './Button.module.css';

const Button = forwardRef(({
  children,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  fullWidth = false,
  icon,
  iconPosition = 'left',
  className = '',
  onClick,
  type = 'button',
  ...props
}, ref) => {
  
  const handleClick = (e) => {
    if (disabled || loading) {
      e.preventDefault();
      return;
    }

    // Log button interaction
    logInteraction(e.target, 'button_clicked', {
      variant,
      size,
      hasIcon: !!icon,
      buttonText: typeof children === 'string' ? children : 'Button'
    });

    if (onClick) {
      onClick(e);
    }
  };

  const buttonClasses = [
    styles.button,
    styles[variant],
    styles[size],
    disabled && styles.disabled,
    loading && styles.loading,
    fullWidth && styles.fullWidth,
    icon && styles.hasIcon,
    className
  ].filter(Boolean).join(' ');

  const renderIcon = () => {
    if (loading) {
      return (
        <svg className={styles.spinner} viewBox="0 0 24 24" fill="none">
          <circle 
            className={styles.spinnerCircle} 
            cx="12" 
            cy="12" 
            r="10" 
            stroke="currentColor" 
            strokeWidth="4"
          />
          <path 
            className={styles.spinnerPath}
            fill="currentColor" 
            d="m12 2a10 10 0 0 1 10 10h-2a8 8 0 0 0-8-8v-2z"
          />
        </svg>
      );
    }

    if (icon) {
      return <span className={styles.icon}>{icon}</span>;
    }

    return null;
  };

  const renderContent = () => {
    if (loading) {
      return (
        <>
          {renderIcon()}
          <span className={styles.loadingText}>Loading...</span>
        </>
      );
    }

    return (
      <>
        {icon && iconPosition === 'left' && renderIcon()}
        {children && <span className={styles.buttonText}>{children}</span>}
        {icon && iconPosition === 'right' && renderIcon()}
      </>
    );
  };

  return (
    <button
      ref={ref}
      type={type}
      className={buttonClasses}
      disabled={disabled || loading}
      onClick={handleClick}
      aria-disabled={disabled || loading}
      aria-busy={loading}
      {...props}
    >
      <span className={styles.buttonContent}>
        {renderContent()}
      </span>
      
      {/* Ripple effect */}
      <span className={styles.ripple} />
    </button>
  );
});

Button.displayName = 'Button';

// Export variants for easy use
export const PrimaryButton = (props) => <Button variant="primary" {...props} />;
export const SecondaryButton = (props) => <Button variant="secondary" {...props} />;
export const OutlineButton = (props) => <Button variant="outline" {...props} />;
export const GhostButton = (props) => <Button variant="ghost" {...props} />;
export const DangerButton = (props) => <Button variant="danger" {...props} />;
export const SuccessButton = (props) => <Button variant="success" {...props} />;
export const WarningButton = (props) => <Button variant="warning" {...props} />;

export default Button;