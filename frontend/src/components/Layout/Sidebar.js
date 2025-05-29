import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { formatCredits, getInitials } from '../../utils/helpers';

const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const location = useLocation();

  const isActivePath = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const sidebarLinks = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: '📊',
      description: 'Overview and stats'
    },
    {
      name: 'Explore Slots',
      path: '/explore',
      icon: '🔍',
      description: 'Find time slots'
    },
    {
      name: 'My Bookings',
      path: '/my-bookings',
      icon: '📅',
      description: 'Your bookings'
    },
    {
      name: 'My Slots',
      path: '/my-slots',
      icon: '⏰',
      description: 'Your time slots'
    },
    {
      name: 'Profile',
      path: '/profile',
      icon: '👤',
      description: 'Account settings'
    }
  ];

  if (!user) return null;

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">TS</span>
              </div>
              <span className="ml-2 text-lg font-bold text-gray-900">TimeSlice</span>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden p-1 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              <span className="sr-only">Close sidebar</span>
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* User Info */}
          <div className="p-4 border-b bg-gray-50">
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center">
                <span className="text-white font-medium">
                  {getInitials(user.username)}
                </span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">{user.username}</p>
                <p className="text-xs text-gray-500 flex items-center">
                  <span className="mr-1">💰</span>
                  {formatCredits(user.credits)} credits
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {sidebarLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                onClick={onClose}
                className={`flex items-center p-3 rounded-lg text-sm font-medium transition-colors duration-200 ${
                  isActivePath(link.path)
                    ? 'bg-indigo-100 text-indigo-700 border-r-2 border-indigo-500'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <span className="text-lg mr-3">{link.icon}</span>
                <div>
                  <div>{link.name}</div>
                  <div className="text-xs text-gray-500">{link.description}</div>
                </div>
              </Link>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t bg-gray-50">
            <div className="text-xs text-gray-500 text-center">
              <p>TimeSlice v1.0</p>
              <p className="mt-1">
                <a href="#help" className="text-indigo-600 hover:text-indigo-500">
                  Need help?
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;