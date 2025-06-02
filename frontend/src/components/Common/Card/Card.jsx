import React, { forwardRef } from 'react';
import { logComponent, logInteraction } from '../../../utils/logger';
import styles from './Card.module.css';

const Card = forwardRef(({
  children,
  variant = 'default',
  size = 'medium',
  hover = false,
  clickable = false,
  loading = false,
  className = '',
  headerClassName = '',
  bodyClassName = '',
  footerClassName = '',
  header,
  footer,
  onClick,
  ...props
}, ref) => {

  const handleClick = (e) => {
    if (clickable && onClick) {
      logInteraction(e.target, 'card_clicked', { variant, size });
      onClick(e);
    }
  };

  const cardClasses = [
    styles.card,
    styles[variant],
    styles[size],
    hover && styles.hover,
    clickable && styles.clickable,
    loading && styles.loading,
    className
  ].filter(Boolean).join(' ');

  const cardProps = {
    ref,
    className: cardClasses,
    onClick: handleClick,
    role: clickable ? 'button' : undefined,
    tabIndex: clickable ? 0 : undefined,
    'aria-disabled': loading,
    ...props
  };

  // Log card usage for debugging
  React.useEffect(() => {
    logComponent('Card', 'rendered', { variant, size, clickable, hover });
  }, [variant, size, clickable, hover]);

  const renderContent = () => {
    if (loading) {
      return (
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSkeleton}>
            <div className={styles.skeletonHeader}></div>
            <div className={styles.skeletonLine}></div>
            <div className={styles.skeletonLine}></div>
            <div className={styles.skeletonLine}></div>
          </div>
        </div>
      );
    }

    return (
      <>
        {header && (
          <div className={`${styles.header} ${headerClassName}`}>
            {header}
          </div>
        )}
        
        <div className={`${styles.body} ${bodyClassName}`}>
          {children}
        </div>
        
        {footer && (
          <div className={`${styles.footer} ${footerClassName}`}>
            {footer}
          </div>
        )}
      </>
    );
  };

  return (
    <div {...cardProps}>
      {renderContent()}
      
      {/* Ripple effect for clickable cards */}
      {clickable && <span className={styles.ripple} />}
    </div>
  );
});

Card.displayName = 'Card';

// Preset card components for common use cases
export const FeatureCard = ({ 
  icon, 
  title, 
  description, 
  action,
  ...props 
}) => (
  <Card variant="feature" hover {...props}>
    <div className={styles.featureContent}>
      {icon && <div className={styles.featureIcon}>{icon}</div>}
      {title && <h3 className={styles.featureTitle}>{title}</h3>}
      {description && <p className={styles.featureDescription}>{description}</p>}
      {action && <div className={styles.featureAction}>{action}</div>}
    </div>
  </Card>
);

export const StatsCard = ({ 
  value, 
  label, 
  icon, 
  trend,
  trendValue,
  ...props 
}) => (
  <Card variant="stats" hover {...props}>
    <div className={styles.statsContent}>
      <div className={styles.statsHeader}>
        <div className={styles.statsValue}>{value}</div>
        {icon && <div className={styles.statsIcon}>{icon}</div>}
      </div>
      <div className={styles.statsLabel}>{label}</div>
      {trend && (
        <div className={`${styles.statsTrend} ${styles[trend]}`}>
          {trend === 'up' ? '↗' : trend === 'down' ? '↘' : '→'} {trendValue}
        </div>
      )}
    </div>
  </Card>
);

export const ProductCard = ({ 
  image, 
  title, 
  description, 
  price, 
  badge,
  actions,
  ...props 
}) => (
  <Card variant="product" hover {...props}>
    <div className={styles.productContent}>
      {image && (
        <div className={styles.productImage}>
          {typeof image === 'string' ? <img src={image} alt={title} /> : image}
          {badge && <div className={styles.productBadge}>{badge}</div>}
        </div>
      )}
      <div className={styles.productInfo}>
        {title && <h3 className={styles.productTitle}>{title}</h3>}
        {description && <p className={styles.productDescription}>{description}</p>}
        {price && <div className={styles.productPrice}>{price}</div>}
        {actions && <div className={styles.productActions}>{actions}</div>}
      </div>
    </div>
  </Card>
);

export const NotificationCard = ({ 
  type = 'info',
  title, 
  message, 
  timestamp,
  icon,
  onClose,
  ...props 
}) => (
  <Card variant={type} className={styles.notification} {...props}>
    <div className={styles.notificationContent}>
      {icon && <div className={styles.notificationIcon}>{icon}</div>}
      <div className={styles.notificationBody}>
        {title && <h4 className={styles.notificationTitle}>{title}</h4>}
        {message && <p className={styles.notificationMessage}>{message}</p>}
        {timestamp && <time className={styles.notificationTime}>{timestamp}</time>}
      </div>
      {onClose && (
        <button 
          className={styles.notificationClose}
          onClick={onClose}
          aria-label="Close notification"
        >
          ×
        </button>
      )}
    </div>
  </Card>
);

export const ProfileCard = ({ 
  avatar, 
  name, 
  role, 
  bio,
  stats,
  actions,
  ...props 
}) => (
  <Card variant="profile" hover {...props}>
    <div className={styles.profileContent}>
      {avatar && <div className={styles.profileAvatar}>{avatar}</div>}
      <div className={styles.profileInfo}>
        {name && <h3 className={styles.profileName}>{name}</h3>}
        {role && <p className={styles.profileRole}>{role}</p>}
        {bio && <p className={styles.profileBio}>{bio}</p>}
        {stats && <div className={styles.profileStats}>{stats}</div>}
        {actions && <div className={styles.profileActions}>{actions}</div>}
      </div>
    </div>
  </Card>
);

export default Card;