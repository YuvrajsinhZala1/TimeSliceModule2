import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { logInfo, logComponent, logWarn } from '../../../utils/logger';
import { FullPageLoading } from '../../Common/Loading/Loading';
import styles from './ProtectedRoute.module.css';

const ProtectedRoute = ({ 
  children, 
  requiredRole = null, 
  fallbackPath = '/login',
  allowUnauthenticated = false,
  showLoader = true 
}) => {
  const { user, loading, checkAuthStatus } = useAuth();
  const location = useLocation();

  useEffect(() => {
    logComponent('ProtectedRoute', 'mounted', { 
      path: location.pathname,
      requiredRole,
      hasUser: !!user 
    });
  }, [location.pathname, requiredRole, user]);

  useEffect(() => {
    // Check auth status when component mounts or when there's no user but we have a token
    const token = localStorage.getItem('token');
    if (!user && token && !loading) {
      logInfo('ProtectedRoute: Checking auth status with existing token');
      checkAuthStatus();
    }
  }, [user, loading, checkAuthStatus]);

  // Show loading spinner while checking authentication
  if (loading) {
    if (showLoader) {
      return (
        <div className={styles.loadingContainer}>
          <FullPageLoading text="Verifying authentication..." />
        </div>
      );
    }
    return null;
  }

  // If user is not authenticated
  if (!user) {
    if (allowUnauthenticated) {
      logInfo('ProtectedRoute: Allowing unauthenticated access', { path: location.pathname });
      return children;
    }

    logWarn('ProtectedRoute: Unauthorized access attempt', { 
      path: location.pathname,
      redirectTo: fallbackPath 
    });

    // Redirect to login with the current location
    return (
      <Navigate 
        to={fallbackPath} 
        state={{ from: location }} 
        replace 
      />
    );
  }

  // Check role-based access if required
  if (requiredRole && user.role !== requiredRole) {
    logWarn('ProtectedRoute: Insufficient role permissions', { 
      userRole: user.role,
      requiredRole,
      path: location.pathname 
    });

    // Redirect to unauthorized page or dashboard
    return (
      <Navigate 
        to="/unauthorized" 
        state={{ from: location, requiredRole }} 
        replace 
      />
    );
  }

  // Log successful access
  logInfo('ProtectedRoute: Access granted', { 
    userId: user._id,
    username: user.username,
    path: location.pathname 
  });

  // Render the protected content
  return (
    <div className={styles.protectedContent}>
      {children}
    </div>
  );
};

// Higher-order component for role-based protection
export const withRoleProtection = (Component, requiredRole) => {
  return (props) => (
    <ProtectedRoute requiredRole={requiredRole}>
      <Component {...props} />
    </ProtectedRoute>
  );
};

// Specific route protection components
export const AdminRoute = ({ children }) => (
  <ProtectedRoute requiredRole="admin">
    {children}
  </ProtectedRoute>
);

export const ModeratorRoute = ({ children }) => (
  <ProtectedRoute requiredRole="moderator">
    {children}
  </ProtectedRoute>
);

export const MentorRoute = ({ children }) => (
  <ProtectedRoute requiredRole="mentor">
    {children}
  </ProtectedRoute>
);

// Semi-protected route - shows content but encourages authentication
export const SemiProtectedRoute = ({ children, authPrompt = true }) => {
  const { user } = useAuth();
  const location = useLocation();

  useEffect(() => {
    logComponent('SemiProtectedRoute', 'mounted', { 
      path: location.pathname,
      hasUser: !!user,
      authPrompt 
    });
  }, [location.pathname, user, authPrompt]);

  if (!user && authPrompt) {
    return (
      <div className={styles.semiProtectedContainer}>
        <div className={styles.authPrompt}>
          <div className={styles.promptContent}>
            <h3 className={styles.promptTitle}>Sign in for the best experience</h3>
            <p className={styles.promptMessage}>
              Get personalized recommendations and access to all features.
            </p>
            <div className={styles.promptActions}>
              <a href="/login" className={styles.promptButton}>
                Sign In
              </a>
              <a href="/signup" className={styles.promptButtonSecondary}>
                Sign Up
              </a>
            </div>
          </div>
          <button 
            className={styles.dismissPrompt}
            onClick={() => {
              logInfo('Auth prompt dismissed');
              // Hide the prompt (you could use state management here)
            }}
            aria-label="Dismiss prompt"
          >
            ×
          </button>
        </div>
        <div className={styles.contentWithPrompt}>
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.protectedContent}>
      {children}
    </div>
  );
};

// Route that redirects authenticated users away (e.g., login/signup pages)
export const PublicOnlyRoute = ({ children, redirectTo = '/dashboard' }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  useEffect(() => {
    logComponent('PublicOnlyRoute', 'mounted', { 
      path: location.pathname,
      hasUser: !!user 
    });
  }, [location.pathname, user]);

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <FullPageLoading text="Loading..." />
      </div>
    );
  }

  // Redirect authenticated users
  if (user) {
    logInfo('PublicOnlyRoute: Redirecting authenticated user', { 
      from: location.pathname,
      to: redirectTo 
    });
    
    return <Navigate to={redirectTo} replace />;
  }

  // Show public content
  return (
    <div className={styles.publicContent}>
      {children}
    </div>
  );
};

// Route that requires email verification
export const EmailVerifiedRoute = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();

  useEffect(() => {
    logComponent('EmailVerifiedRoute', 'mounted', { 
      path: location.pathname,
      hasUser: !!user,
      emailVerified: user?.emailVerified 
    });
  }, [location.pathname, user]);

  return (
    <ProtectedRoute>
      {user?.emailVerified ? (
        children
      ) : (
        <Navigate 
          to="/verify-email" 
          state={{ from: location }} 
          replace 
        />
      )}
    </ProtectedRoute>
  );
};

// Route that requires profile completion
export const ProfileCompleteRoute = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();

  useEffect(() => {
    logComponent('ProfileCompleteRoute', 'mounted', { 
      path: location.pathname,
      hasUser: !!user,
      profileComplete: user?.profileComplete 
    });
  }, [location.pathname, user]);

  const isProfileComplete = user?.username && user?.email;

  return (
    <ProtectedRoute>
      {isProfileComplete ? (
        children
      ) : (
        <Navigate 
          to="/complete-profile" 
          state={{ from: location }} 
          replace 
        />
      )}
    </ProtectedRoute>
  );
};

// Subscription-based route protection
export const SubscriptionRoute = ({ 
  children, 
  requiredPlan = 'premium',
  fallbackPath = '/upgrade' 
}) => {
  const { user } = useAuth();
  const location = useLocation();

  useEffect(() => {
    logComponent('SubscriptionRoute', 'mounted', { 
      path: location.pathname,
      hasUser: !!user,
      userPlan: user?.subscription?.plan,
      requiredPlan 
    });
  }, [location.pathname, user, requiredPlan]);

  const hasRequiredSubscription = user?.subscription?.plan === requiredPlan || 
                                 user?.subscription?.plan === 'enterprise';

  return (
    <ProtectedRoute>
      {hasRequiredSubscription ? (
        children
      ) : (
        <Navigate 
          to={fallbackPath} 
          state={{ from: location, requiredPlan }} 
          replace 
        />
      )}
    </ProtectedRoute>
  );
};

export default ProtectedRoute;