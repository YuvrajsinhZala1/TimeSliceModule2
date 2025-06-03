import React, { useState, useEffect } from 'react';
import { formatDate, formatRelativeTime } from '../../../utils/helpers';
import { logComponent, logError } from '../../../utils/logger';
import Loading from '../../Common/Loading/Loading';
import styles from './ActivityFeed.module.css';

const ActivityFeed = ({ 
  activities = [], 
  loading = false, 
  maxItems = 10,
  showUserActions = true,
  className = ''
}) => {
  const [filteredActivities, setFilteredActivities] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all', 'bookings', 'slots', 'reviews'

  useEffect(() => {
    logComponent('ActivityFeed', 'mounted');
  }, []);

  useEffect(() => {
    try {
      let filtered = activities;
      
      if (filter !== 'all') {
        filtered = activities.filter(activity => activity.type === filter);
      }
      
      // Sort by date (newest first)
      filtered = filtered.sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      );
      
      // Limit items
      filtered = filtered.slice(0, maxItems);
      
      setFilteredActivities(filtered);
    } catch (error) {
      logError('Error filtering activities:', error);
      setFilteredActivities([]);
    }
  }, [activities, filter, maxItems]);

  const getActivityIcon = (type, action) => {
    const iconMap = {
      'booking': {
        'created': '📅',
        'confirmed': '✅',
        'completed': '🎉',
        'cancelled': '❌'
      },
      'slot': {
        'created': '🆕',
        'updated': '✏️',
        'deleted': '🗑️',
        'booked': '📝'
      },
      'review': {
        'given': '⭐',
        'received': '🌟'
      },
      'wallet': {
        'earned': '💰',
        'spent': '💸',
        'refunded': '💫'
      },
      'profile': {
        'updated': '👤',
        'joined': '🚀'
      }
    };
    
    return iconMap[type]?.[action] || '📋';
  };

  const getActivityColor = (type) => {
    const colorMap = {
      'booking': 'blue',
      'slot': 'green',
      'review': 'yellow',
      'wallet': 'purple',
      'profile': 'gray'
    };
    
    return colorMap[type] || 'gray';
  };

  const renderActivityMessage = (activity) => {
    const { type, action, data } = activity;
    
    switch (type) {
      case 'booking':
        switch (action) {
          case 'created':
            return (
              <span>
                You booked a session: <strong>{data.slotTitle}</strong>
              </span>
            );
          case 'confirmed':
            return (
              <span>
                Your booking for <strong>{data.slotTitle}</strong> was confirmed
              </span>
            );
          case 'completed':
            return (
              <span>
                You completed a session: <strong>{data.slotTitle}</strong>
              </span>
            );
          case 'cancelled':
            return (
              <span>
                Booking cancelled: <strong>{data.slotTitle}</strong>
              </span>
            );
          default:
            return <span>Booking activity</span>;
        }
        
      case 'slot':
        switch (action) {
          case 'created':
            return (
              <span>
                You created a new slot: <strong>{data.title}</strong>
              </span>
            );
          case 'updated':
            return (
              <span>
                You updated your slot: <strong>{data.title}</strong>
              </span>
            );
          case 'deleted':
            return (
              <span>
                You deleted a slot: <strong>{data.title}</strong>
              </span>
            );
          case 'booked':
            return (
              <span>
                Someone booked your slot: <strong>{data.title}</strong>
              </span>
            );
          default:
            return <span>Slot activity</span>;
        }
        
      case 'review':
        switch (action) {
          case 'given':
            return (
              <span>
                You gave a {data.rating}-star review for <strong>{data.slotTitle}</strong>
              </span>
            );
          case 'received':
            return (
              <span>
                You received a {data.rating}-star review for <strong>{data.slotTitle}</strong>
              </span>
            );
          default:
            return <span>Review activity</span>;
        }
        
      case 'wallet':
        switch (action) {
          case 'earned':
            return (
              <span>
                You earned <strong>{data.amount} credits</strong> from session completion
              </span>
            );
          case 'spent':
            return (
              <span>
                You spent <strong>{data.amount} credits</strong> on a booking
              </span>
            );
          case 'refunded':
            return (
              <span>
                You received a refund of <strong>{data.amount} credits</strong>
              </span>
            );
          default:
            return <span>Wallet activity</span>;
        }
        
      case 'profile':
        switch (action) {
          case 'updated':
            return <span>You updated your profile</span>;
          case 'joined':
            return <span>Welcome to TimeSlice! 🎉</span>;
          default:
            return <span>Profile activity</span>;
        }
        
      default:
        return <span>Activity update</span>;
    }
  };

  const filterOptions = [
    { value: 'all', label: 'All Activity' },
    { value: 'booking', label: 'Bookings' },
    { value: 'slot', label: 'Slots' },
    { value: 'review', label: 'Reviews' },
    { value: 'wallet', label: 'Wallet' }
  ];

  if (loading) {
    return (
      <div className={`${styles.activityFeed} ${className}`}>
        <div className={styles.header}>
          <h3 className={styles.title}>Activity Feed</h3>
        </div>
        <div className={styles.loadingContainer}>
          <Loading size="medium" text="Loading activities..." />
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.activityFeed} ${className}`}>
      <div className={styles.header}>
        <h3 className={styles.title}>Activity Feed</h3>
        
        {showUserActions && activities.length > 0 && (
          <div className={styles.filterContainer}>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className={styles.filterSelect}
            >
              {filterOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className={styles.content}>
        {filteredActivities.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📋</div>
            <h4 className={styles.emptyTitle}>No activity yet</h4>
            <p className={styles.emptyText}>
              {filter === 'all' 
                ? "Start using TimeSlice to see your activity here"
                : `No ${filter} activity found`
              }
            </p>
          </div>
        ) : (
          <div className={styles.activityList}>
            {filteredActivities.map((activity, index) => (
              <div 
                key={activity.id || index} 
                className={`${styles.activityItem} ${styles[getActivityColor(activity.type)]}`}
              >
                <div className={styles.activityIcon}>
                  {getActivityIcon(activity.type, activity.action)}
                </div>
                
                <div className={styles.activityContent}>
                  <div className={styles.activityMessage}>
                    {renderActivityMessage(activity)}
                  </div>
                  
                  <div className={styles.activityMeta}>
                    <span className={styles.activityTime}>
                      {formatRelativeTime(activity.createdAt)}
                    </span>
                    
                    {activity.data?.platform && (
                      <span className={styles.activityPlatform}>
                        via {activity.data.platform}
                      </span>
                    )}
                  </div>
                  
                  {activity.data?.description && (
                    <div className={styles.activityDescription}>
                      {activity.data.description}
                    </div>
                  )}
                </div>
                
                <div className={styles.activityDate}>
                  {formatDate(activity.createdAt, 'MMM d')}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {activities.length > maxItems && (
          <div className={styles.showMore}>
            <button className={styles.showMoreButton}>
              View All Activity
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityFeed;