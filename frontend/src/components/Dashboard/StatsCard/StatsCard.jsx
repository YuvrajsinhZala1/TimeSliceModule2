import React, { useEffect, useState } from 'react';
import { logComponent, logInteraction } from '../../../utils/logger';
import { formatCredits } from '../../../utils/helpers';
import CountingAnimation from '../../Animations/CountingAnimation';
import styles from './StatsCard.module.css';

const StatsCard = ({ 
  title, 
  value, 
  subtitle, 
  icon, 
  trend, 
  trendValue, 
  onClick,
  loading = false,
  variant = 'default', // 'default', 'primary', 'success', 'warning', 'danger'
  format = 'number', // 'number', 'currency', 'percentage', 'credits'
  animate = true,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    logComponent('StatsCard', 'mounted', { title, variant });
    setIsVisible(true);
  }, [title, variant]);

  const handleClick = () => {
    if (onClick) {
      logInteraction(document.createElement('button'), 'stats_card_clicked', { 
        title, 
        variant 
      });
      onClick();
    }
  };

  const formatValue = (val) => {
    if (loading || val === undefined || val === null) return '—';
    
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(val);
      case 'percentage':
        return `${val}%`;
      case 'credits':
        return formatCredits(val);
      case 'number':
      default:
        return typeof val === 'number' ? val.toLocaleString() : val;
    }
  };

  const getTrendIcon = () => {
    if (!trend || !trendValue) return null;
    
    if (trend === 'up') {
      return (
        <span className={`${styles.trendIcon} ${styles.up}`}>
          ↗️
        </span>
      );
    } else if (trend === 'down') {
      return (
        <span className={`${styles.trendIcon} ${styles.down}`}>
          ↘️
        </span>
      );
    } else {
      return (
        <span className={`${styles.trendIcon} ${styles.neutral}`}>
          ➡️
        </span>
      );
    }
  };

  const getTrendColor = () => {
    if (!trend) return '';
    
    switch (trend) {
      case 'up':
        return styles.trendUp;
      case 'down':
        return styles.trendDown;
      case 'neutral':
      default:
        return styles.trendNeutral;
    }
  };

  const cardClassName = `
    ${styles.statsCard} 
    ${styles[variant]} 
    ${onClick ? styles.clickable : ''} 
    ${loading ? styles.loading : ''} 
    ${className}
  `.trim();

  return (
    <div 
      className={cardClassName}
      onClick={handleClick}
      role={onClick ? 'button' : 'article'}
      tabIndex={onClick ? 0 : undefined}
      onKeyPress={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      {loading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingSpinner} />
        </div>
      )}

      <div className={styles.cardHeader}>
        {icon && (
          <div className={styles.iconContainer}>
            <span className={styles.icon} role="img" aria-hidden="true">
              {icon}
            </span>
          </div>
        )}
        
        <div className={styles.titleContainer}>
          <h3 className={styles.title}>{title}</h3>
          {subtitle && (
            <p className={styles.subtitle}>{subtitle}</p>
          )}
        </div>

        {(trend && trendValue) && (
          <div className={`${styles.trendContainer} ${getTrendColor()}`}>
            {getTrendIcon()}
            <span className={styles.trendValue}>
              {typeof trendValue === 'number' ? `${trendValue}%` : trendValue}
            </span>
          </div>
        )}
      </div>

      <div className={styles.cardBody}>
        <div className={styles.valueContainer}>
          {animate && typeof value === 'number' && isVisible ? (
            <CountingAnimation
              end={value}
              duration={1500}
              className={styles.value}
              trigger={isVisible}
            />
          ) : (
            <span className={styles.value}>
              {formatValue(value)}
            </span>
          )}
        </div>

        {trend && (
          <div className={styles.trendDescription}>
            <span className={getTrendColor()}>
              {trend === 'up' ? 'Increase' : trend === 'down' ? 'Decrease' : 'No change'} 
              {trendValue && ` of ${trendValue}%`} from last period
            </span>
          </div>
        )}
      </div>

      {onClick && (
        <div className={styles.cardFooter}>
          <span className={styles.viewMore}>
            View details
            <span className={styles.arrow}>→</span>
          </span>
        </div>
      )}
    </div>
  );
};

export default StatsCard;