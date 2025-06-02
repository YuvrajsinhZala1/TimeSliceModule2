import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { logInfo, logComponent, logError, logInteraction } from '../../../utils/logger';
import { isValidEmail } from '../../../utils/helpers';
import Button from '../../Common/Button/Button';
import Loading from '../../Common/Loading/Loading';
import ErrorMessage from '../../Common/ErrorMessage/ErrorMessage';
import styles from './Login.module.css';

const Login = () => {
  const { login, loading, error, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [formData, setFormData] = useState({
    identifier: '', // Can be email or username
    password: ''
  });
  
  const [validationErrors, setValidationErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Get redirect path from location state
  const from = location.state?.from?.pathname || '/dashboard';

  useEffect(() => {
    logComponent('Login', 'mounted');
    clearError();
  }, [clearError]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    // Clear auth error
    if (error) {
      clearError();
    }
  };

  const validateForm = () => {
    const errors = {};

    // Validate identifier (email or username)
    if (!formData.identifier.trim()) {
      errors.identifier = 'Email or username is required';
    } else if (formData.identifier.includes('@') && !isValidEmail(formData.identifier)) {
      errors.identifier = 'Please enter a valid email address';
    }

    // Validate password
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    logInteraction(e.target, 'login_form_submitted', { 
      identifier: formData.identifier.includes('@') ? 'email' : 'username' 
    });

    // Validate form
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      logInfo('Login form validation failed', { errors });
      return;
    }

    try {
      setSubmitting(true);
      setValidationErrors({});

      const result = await login({
        identifier: formData.identifier.trim(),
        password: formData.password
      });

      if (result.success) {
        logInfo('Login successful, redirecting to:', from);
        navigate(from, { replace: true });
      }
    } catch (error) {
      logError('Login submission error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
    logInteraction(document.createElement('button'), 'password_visibility_toggled', { visible: !showPassword });
  };

  const handleForgotPassword = () => {
    logInteraction(document.createElement('link'), 'forgot_password_clicked');
    // TODO: Implement forgot password functionality
    alert('Forgot password functionality will be implemented soon!');
  };

  const isFormValid = formData.identifier.trim() && formData.password.length >= 6;

  return (
    <div className={styles.loginPage}>
      <div className={styles.container}>
        <div className={styles.loginCard}>
          {/* Header */}
          <div className={styles.header}>
            <Link to="/" className={styles.logo}>
              <div className={styles.logoIcon}>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
              <span className={styles.logoText}>TimeSlice</span>
            </Link>
            
            <div className={styles.headerContent}>
              <h1 className={styles.title}>Welcome Back</h1>
              <p className={styles.subtitle}>
                Sign in to your account to continue your learning journey
              </p>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <ErrorMessage
              message={error}
              variant="error"
              showDismiss
              onDismiss={clearError}
            />
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className={styles.form} noValidate>
            {/* Identifier Field */}
            <div className={styles.fieldGroup}>
              <label htmlFor="identifier" className={styles.label}>
                Email or Username
              </label>
              <div className={styles.inputContainer}>
                <input
                  type="text"
                  id="identifier"
                  name="identifier"
                  value={formData.identifier}
                  onChange={handleChange}
                  className={`${styles.input} ${validationErrors.identifier ? styles.inputError : ''}`}
                  placeholder="Enter your email or username"
                  disabled={submitting}
                  autoComplete="username"
                  autoFocus
                />
                <div className={styles.inputIcon}>
                  <svg viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/>
                  </svg>
                </div>
              </div>
              {validationErrors.identifier && (
                <span className={styles.errorText}>{validationErrors.identifier}</span>
              )}
            </div>

            {/* Password Field */}
            <div className={styles.fieldGroup}>
              <label htmlFor="password" className={styles.label}>
                Password
              </label>
              <div className={styles.inputContainer}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`${styles.input} ${validationErrors.password ? styles.inputError : ''}`}
                  placeholder="Enter your password"
                  disabled={submitting}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className={styles.passwordToggle}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd"/>
                      <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z"/>
                    </svg>
                  ) : (
                    <svg viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
                    </svg>
                  )}
                </button>
              </div>
              {validationErrors.password && (
                <span className={styles.errorText}>{validationErrors.password}</span>
              )}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className={styles.formOptions}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  className={styles.checkbox}
                  disabled={submitting}
                />
                <span className={styles.checkboxText}>Remember me</span>
              </label>
              
              <button
                type="button"
                onClick={handleForgotPassword}
                className={styles.forgotLink}
                disabled={submitting}
              >
                Forgot password?
              </button>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="large"
              fullWidth
              loading={submitting}
              disabled={!isFormValid || submitting}
              className={styles.submitButton}
            >
              {submitting ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>

          {/* Divider */}
          <div className={styles.divider}>
            <span className={styles.dividerText}>or</span>
          </div>

          {/* Social Login Buttons */}
          <div className={styles.socialLogin}>
            <Button
              variant="outline"
              size="large"
              fullWidth
              disabled={submitting}
              onClick={() => logInteraction(document.createElement('button'), 'google_login_clicked')}
              icon={
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              }
            >
              Continue with Google
            </Button>
          </div>

          {/* Sign Up Link */}
          <div className={styles.signupPrompt}>
            <span className={styles.promptText}>Don't have an account? </span>
            <Link
              to="/signup"
              className={styles.signupLink}
              onClick={() => logInteraction(document.createElement('link'), 'signup_link_clicked')}
            >
              Sign up for free
            </Link>
          </div>
        </div>

        {/* Demo Credentials */}
        {process.env.NODE_ENV === 'development' && (
          <div className={styles.demoCredentials}>
            <h3>Demo Credentials</h3>
            <p><strong>Email:</strong> demo@timeslice.app</p>
            <p><strong>Password:</strong> demo123</p>
            <Button
              variant="ghost"
              size="small"
              onClick={() => {
                setFormData({
                  identifier: 'demo@timeslice.app',
                  password: 'demo123'
                });
                logInteraction(document.createElement('button'), 'demo_credentials_filled');
              }}
            >
              Fill Demo Credentials
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;