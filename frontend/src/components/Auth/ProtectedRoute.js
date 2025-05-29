import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { logInfo, logWarn } from '../../utils/logger';
import Loading from '../Common/Loading';

const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="large" />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    logWarn('Unauthenticated user tried to access protected route:', location.pathname);
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role-based access (if implemented in the future)
  if (requiredRole && user.role !== requiredRole) {
    logWarn('User lacks required role for route:', {
      route: location.pathname,
      userRole: user.role,
      requiredRole
    });
    return <Navigate to="/dashboard" replace />;
  }

  logInfo('Protected route access granted:', {
    user: user.username,
    route: location.pathname
  });

  return children;
};

export default ProtectedRoute;