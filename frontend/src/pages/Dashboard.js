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
import StatsCard from '../components/Dashboard/StatsCard';
import GlassmorphicCard from '../components/Common/GlassmorphicCard';
import { useAnimation } from '../hooks/useAnimation';

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
  const { isVisible, elementRef } = useAnimation();

  useEffect(() => {
    logInfo('Enhanced Dashboard component mounted');
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

      logInfo('Enhanced Dashboard data loaded successfully');
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <Loading size="large" text="Loading your personalized dashboard..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-blue-50">
        <ErrorMessage message={error} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl animate-float" />
        <div className="absolute top-40 right-20 w-96 h-96 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-float-delayed" />
        <div className="absolute bottom-20 left-1/3 w-64 h-64 bg-gradient-to-r from-green-400/20 to-teal-400/20 rounded-full blur-3xl animate-float" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div ref={elementRef} className={`mb-8 transition-all duration-1000 ${isVisible ? 'animate-slide-up opacity-100' : 'opacity-0 translate-y-10'}`}>
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
              Welcome back, {user.username}! 
              <span className="inline-block animate-bounce ml-2">👋</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Your personalized learning dashboard is ready with insights and opportunities
            </p>
          </div>
        </div>

        {/* Enhanced Stats Cards */}
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 transition-all duration-1000 delay-200 ${isVisible ? 'animate-slide-up opacity-100' : 'opacity-0 translate-y-10'}`}>
          <StatsCard
            title="Available Credits"
            value={user.credits}
            icon="💰"
            color="green"
            trend={12}
            subtitle="Ready to spend"
            onClick={() => window.location.href = '/profile?tab=wallet'}
          />
          
          <StatsCard
            title="Total Bookings"
            value={stats.bookings?.asStudent?.total || 0}
            icon="📅"
            color="blue"
            trend={8}
            subtitle="Sessions booked"
            onClick={() => window.location.href = '/my-bookings'}
          />
          
          <StatsCard
            title="Active Slots"
            value={stats.slots?.active || 0}
            icon="⏰"
            color="purple"
            trend={-3}
            subtitle="Available now"
            onClick={() => window.location.href = '/my-slots'}
          />
          
          <StatsCard
            title="Mentor Sessions"
            value={stats.bookings?.asMentor?.completed || 0}
            icon="🎓"
            color="orange"
            trend={25}
            subtitle="Teaching completed"
            onClick={() => window.location.href = '/my-bookings?role=mentor'}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upcoming Sessions with Enhanced Design */}
          <GlassmorphicCard className={`transition-all duration-1000 delay-400 ${isVisible ? 'animate-slide-up opacity-100' : 'opacity-0 translate-y-10'}`}>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                  <span className="text-white text-lg">📅</span>
                </div>
                <h2 className="text-xl font-bold text-gray-900">Upcoming Sessions</h2>
                <div className="ml-auto">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {upcomingSessions.length} scheduled
                  </span>
                </div>
              </div>
              
              <div className="space-y-4">
                {upcomingSessions.length > 0 ? (
                  upcomingSessions.slice(0, 3).map((booking, index) => (
                    <div 
                      key={booking._id} 
                      className="group p-4 rounded-xl bg-gradient-to-r from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100 transition-all duration-300 hover:scale-102 border border-blue-100"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center text-white font-bold group-hover:scale-110 transition-transform duration-300">
                            {booking.slotId.title.charAt(0)}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-lg font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                            {booking.slotId.title}
                          </p>
                          <p className="text-sm text-gray-600 flex items-center gap-2">
                            <span>🕒</span>
                            {formatDate(booking.slotId.dateTime, 'MMM dd, yyyy - h:mm a')}
                          </p>
                        </div>
                        <div className="flex-shrink-0">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[booking.status]}`}>
                            {booking.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">📅</span>
                    </div>
                    <p className="text-gray-500 mb-4">No upcoming sessions</p>
                    <Link
                      to="/explore"
                      className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-medium hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-blue-500/25"
                    >
                      <span>🔍</span>
                      <span className="ml-2">Explore Available Slots</span>
                    </Link>
                  </div>
                )}
                
                {upcomingSessions.length > 0 && (
                  <div className="text-center pt-4 border-t border-blue-100">
                    <Link
                      to="/my-bookings"
                      className="text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors duration-300 hover:underline"
                    >
                      View all sessions →
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </GlassmorphicCard>

          {/* Recent Activity with Enhanced Design */}
          <GlassmorphicCard className={`transition-all duration-1000 delay-500 ${isVisible ? 'animate-slide-up opacity-100' : 'opacity-0 translate-y-10'}`}>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <span className="text-white text-lg">📊</span>
                </div>
                <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
                <div className="ml-auto">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    {recentBookings.length} activities
                  </span>
                </div>
              </div>
              
              <div className="space-y-4">
                {recentBookings.length > 0 ? (
                  recentBookings.slice(0, 3).map((booking, index) => (
                    <div key={booking._id} className="group flex items-center space-x-4 p-3 rounded-xl hover:bg-purple-50 transition-all duration-300">
                      <div className="flex-shrink-0">
                        <div className="w-3 h-3 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full group-hover:scale-125 transition-transform duration-300"></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 group-hover:text-purple-600 transition-colors">
                          {booking.status === 'completed' ? 'Completed' : 'Booked'} session:{' '}
                          <span className="font-semibold">{booking.slotId.title}</span>
                        </p>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <span>🕒</span>
                          {formatDate(booking.createdAt)}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[booking.status]}`}>
                          {booking.status}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">📊</span>
                    </div>
                    <p className="text-gray-500 mb-4">No recent activity</p>
                    <Link
                      to="/explore"
                      className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:from-purple-600 hover:to-pink-600 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-purple-500/25"
                    >
                      <span>🚀</span>
                      <span className="ml-2">Start Exploring</span>
                    </Link>
                  </div>
                )}
                
                {recentBookings.length > 0 && (
                  <div className="text-center pt-4 border-t border-purple-100">
                    <Link
                      to="/my-bookings"
                      className="text-purple-600 hover:text-purple-800 font-medium text-sm transition-colors duration-300 hover:underline"
                    >
                      View all activity →
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </GlassmorphicCard>
        </div>

        {/* Enhanced Quick Actions */}
        <GlassmorphicCard className={`mt-8 transition-all duration-1000 delay-600 ${isVisible ? 'animate-slide-up opacity-100' : 'opacity-0 translate-y-10'}`}>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-teal-500 rounded-xl flex items-center justify-center">
                <span className="text-white text-lg">⚡</span>
              </div>
              <h2 className="text-xl font-bold text-gray-900">Quick Actions</h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  to: "/explore",
                  icon: "🔍",
                  title: "Book a Session",
                  description: "Find experts to help you",
                  gradient: "from-blue-500 to-cyan-500",
                  hoverGradient: "from-blue-600 to-cyan-600"
                },
                {
                  to: "/my-slots",
                  icon: "➕",
                  title: "Create Slot",
                  description: "Share your expertise",
                  gradient: "from-green-500 to-teal-500",
                  hoverGradient: "from-green-600 to-teal-600"
                },
                {
                  to: "/my-bookings",
                  icon: "📅",
                  title: "My Bookings",
                  description: "Manage your sessions",
                  gradient: "from-purple-500 to-pink-500",
                  hoverGradient: "from-purple-600 to-pink-600"
                },
                {
                  to: "/profile",
                  icon: "👤",
                  title: "Profile",
                  description: "Update your info",
                  gradient: "from-orange-500 to-red-500",
                  hoverGradient: "from-orange-600 to-red-600"
                }
              ].map((action, index) => (
                <Link
                  key={index}
                  to={action.to}
                  className="group relative p-6 rounded-2xl bg-white border border-gray-100 hover:border-transparent transition-all duration-300 hover:scale-105 hover:shadow-xl overflow-hidden"
                >
                  <div className={`absolute inset-0 bg-gradient-to-r ${action.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                  <div className={`absolute inset-0 bg-gradient-to-r ${action.hoverGradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
                  
                  <div className="relative z-10">
                    <div className={`w-12 h-12 bg-gradient-to-r ${action.gradient} rounded-xl flex items-center justify-center text-white text-xl mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      {action.icon}
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 transition-all duration-300">
                      {action.title}
                    </h3>
                    <p className="text-gray-600 text-sm group-hover:text-gray-700 transition-colors">
                      {action.description}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </GlassmorphicCard>
      </div>
    </div>
  );
};

export default Dashboard;