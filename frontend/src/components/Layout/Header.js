import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { logInfo, logInteraction } from '../../utils/logger';
import { formatCredits } from '../../utils/helpers';

const Header = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const handleLogout = () => {
    logInfo('User logging out from header');
    logInteraction({ tagName: 'BUTTON' }, 'logout_clicked');
    logout();
    toast.success('Logged out successfully');
    navigate('/');
    setIsProfileOpen(false);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    logInteraction({ tagName: 'BUTTON' }, 'mobile_menu_toggled', { isOpen: !isMenuOpen });
  };

  const toggleProfile = () => {
    setIsProfileOpen(!isProfileOpen);
    logInteraction({ tagName: 'BUTTON' }, 'profile_menu_toggled', { isOpen: !isProfileOpen });
  };

  const isActiveLink = (path) => {
    return location.pathname === path;
  };

  const NavLink = ({ to, children, className = "" }) => (
    <Link
      to={to}
      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
        isActiveLink(to)
          ? 'bg-indigo-100 text-indigo-700'
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
      } ${className}`}
      onClick={() => setIsMenuOpen(false)}
    >
      {children}
    </Link>
  );

  return (
    <>
      {/* Skip to main content link for accessibility */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link 
                to="/" 
                className="flex items-center space-x-2 text-xl font-bold text-indigo-600 hover:text-indigo-700 transition-colors duration-200"
                onClick={() => logInteraction({ tagName: 'LINK' }, 'logo_clicked')}
              >
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">
                  T
                </div>
                <span>TimeSlice</span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              <NavLink to="/">Home</NavLink>
              <NavLink to="/explore">Explore</NavLink>
              
              {user && (
                <>
                  <NavLink to="/dashboard">Dashboard</NavLink>
                  <NavLink to="/my-bookings">My Bookings</NavLink>
                  <NavLink to="/my-slots">My Slots</NavLink>
                </>
              )}
            </nav>

            {/* Right side - Auth & Profile */}
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  {/* Credits Display */}
                  <div className="hidden sm:flex items-center space-x-2 px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm font-medium">
                    <span className="text-green-500">💰</span>
                    <span>{formatCredits(user.credits)} credits</span>
                  </div>

                  {/* Profile Dropdown */}
                  <div className="relative">
                    <button
                      onClick={toggleProfile}
                      className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors duration-200"
                      aria-expanded={isProfileOpen}
                      aria-haspopup="true"
                    >
                      <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-medium text-sm">
                        {user.username?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <span className="hidden sm:block">{user.username}</span>
                      <svg
                        className={`w-4 h-4 transition-transform duration-200 ${
                          isProfileOpen ? 'rotate-180' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* Profile Dropdown Menu */}
                    {isProfileOpen && (
                      <>
                        {/* Backdrop */}
                        <div 
                          className="fixed inset-0 z-10" 
                          onClick={() => setIsProfileOpen(false)}
                        />
                        
                        {/* Dropdown Content */}
                        <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-20 animate-fade-in">
                          <div className="py-1">
                            {/* User Info */}
                            <div className="px-4 py-3 border-b border-gray-100">
                              <p className="text-sm font-medium text-gray-900">{user.username}</p>
                              <p className="text-xs text-gray-500">{user.email}</p>
                              <div className="flex items-center mt-2 text-xs text-green-600">
                                <span>💰</span>
                                <span className="ml-1">{formatCredits(user.credits)} credits</span>
                              </div>
                            </div>

                            {/* Menu Items */}
                            <Link
                              to="/profile"
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                              onClick={() => setIsProfileOpen(false)}
                            >
                              <div className="flex items-center space-x-2">
                                <span>👤</span>
                                <span>Profile Settings</span>
                              </div>
                            </Link>

                            <Link
                              to="/my-bookings"
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                              onClick={() => setIsProfileOpen(false)}
                            >
                              <div className="flex items-center space-x-2">
                                <span>📅</span>
                                <span>My Bookings</span>
                              </div>
                            </Link>

                            <Link
                              to="/my-slots"
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                              onClick={() => setIsProfileOpen(false)}
                            >
                              <div className="flex items-center space-x-2">
                                <span>⏰</span>
                                <span>My Slots</span>
                              </div>
                            </Link>

                            <hr className="border-gray-100 my-1" />

                            <button
                              onClick={handleLogout}
                              className="w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50 transition-colors duration-200"
                            >
                              <div className="flex items-center space-x-2">
                                <span>🚪</span>
                                <span>Sign Out</span>
                              </div>
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </>
              ) : (
                /* Auth Buttons for non-logged in users */
                <div className="flex items-center space-x-2">
                  <Link
                    to="/login"
                    className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors duration-200"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/signup"
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors duration-200 shadow-sm"
                  >
                    Sign Up
                  </Link>
                </div>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={toggleMenu}
                className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors duration-200"
                aria-expanded={isMenuOpen}
                aria-label="Toggle navigation menu"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {isMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white animate-slide-down">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <NavLink to="/" className="block">Home</NavLink>
              <NavLink to="/explore" className="block">Explore</NavLink>
              
              {user && (
                <>
                  <NavLink to="/dashboard" className="block">Dashboard</NavLink>
                  <NavLink to="/my-bookings" className="block">My Bookings</NavLink>
                  <NavLink to="/my-slots" className="block">My Slots</NavLink>
                  <NavLink to="/profile" className="block">Profile</NavLink>
                  
                  {/* Credits Display - Mobile */}
                  <div className="flex items-center space-x-2 px-3 py-2 text-sm text-green-700">
                    <span>💰</span>
                    <span>{formatCredits(user.credits)} credits</span>
                  </div>
                  
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 rounded-md transition-colors duration-200"
                  >
                    Sign Out
                  </button>
                </>
              )}
              
              {!user && (
                <div className="pt-4 border-t border-gray-200 space-y-2">
                  <Link
                    to="/login"
                    className="block px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors duration-200"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/signup"
                    className="block px-3 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors duration-200 text-center"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>
    </>
  );
};

export default Header;