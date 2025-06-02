import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { toast } from 'react-toastify';
import { logInfo, logError, logInteraction, logComponent } from '../../../utils/logger';
import { formatCredits } from '../../../utils/helpers';
import styles from './Header.module.css';

const Header = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Log component mount
  useEffect(() => {
    logComponent('Header', 'mounted');
  }, []);

  const handleLogout = () => {
    logInteraction(document.createElement('button'), 'logout_clicked');
    logout();
    toast.success('Logged out successfully');
    navigate('/');
    setIsProfileOpen(false);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    logInteraction(document.createElement('button'), 'mobile_menu_toggled', { isOpen: !isMenuOpen });
  };

  const toggleProfile = () => {
    setIsProfileOpen(!isProfileOpen);
    logInteraction(document.createElement('button'), 'profile_menu_toggled', { isOpen: !isProfileOpen });
  };

  const isActiveLink = (path) => {
    return location.pathname === path;
  };

  const NavLink = ({ to, children, className = "", onClick }) => (
    <Link
      to={to}
      className={`${styles.navLink} ${isActiveLink(to) ? styles.navLinkActive : ''} ${className}`}
      onClick={() => {
        setIsMenuOpen(false);
        if (onClick) onClick();
        logInteraction(document.createElement('link'), 'nav_link_clicked', { to });
      }}
    >
      {children}
    </Link>
  );

  return (
    <>
      {/* Skip to main content link for accessibility */}
      <a href="#main-content" className={styles.skipLink}>
        Skip to main content
      </a>

      <header className={`${styles.header} ${isScrolled ? styles.headerScrolled : ''}`}>
        <div className={styles.container}>
          <div className={styles.headerContent}>
            {/* Logo */}
            <div className={styles.logoSection}>
              <Link 
                to="/" 
                className={styles.logo}
                onClick={() => logInteraction(document.createElement('link'), 'logo_clicked')}
              >
                <div className={styles.logoIcon}>
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                </div>
                <span className={styles.logoText}>TimeSlice</span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className={styles.desktopNav}>
              <NavLink to="/">Home</NavLink>
              <NavLink to="/explore">Explore</NavLink>
              
              {user && (
                <>
                  <NavLink to="/dashboard">Dashboard</NavLink>
                  <NavLink to="/my-bookings">Bookings</NavLink>
                  <NavLink to="/my-slots">My Slots</NavLink>
                </>
              )}
            </nav>

            {/* Right side - Auth & Profile */}
            <div className={styles.rightSection}>
              {user ? (
                <>
                  {/* Credits Display */}
                  <div className={styles.creditsDisplay}>
                    <svg className={styles.creditsIcon} viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z"/>
                    </svg>
                    <span>{formatCredits(user.credits)} credits</span>
                  </div>

                  {/* Profile Dropdown */}
                  <div className={styles.profileDropdown}>
                    <button
                      onClick={toggleProfile}
                      className={styles.profileButton}
                      aria-expanded={isProfileOpen}
                      aria-haspopup="true"
                    >
                      <div className={styles.avatar}>
                        {user.username?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <span className={styles.username}>{user.username}</span>
                      <svg
                        className={`${styles.chevron} ${isProfileOpen ? styles.chevronRotated : ''}`}
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>

                    {/* Profile Dropdown Menu */}
                    {isProfileOpen && (
                      <>
                        {/* Backdrop */}
                        <div 
                          className={styles.backdrop}
                          onClick={() => setIsProfileOpen(false)}
                        />
                        
                        {/* Dropdown Content */}
                        <div className={styles.dropdownMenu}>
                          <div className={styles.dropdownHeader}>
                            <div className={styles.userInfo}>
                              <p className={styles.userName}>{user.username}</p>
                              <p className={styles.userEmail}>{user.email}</p>
                              <div className={styles.userCredits}>
                                <svg viewBox="0 0 20 20" fill="currentColor">
                                  <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd"/>
                                </svg>
                                <span>{formatCredits(user.credits)} credits</span>
                              </div>
                            </div>
                          </div>

                          <div className={styles.dropdownItems}>
                            <Link
                              to="/profile"
                              className={styles.dropdownItem}
                              onClick={() => setIsProfileOpen(false)}
                            >
                              <svg viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/>
                              </svg>
                              <span>Profile Settings</span>
                            </Link>

                            <Link
                              to="/my-bookings"
                              className={styles.dropdownItem}
                              onClick={() => setIsProfileOpen(false)}
                            >
                              <svg viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
                              </svg>
                              <span>My Bookings</span>
                            </Link>

                            <Link
                              to="/my-slots"
                              className={styles.dropdownItem}
                              onClick={() => setIsProfileOpen(false)}
                            >
                              <svg viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
                              </svg>
                              <span>My Slots</span>
                            </Link>

                            <div className={styles.dropdownDivider} />

                            <button
                              onClick={handleLogout}
                              className={styles.dropdownItemDanger}
                            >
                              <svg viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd"/>
                              </svg>
                              <span>Sign Out</span>
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </>
              ) : (
                /* Auth Buttons for non-logged in users */
                <div className={styles.authButtons}>
                  <Link
                    to="/login"
                    className={styles.loginButton}
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/signup"
                    className={styles.signupButton}
                  >
                    Sign Up
                  </Link>
                </div>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={toggleMenu}
                className={styles.mobileMenuButton}
                aria-expanded={isMenuOpen}
                aria-label="Toggle navigation menu"
              >
                <div className={`${styles.hamburger} ${isMenuOpen ? styles.hamburgerOpen : ''}`}>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className={styles.mobileMenu}>
            <div className={styles.mobileMenuContent}>
              <nav className={styles.mobileNav}>
                <NavLink to="/">Home</NavLink>
                <NavLink to="/explore">Explore</NavLink>
                
                {user && (
                  <>
                    <NavLink to="/dashboard">Dashboard</NavLink>
                    <NavLink to="/my-bookings">My Bookings</NavLink>
                    <NavLink to="/my-slots">My Slots</NavLink>
                    <NavLink to="/profile">Profile</NavLink>
                    
                    {/* Credits Display - Mobile */}
                    <div className={styles.mobileCredits}>
                      <svg viewBox="0 0 20 20" fill="currentColor">
                        <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd"/>
                      </svg>
                      <span>{formatCredits(user.credits)} credits</span>
                    </div>
                    
                    <button
                      onClick={handleLogout}
                      className={styles.mobileLogout}
                    >
                      Sign Out
                    </button>
                  </>
                )}
                
                {!user && (
                  <div className={styles.mobileAuthButtons}>
                    <Link
                      to="/login"
                      className={styles.mobileLoginButton}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/signup"
                      className={styles.mobileSignupButton}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Sign Up
                    </Link>
                  </div>
                )}
              </nav>
            </div>
          </div>
        )}
      </header>
    </>
  );
};

export default Header;