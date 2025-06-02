import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { slotService } from '../../services/slotService';
import { bookingService } from '../../services/bookingService';
import { walletService } from '../../services/walletService';
import { logInfo, logComponent, logError, logPerformance } from '../../utils/logger';
import { formatCredits, formatDate, formatRelativeTime } from '../../utils/helpers';
import { StatsCard, FeatureCard } from '../../components/Common/Card/Card';
import Button from '../../components/Common/Button/Button';
import Loading, { PageLoading } from '../../components/Common/Loading/Loading';
import ErrorMessage from '../../components/Common/ErrorMessage/ErrorMessage';
import styles from './Dashboard.module.css';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // State management
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalSlots: 0,
      activeSlots: 0,
      totalBookings: 0,
      completedSessions: 0,
      totalEarnings: 0,
      availableCredits: user?.credits || 0
    },
    recentBookings: [],
    upcomingSessions: [],
    recentActivity: [],
    walletTransactions: []
  });

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    logComponent('Dashboard', 'mounted', { userId: user?._id });
    const startTime = logPerformance('dashboard_load');
    
    fetchDashboardData();
    
    return () => {
      logPerformance('dashboard_load', startTime);
    };
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      logInfo('Fetching dashboard data');
      setLoading(true);
      setError(null);

      // Fetch all dashboard data in parallel
      const [
        slotsResponse,
        bookingsResponse,
        bookingStatsResponse,
        walletResponse
      ] = await Promise.all([
        slotService.getMySlots({ limit: 5 }),
        bookingService.getBookings({ limit: 10 }),
        bookingService.getBookingStats(),
        walletService.getWallet({ limit: 5 })
      ]);

      // Process and set data
      const mySlots = slotsResponse.data.slots || [];
      const myBookings = bookingsResponse.data.bookings || [];
      const stats = bookingStatsResponse.data || {};
      const walletData = walletResponse.data || {};

      // Calculate dashboard stats
      const dashboardStats = {
        totalSlots: mySlots.length,
        activeSlots: mySlots.filter(slot => slot.status === 'available').length,
        totalBookings: myBookings.length,
        completedSessions: myBookings.filter(booking => booking.status === 'completed').length,
        totalEarnings: stats.totalEarnings || 0,
        availableCredits: user?.credits || 0
      };

      // Get upcoming sessions (confirmed bookings)
      const upcomingSessions = myBookings
        .filter(booking => 
          booking.status === 'confirmed' && 
          new Date(booking.slotId.dateTime) > new Date()
        )
        .sort((a, b) => new Date(a.slotId.dateTime) - new Date(b.slotId.dateTime))
        .slice(0, 5);

      // Get recent activity
      const recentActivity = [
        ...myBookings.slice(0, 3).map(booking => ({
          id: booking._id,
          type: 'booking',
          title: `Session booked: ${booking.slotId.title}`,
          timestamp: booking.createdAt,
          status: booking.status
        })),
        ...mySlots.slice(0, 3).map(slot => ({
          id: slot._id,
          type: 'slot',
          title: `Slot created: ${slot.title}`,
          timestamp: slot.createdAt,
          status: slot.status
        }))
      ]
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 5);

      setDashboardData({
        stats: dashboardStats,
        recentBookings: myBookings.slice(0, 5),
        upcomingSessions,
        recentActivity,
        walletTransactions: walletData.transactions || []
      });

      logInfo('Dashboard data loaded successfully');
    } catch (error) {
      logError('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
  };

  const handleCreateSlot = () => {
    navigate('/my-slots', { state: { showCreateForm: true } });
  };

  const handleExploreSlots = () => {
    navigate('/explore');
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'booking':
        return (
          <svg viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
          </svg>
        );
      case 'slot':
        return (
          <svg viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
          </svg>
        );
      default:
        return (
          <svg viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
          </svg>
        );
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return styles.statusConfirmed;
      case 'completed':
        return styles.statusCompleted;
      case 'pending':
        return styles.statusPending;
      case 'cancelled':
        return styles.statusCancelled;
      case 'available':
        return styles.statusAvailable;
      default:
        return styles.statusDefault;
    }
  };

  if (loading) {
    return <PageLoading text="Loading your dashboard..." />;
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <ErrorMessage 
          message={error}
          showRetry
          onRetry={fetchDashboardData}
        />
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <div className={styles.welcomeSection}>
              <h1 className={styles.welcomeTitle}>
                Welcome back, {user?.username}! 👋
              </h1>
              <p className={styles.welcomeSubtitle}>
                Here's what's happening with your TimeSlice account
              </p>
            </div>
            
            <div className={styles.headerActions}>
              <Button
                variant="outline"
                size="medium"
                onClick={handleRefresh}
                loading={refreshing}
                icon={
                  <svg viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd"/>
                  </svg>
                }
              >
                Refresh
              </Button>
              
              <Button
                variant="primary"
                size="medium"
                onClick={handleCreateSlot}
                icon={
                  <svg viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"/>
                  </svg>
                }
              >
                Create Slot
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className={styles.statsGrid}>
          <StatsCard
            value={formatCredits(dashboardData.stats.availableCredits)}
            label="Available Credits"
            icon="💰"
            variant="primary"
          />
          
          <StatsCard
            value={dashboardData.stats.totalSlots}
            label="Total Slots"
            icon="🎯"
            variant="info"
          />
          
          <StatsCard
            value={dashboardData.stats.completedSessions}
            label="Completed Sessions"
            icon="✅"
            variant="success"
          />
          
          <StatsCard
            value={formatCredits(dashboardData.stats.totalEarnings)}
            label="Total Earnings"
            icon="📈"
            variant="warning"
          />
        </div>

        {/* Main Content Grid */}
        <div className={styles.contentGrid}>
          {/* Left Column */}
          <div className={styles.leftColumn}>
            {/* Upcoming Sessions */}
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Upcoming Sessions</h2>
                <Link to="/my-bookings" className={styles.sectionLink}>
                  View All
                </Link>
              </div>

              <div className={styles.sectionContent}>
                {dashboardData.upcomingSessions.length > 0 ? (
                  <div className={styles.sessionsList}>
                    {dashboardData.upcomingSessions.map((session) => (
                      <div key={session._id} className={styles.sessionCard}>
                        <div className={styles.sessionInfo}>
                          <h3 className={styles.sessionTitle}>
                            {session.slotId.title}
                          </h3>
                          <p className={styles.sessionDetails}>
                            {formatDate(session.slotId.dateTime, 'MMM dd, yyyy - h:mm a')}
                          </p>
                          <p className={styles.sessionParticipant}>
                            with {session.bookedBy.username}
                          </p>
                        </div>
                        <div className={styles.sessionStatus}>
                          <span className={`${styles.statusBadge} ${getStatusColor(session.status)}`}>
                            {session.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={styles.emptyState}>
                    <div className={styles.emptyStateIcon}>📅</div>
                    <p className={styles.emptyStateText}>No upcoming sessions</p>
                    <Button
                      variant="outline"
                      size="small"
                      onClick={handleExploreSlots}
                    >
                      Browse Sessions
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Activity */}
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Recent Activity</h2>
              </div>

              <div className={styles.sectionContent}>
                {dashboardData.recentActivity.length > 0 ? (
                  <div className={styles.activityList}>
                    {dashboardData.recentActivity.map((activity) => (
                      <div key={activity.id} className={styles.activityItem}>
                        <div className={styles.activityIcon}>
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className={styles.activityContent}>
                          <p className={styles.activityTitle}>{activity.title}</p>
                          <p className={styles.activityTime}>
                            {formatRelativeTime(activity.timestamp)}
                          </p>
                        </div>
                        <div className={styles.activityStatus}>
                          <span className={`${styles.statusBadge} ${getStatusColor(activity.status)}`}>
                            {activity.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={styles.emptyState}>
                    <div className={styles.emptyStateIcon}>📋</div>
                    <p className={styles.emptyStateText}>No recent activity</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className={styles.rightColumn}>
            {/* Quick Actions */}
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Quick Actions</h2>
              </div>

              <div className={styles.quickActions}>
                <FeatureCard
                  icon="🎯"
                  title="Create Time Slot"
                  description="Share your expertise by creating a new time slot"
                  action={
                    <Button
                      variant="primary"
                      size="small"
                      onClick={handleCreateSlot}
                    >
                      Create Slot
                    </Button>
                  }
                  clickable
                  onClick={handleCreateSlot}
                />

                <FeatureCard
                  icon="🔍"
                  title="Explore Sessions"
                  description="Find mentors and book sessions to learn new skills"
                  action={
                    <Button
                      variant="outline"
                      size="small"
                      onClick={handleExploreSlots}
                    >
                      Explore
                    </Button>
                  }
                  clickable
                  onClick={handleExploreSlots}
                />

                <FeatureCard
                  icon="👤"
                  title="Update Profile"
                  description="Keep your profile and skills up to date"
                  action={
                    <Button
                      variant="outline"
                      size="small"
                      onClick={() => navigate('/profile')}
                    >
                      Edit Profile
                    </Button>
                  }
                  clickable
                  onClick={() => navigate('/profile')}
                />
              </div>
            </div>

            {/* Recent Transactions */}
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Recent Transactions</h2>
                <Link to="/wallet" className={styles.sectionLink}>
                  View Wallet
                </Link>
              </div>

              <div className={styles.sectionContent}>
                {dashboardData.walletTransactions.length > 0 ? (
                  <div className={styles.transactionsList}>
                    {dashboardData.walletTransactions.map((transaction, index) => (
                      <div key={index} className={styles.transactionItem}>
                        <div className={styles.transactionInfo}>
                          <p className={styles.transactionDescription}>
                            {transaction.description}
                          </p>
                          <p className={styles.transactionTime}>
                            {formatRelativeTime(transaction.date)}
                          </p>
                        </div>
                        <div className={`${styles.transactionAmount} ${
                          transaction.amount > 0 ? styles.positive : styles.negative
                        }`}>
                          {transaction.amount > 0 ? '+' : ''}{formatCredits(Math.abs(transaction.amount))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={styles.emptyState}>
                    <div className={styles.emptyStateIcon}>💳</div>
                    <p className={styles.emptyStateText}>No recent transactions</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;