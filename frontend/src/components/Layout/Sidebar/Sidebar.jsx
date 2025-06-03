import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { logComponent, logInteraction } from '../../../utils/logger';
import Button from '../../Common/Button/Button';
import styles from './Sidebar.module.css';

const Sidebar = ({ isOpen, onClose, className = '' }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [collapsedSections, setCollapsedSections] = useState(new Set());

  useEffect(() => {
    logComponent('Sidebar', 'mounted');
  }, []);

  useEffect(() => {
    // Close sidebar on route change (mobile)
    if (isOpen && window.innerWidth <= 768) {
      onClose?.();
    }
  }, [location.pathname, isOpen, onClose]);

  const handleLogout = () => {
    logInteraction(document.createElement('button'), 'sidebar_logout_clicked');
    logout();
  };

  const toggleSection = (sectionId) => {
    const newCollapsed = new Set(collapsedSections);
    if (newCollapsed.has(sectionId)) {
      newCollapsed.delete(sectionId);
    } else {
      newCollapsed.add(sectionId);
    }
    setCollapsedSections(newCollapsed);
    
    logInteraction(document.createElement('button'), 'sidebar_section_toggled', { 
      sectionId, 
      collapsed: newCollapsed.has(sectionId) 
    });
  };

  const navigationSections = [
    {
      id: 'main',
      title: 'Main',
      items: [
        {
          to: '/dashboard',
          icon: '📊',
          label: 'Dashboard',
          description: 'Overview and statistics'
        },
        {
          to: '/explore',
          icon: '🔍',
          label: 'Explore',
          description: 'Find time slots'
        }
      ]
    },
    {
      id: 'bookings',
      title: 'Bookings & Slots',
      items: [
        {
          to: '/my-bookings',
          icon: '📅',
          label: 'My Bookings',
          description: 'Track your sessions'
        },
        {
          to: '/my-slots',
          icon: '🕒',
          label: 'My Slots',
          description: 'Manage your offerings'
        }
      ]
    },
    {
      id: 'account',
      title: 'Account',
      items: [
        {
          to: '/profile',
          icon: '👤',
          label: 'Profile',
          description: 'Personal information'
        },
        {
          to: '/wallet',
          icon: '💰',
          label: 'Wallet',
          description: 'Credits and transactions'
        }
      ]
    }
  ];

  const quickActions = [
    {
      label: 'Create Slot',
      icon: '➕',
      action: () => {
        logInteraction(document.createElement('button'), 'sidebar_quick_action', { action: 'create_slot' });
        // Navigate to create slot
      },
      variant: 'primary'
    },
    {
      label: 'Find Sessions',
      icon: '🔍',
      action: () => {
        logInteraction(document.createElement('button'), 'sidebar_quick_action', { action: 'find_sessions' });
        // Navigate to explore
      },
      variant: 'outline'
    }
  ];

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className={styles.overlay}
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`${styles.sidebar} ${isOpen ? styles.open : ''} ${className}`}
        aria-label="Main navigation"
      >
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.logo}>
            <span className={styles.logoIcon}>⏰</span>
            <h2 className={styles.logoText}>TimeSlice</h2>
          </div>
          
          {/* Close button for mobile */}
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* User Profile */}
        {user && (
          <div className={styles.userProfile}>
            <div className={styles.userAvatar}>
              <span className={styles.userInitials}>
                {user.username?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            <div className={styles.userInfo}>
              <h3 className={styles.userName}>{user.username}</h3>
              <p className={styles.userEmail}>{user.email}</p>
              {user.credits !== undefined && (
                <div className={styles.userCredits}>
                  <span className={styles.creditsIcon}>💰</span>
                  <span className={styles.creditsAmount}>
                    {user.credits.toLocaleString()} credits
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className={styles.navigation}>
          {navigationSections.map((section) => (
            <div key={section.id} className={styles.navSection}>
              <button
                className={styles.sectionHeader}
                onClick={() => toggleSection(section.id)}
                aria-expanded={!collapsedSections.has(section.id)}
                aria-controls={`section-${section.id}`}
              >
                <span className={styles.sectionTitle}>{section.title}</span>
                <span 
                  className={`${styles.sectionToggle} ${
                    collapsedSections.has(section.id) ? styles.collapsed : ''
                  }`}
                >
                  ▼
                </span>
              </button>
              
              <div 
                id={`section-${section.id}`}
                className={`${styles.sectionContent} ${
                  collapsedSections.has(section.id) ? styles.collapsed : ''
                }`}
              >
                {section.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `${styles.navItem} ${isActive ? styles.active : ''}`
                    }
                    onClick={() => {
                      logInteraction(document.createElement('a'), 'sidebar_nav_clicked', { 
                        path: item.to,
                        label: item.label 
                      });
                    }}
                  >
                    <span className={styles.navIcon} role="img" aria-hidden="true">
                      {item.icon}
                    </span>
                    <div className={styles.navContent}>
                      <span className={styles.navLabel}>{item.label}</span>
                      <span className={styles.navDescription}>{item.description}</span>
                    </div>
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Quick Actions */}
        <div className={styles.quickActions}>
          <h4 className={styles.quickActionsTitle}>Quick Actions</h4>
          <div className={styles.quickActionsList}>
            {quickActions.map((action, index) => (
              <Button
                key={index}
                variant={action.variant}
                size="small"
                onClick={action.action}
                icon={<span role="img" aria-hidden="true">{action.icon}</span>}
                className={styles.quickActionButton}
              >
                {action.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <Button
            variant="ghost"
            size="small"
            onClick={handleLogout}
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16,17 21,12 16,7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
            }
            className={styles.logoutButton}
          >
            Sign Out
          </Button>
          
          <div className={styles.version}>
            <span>TimeSlice v1.0.0</span>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;