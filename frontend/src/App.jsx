import React, { useEffect, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { useAuth } from './context/AuthContext';
import { logInfo, logError, logComponent, logRoute } from './utils/logger';

// Layout Components
import Header from './components/Layout/Header/Header';
import Footer from './components/Layout/Footer/Footer';

// Auth Components - Lazy loaded for better performance
const Login = React.lazy(() => import('./components/Auth/login/Login'));
const Signup = React.lazy(() => import('./components/Auth/Signup/Signup'));
const ProtectedRoute = React.lazy(() => import('./components/Auth/ProtectedRoute/ProtectedRoute'));

// Page Components - Lazy loaded
const Home = React.lazy(() => import('./pages/Home/Home'));
const Dashboard = React.lazy(() => import('./pages/Dashboard/Dashboard'));
const Explore = React.lazy(() => import('./pages/Explore/Explore'));
const MyBookings = React.lazy(() => import('./pages/MyBookings/MyBookings'));
const MySlots = React.lazy(() => import('./pages/MySlots/MySlots'));
const Profile = React.lazy(() => import('./pages/Profile/Profile'));

// Common Components
import { FullPageLoading } from './components/Common/Loading/Loading';
import ErrorMessage from './components/Common/ErrorMessage/ErrorMessage';

// Development Components
import ConnectionTest from './components/Debug/ConnectionTest';

// Styles
import styles from './App.module.css';

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    logError('App Error Boundary caught an error:', {
      error: error.message,
      stack: error.stack,
      errorInfo: errorInfo.componentStack
    });
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className={styles.errorBoundary}>
          <div className={styles.errorContainer}>
            <h1>Something went wrong</h1>
            <p>The application encountered an unexpected error. Please refresh the page or try again later.</p>
            <button
              onClick={() => window.location.reload()}
              className={styles.reloadButton}
            >
              Refresh Page
            </button>
            {process.env.NODE_ENV === 'development' && (
              <details className={styles.errorDetails}>
                <summary>Error Details (Development)</summary>
                <pre className={styles.errorStack}>
                  {this.state.error && this.state.error.toString()}
                  <br />
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Route Logger Component
function RouteLogger() {
  const location = useLocation();
  const previousLocation = React.useRef();

  useEffect(() => {
    if (previousLocation.current && previousLocation.current !== location.pathname) {
      logRoute(previousLocation.current, location.pathname);
    }
    previousLocation.current = location.pathname;
  }, [location]);

  return null;
}

// Main App Component
function App() {
  const { user, loading, checkAuthStatus } = useAuth();

  useEffect(() => {
    logComponent('App', 'mounted');
    
    // Initialize application
    const initializeApp = async () => {
      try {
        await checkAuthStatus();
        logInfo('Application initialized successfully');
      } catch (error) {
        logError('Failed to initialize application:', error);
      }
    };

    initializeApp();

    // Log system information for debugging
    logInfo('Application started', {
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    });

    // Performance monitoring
    if (window.performance) {
      const loadTime = window.performance.timing.loadEventEnd - window.performance.timing.navigationStart;
      logInfo('Page load performance', { loadTime: `${loadTime}ms` });
    }

    return () => {
      logComponent('App', 'unmounted');
    };
  }, [checkAuthStatus]);

  // Show loading screen while checking authentication
  if (loading) {
    return (
      <div className={styles.app}>
        <FullPageLoading text="Starting TimeSlice..." />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className={styles.app}>
        {/* Route Logger for debugging */}
        <RouteLogger />

        {/* Skip to main content link for accessibility */}
        <a href="#main-content" className={styles.skipLink}>
          Skip to main content
        </a>

        {/* Header */}
        <Header />

        {/* Main Content Area */}
        <main id="main-content" className={styles.main}>
          <Suspense fallback={<FullPageLoading text="Loading page..." />}>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/explore" element={<Explore />} />
              
              {/* Auth Routes - Redirect to dashboard if already logged in */}
              <Route 
                path="/login" 
                element={user ? <Navigate to="/dashboard" replace /> : <Login />} 
              />
              <Route 
                path="/signup" 
                element={user ? <Navigate to="/dashboard" replace /> : <Signup />} 
              />
              
              {/* Protected Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-bookings"
                element={
                  <ProtectedRoute>
                    <MyBookings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-slots"
                element={
                  <ProtectedRoute>
                    <MySlots />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              
              {/* Wallet Route */}
              <Route
                path="/wallet"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<FullPageLoading text="Loading wallet..." />}>
                      {React.createElement(React.lazy(() => import('./components/Wallet/Wallet')))}
                    </Suspense>
                  </ProtectedRoute>
                }
              />

              {/* User Profile Route */}
              <Route
                path="/user/:userId"
                element={
                  <Suspense fallback={<FullPageLoading text="Loading user profile..." />}>
                    {React.createElement(React.lazy(() => import('./components/Profile/UserProfile')))}
                  </Suspense>
                }
              />

              {/* Error Routes */}
              <Route 
                path="/unauthorized" 
                element={
                  <div className={styles.errorPage}>
                    <ErrorMessage 
                      title="Access Denied"
                      message="You don't have permission to access this page."
                      variant="warning"
                      showRetry={false}
                    />
                  </div>
                } 
              />
              
              <Route 
                path="/not-found" 
                element={
                  <div className={styles.errorPage}>
                    <ErrorMessage 
                      title="Page Not Found"
                      message="The page you're looking for doesn't exist."
                      variant="info"
                      showRetry={false}
                    />
                  </div>
                } 
              />
              
              {/* Catch All Route - 404 */}
              <Route path="*" element={<Navigate to="/not-found" replace />} />
            </Routes>
          </Suspense>
        </main>
        
        {/* Footer */}
        <Footer />

        {/* Toast Notifications */}
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
          toastClassName={styles.toast}
          bodyClassName={styles.toastBody}
          progressClassName={styles.toastProgress}
        />

        {/* Development Tools */}
        {process.env.NODE_ENV === 'development' && <ConnectionTest />}
      </div>
    </ErrorBoundary>
  );
}

export default App;