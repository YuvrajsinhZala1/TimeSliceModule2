import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import { logInfo, logError, logInteraction } from '../../utils/logger';
import Loading from '../Common/Loading';
import ErrorMessage from '../Common/ErrorMessage';

const Login = () => {
  const [formData, setFormData] = useState({
    identifier: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login, error, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  useEffect(() => {
    logInfo('Login component mounted');
    return () => clearError();
  }, [clearError]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (error) clearError();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.identifier.trim() || !formData.password) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    logInfo('Login form submitted', { identifier: formData.identifier });

    try {
      const result = await login(formData);
      
      if (result.success) {
        logInfo('Login successful, redirecting to:', from);
        toast.success('Login successful!');
        navigate(from, { replace: true });
      } else {
        logError('Login failed:', result.message);
        toast.error(result.message || 'Login failed');
      }
    } catch (error) {
      logError('Login error:', error);
      toast.error('An error occurred during login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    logInteraction({ tagName: 'BUTTON' }, 'guest_login_clicked');
    
    const guestCredentials = {
      identifier: 'demo@timeslice.com',
      password: 'demo123'
    };

    setFormData(guestCredentials);
    
    // Auto-submit with demo credentials
    setIsLoading(true);
    try {
      const result = await login(guestCredentials);
      if (result.success) {
        toast.success('Logged in as demo user!');
        navigate(from, { replace: true });
      }
    } catch (error) {
      logError('Guest login error:', error);
      toast.error('Guest login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to TimeSlice
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link
              to="/signup"
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              create a new account
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="identifier" className="sr-only">
                Username or Email
              </label>
              <input
                id="identifier"
                name="identifier"
                type="text"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Username or Email"
                value={formData.identifier}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>
            <div className="relative">
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                disabled={isLoading}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                <span className="text-gray-400 hover:text-gray-500">
                  {showPassword ? '🙈' : '👁️'}
                </span>
              </button>
            </div>
          </div>

          {error && <ErrorMessage message={error} />}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loading size="small" color="white" />
              ) : (
                'Sign In'
              )}
            </button>
          </div>

          <div className="flex items-center justify-center">
            <button
              type="button"
              onClick={handleGuestLogin}
              disabled={isLoading}
              className="text-sm text-indigo-600 hover:text-indigo-500 font-medium"
            >
              Try Demo Account
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;