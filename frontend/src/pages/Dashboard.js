import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { bookingService } from '../services/bookingService';
import { slotService } from '../services/slotService';
import { walletService } from '../services/walletService';
import { logInfo, logError } from '../utils/logger';
import { formatDate, formatCredits } from '../utils/helpers';
import { STATUS_COLORS } from '../utils/constants';
import Loading from '../components/Common/Loading';
import ErrorMessage from '../components/Common/ErrorMessage';

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    bookings: null,
    slots: null,
    wallet: null
  });
  const [recentBookings, setRecentBookings] = useState([]);
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    logInfo('Dashboard component mounted');
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [bookingStatsRes, walletRes, bookingsRes, slotsRes] = await Promise.all([
        bookingService.getBookingStats(),
        walletService.getWallet({ limit: 5 }),
        bookingService.getBookings({ limit: 5 }),
        slotService.getMySlots({ limit: 5 })
      ]);

      setStats({
        bookings: bookingStatsRes.data,
        wallet: walletRes.data.summary,
        slots: {
          total: slotsRes.data.pagination.total,
          active: slotsRes.data.slots.filter(slot => slot.isActive && !slot.isBooked).length
        }
      });

      setRecentBookings(bookingsRes.data.bookings);
      
      // Filter upcoming sessions (confirmed bookings)
      const upcoming = bookingsRes.data.bookings
        .filter(booking => booking.status === 'confirmed' && new Date(booking.slotId.dateTime) > new Date())
        .sort((a, b) => new Date(a.slotId.dateTime) - new Date(b.slotId.dateTime));
      
      setUpcomingSessions(upcoming);

      logInfo('Dashboard data loaded successfully');
    } catch (error) {
      logError('Error loading dashboard data:', error);
      setError('Failed to load dashboard data');
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="large" text="Loading dashboard..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <ErrorMessage message={error} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user.username}! 👋
          </h1>
          <p className="text-gray-600">Here's what's happening with your TimeSlice account</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Credits */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm">💰</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Available Credits
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {formatCredits(user.credits)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <Link to="/profile" className="font-medium text-indigo-600 hover:text-indigo-500">
                  View wallet
                </Link>
              </div>
            </div>
          </div>

          {/* Total Bookings */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm">📅</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Bookings
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.bookings?.asStudent?.total || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <Link to="/my-bookings" className="font-medium text-indigo-600 hover:text-indigo-500">
                  View all bookings
                </Link>
              </div>
            </div>
          </div>

          {/* Active Slots */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm">⏰</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Active Slots
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.slots?.active || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <Link to="/my-slots" className="font-medium text-indigo-600 hover:text-indigo-500">
                  Manage slots
                </Link>
              </div>
            </div>
          </div>

          {/* Sessions as Mentor */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-orange-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm">🎓</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Sessions as Mentor
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.bookings?.asMentor?.completed || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <Link to="/my-bookings?role=mentor" className="font-medium text-indigo-600 hover:text-indigo-500">
                  View mentor sessions
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upcoming Sessions */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Upcoming Sessions</h2>
            </div>
            <div className="p-6">
              {upcomingSessions.length > 0 ? (
                <div className="space-y-4">
                  {upcomingSessions.slice(0, 3).map((booking) => (
                    <div key={booking._id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                          <span className="text-indigo-600 text-sm font-medium">
                            {booking.slotId.title.charAt(0)}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {booking.slotId.title}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatDate(booking.slotId.dateTime, 'MMM dd, yyyy - h:mm a')}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[booking.status]}`}>
                          {booking.status}
                        </span>
                      </div>
                    </div>
                  ))}
                  <div className="text-center">
                    <Link
                      to="/my-bookings"
                      className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                    >
                      View all sessions →
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <div className="text-gray-400 text-4xl mb-4">📅</div>
                  <p className="text-gray-500 mb-4">No upcoming sessions</p>
                  <Link
                    to="/explore"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-600 bg-indigo-100 hover:bg-indigo-200"
                  >
                    Explore available slots
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Recent Activity</h2>
            </div>
            <div className="p-6">
              {recentBookings.length > 0 ? (
                <div className="space-y-4">
                  {recentBookings.slice(0, 3).map((booking) => (
                    <div key={booking._id} className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-2 h-2 bg-indigo-400 rounded-full"></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900">
                          {booking.status === 'completed' ? 'Completed' : 'Booked'} session: {' '}
                          <span className="font-medium">{booking.slotId.title}</span>
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatDate(booking.createdAt)}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[booking.status]}`}>
                          {booking.status}
                        </span>
                      </div>
                    </div>
                  ))}
                  <div className="text-center pt-4">
                    <Link
                      to="/my-bookings"
                      className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                    >
                      View all activity →
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <div className="text-gray-400 text-4xl mb-4">📊</div>
                  <p className="text-gray-500 mb-4">No recent activity</p>
                  <Link
                    to="/explore"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-600 bg-indigo-100 hover:bg-indigo-200"
                  >
                    Start exploring
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Quick Actions</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link
                to="/explore"
                className="flex items-center p-4 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors duration-200"
              >
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-indigo-600 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm">🔍</span>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-indigo-900">Book a Session</p>
                  <p className="text-sm text-indigo-700">Find experts to help you</p>
                </div>
              </Link>

              <Link
                to="/my-slots"
                className="flex items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors duration-200"
              >
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-600 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm">➕</span>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-900">Create Slot</p>
                  <p className="text-sm text-green-700">Share your expertise</p>
                </div>
              </Link>

              <Link
                to="/my-bookings"
                className="flex items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors duration-200"
              >
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm">📅</span>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-blue-900">My Bookings</p>
                  <p className="text-sm text-blue-700">Manage your sessions</p>
                </div>
              </Link>

              <Link
                to="/profile"
                className="flex items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors duration-200"
              >
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-600 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm">👤</span>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-purple-900">Profile</p>
                  <p className="text-sm text-purple-700">Update your info</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;