import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { logInfo, logComponent, logError, logInteraction } from '../../../utils/logger';
import { isValidEmail, validatePasswordStrength } from '../../../utils/helpers';
import { VALIDATION_RULES } from '../../../utils/constants';
import Button from '../../Common/Button/Button';
import Loading from '../../Common/Loading/Loading';
import ErrorMessage from '../../Common/ErrorMessage/ErrorMessage';
import styles from './Signup.module.css';

const Signup = () => {
  const { signup, loading, error, clearError } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false
  });
  
  const [validationErrors, setValidationErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ isValid: false, score: 0, feedback: [] });

  useEffect(() => {
    logComponent('Signup', 'mounted');
    clearError();
  }, [clearError]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    const newValue = type === 'checkbox' ? checked : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: newValue
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

    // Check password strength in real-time
    if (name === 'password') {
      const strength = validatePasswordStrength(value);
      setPasswordStrength(strength);
    }
  };

  const validateForm = () => {
    const errors = {};

    // Validate username
    if (!formData.username.trim()) {
      errors.username = 'Username is required';
    } else if (formData.username.length < VALIDATION_RULES.USERNAME.MIN_LENGTH) {
      errors.username = `Username must be at least ${VALIDATION_RULES.USERNAME.MIN_LENGTH} characters`;
    } else if (formData.username.length > VALIDATION_RULES.USERNAME.MAX_LENGTH) {
      errors.username = `Username cannot exceed ${VALIDATION_RULES.USERNAME.MAX_LENGTH} characters`;
    } else if (!VALIDATION_RULES.USERNAME.PATTERN.test(formData.username)) {
      errors.username = 'Username can only contain letters, numbers, and underscores';
    }

    // Validate email
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!isValidEmail(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    // Validate password
    if (!formData.password) {
      errors.password = 'Password is required';
    } else {
      const passwordValidation = validatePasswordStrength(formData.password);
      if (!passwordValidation.isValid) {
        errors.password = passwordValidation.feedback[0] || 'Password is too weak';
      }
    }

    // Validate confirm password
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    // Validate terms agreement
    if (!formData.agreeToTerms) {
      errors.agreeToTerms = 'You must agree to the Terms of Service and Privacy Policy';
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    logInteraction(e.target, 'signup_form_submitted', { 
      username: formData.username,
      email: formData.email 
    });

    // Validate form
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      logInfo('Signup form validation failed', { errors });
      return;
    }

    try {
      setSubmitting(true);
      setValidationErrors({});

      const result = await signup({
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password
      });

      if (result.success) {
        logInfo('Signup successful, redirecting to dashboard');
        navigate('/dashboard', { replace: true });
      }
    } catch (error) {
      logError('Signup submission error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const togglePasswordVisibility = (field) => {
    if (field === 'password') {
      setShowPassword(!showPassword);
      logInteraction(document.createElement('button'), 'password_visibility_toggled', { field: 'password' });
    } else {
      setShowConfirmPassword(!showConfirmPassword);
      logInteraction(document.createElement('button'), 'password_visibility_toggled', { field: 'confirmPassword' });
    }
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength.score === 0) return styles.strengthWeak;
    if (passwordStrength.score <= 2) return styles.strengthWeak;
    if (passwordStrength.score === 3) return styles.strengthMedium;
    return styles.strengthStrong;
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength.score === 0) return 'Very Weak';
    if (passwordStrength.score <= 2) return 'Weak';
    if (passwordStrength.score === 3) return 'Medium';
    return 'Strong';
  };

  const isFormValid = 
    formData.username.trim() && 
    formData.email.trim() && 
    passwordStrength.isValid && 
    formData.password === formData.confirmPassword &&
    formData.agreeToTerms;

  return (
    <div className={styles.signupPage}>
      <div className={styles.container}>
        <div className={styles.signupCard}>
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
              <h1 className={styles.title}>Create Your Account</h1>
              <p className={styles.subtitle}>
                Join thousands of professionals sharing knowledge and growing together
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

          {/* Signup Form */}
          <form onSubmit={handleSubmit} className={styles.form} noValidate>
            {/* Username Field */}
            <div className={styles.fieldGroup}>
              <label htmlFor="username" className={styles.label}>
                Username
              </label>
              <div className={styles.inputContainer}>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className={`${styles.input} ${validationErrors.username ? styles.inputError : ''}`}
                  placeholder="Choose a unique username"
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
              {validationErrors.username && (
                <span className={styles.errorText}>{validationErrors.username}</span>
              )}
              <div className={styles.fieldHint}>
                3-30 characters, letters, numbers, and underscores only
              </div>
            </div>

            {/* Email Field */}
            <div className={styles.fieldGroup}>
              <label htmlFor="email" className={styles.label}>
                Email Address
              </label>
              <div className={styles.inputContainer}>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`${styles.input} ${validationErrors.email ? styles.inputError : ''}`}
                  placeholder="Enter your email address"
                  disabled={submitting}
                  autoComplete="email"
                />
                <div className={styles.inputIcon}>
                  <svg viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                  </svg>
                </div>
              </div>
              {validationErrors.email && (
                <span className={styles.errorText}>{validationErrors.email}</span>
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
                  placeholder="Create a strong password"
                  disabled={submitting}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('password')}
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
              
              {/* Password Strength Indicator */}
              {formData.password && (
                <div className={styles.passwordStrength}>
                  <div className={styles.strengthBar}>
                    <div 
                      className={`${styles.strengthFill} ${getPasswordStrengthColor()}`}
                      style={{ width: `${(passwordStrength.score / 4) * 100}%` }}
                    />
                  </div>
                  <span className={`${styles.strengthText} ${getPasswordStrengthColor()}`}>
                    {getPasswordStrengthText()}
                  </span>
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className={styles.fieldGroup}>
              <label htmlFor="confirmPassword" className={styles.label}>
                Confirm Password
              </label>
              <div className={styles.inputContainer}>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`${styles.input} ${validationErrors.confirmPassword ? styles.inputError : ''}`}
                  placeholder="Confirm your password"
                  disabled={submitting}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('confirmPassword')}
                  className={styles.passwordToggle}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? (
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
              {validationErrors.confirmPassword && (
                <span className={styles.errorText}>{validationErrors.confirmPassword}</span>
              )}
            </div>

            {/* Terms Agreement */}
            <div className={styles.fieldGroup}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  name="agreeToTerms"
                  checked={formData.agreeToTerms}
                  onChange={handleChange}
                  className={styles.checkbox}
                  disabled={submitting}
                />
                <span className={styles.checkboxText}>
                  I agree to the{' '}
                  <Link to="/terms" className={styles.link} target="_blank">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link to="/privacy" className={styles.link} target="_blank">
                    Privacy Policy
                  </Link>
                </span>
              </label>
              {validationErrors.agreeToTerms && (
                <span className={styles.errorText}>{validationErrors.agreeToTerms}</span>
              )}
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
              {submitting ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>

          {/* Divider */}
          <div className={styles.divider}>
            <span className={styles.dividerText}>or</span>
          </div>

          {/* Social Signup */}
          <div className={styles.socialSignup}>
            <Button
              variant="outline"
              size="large"
              fullWidth
              disabled={submitting}
              onClick={() => logInteraction(document.createElement('button'), 'google_signup_clicked')}
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

          {/* Login Link */}
          <div className={styles.loginPrompt}>
            <span className={styles.promptText}>Already have an account? </span>
            <Link
              to="/login"
              className={styles.loginLink}
              onClick={() => logInteraction(document.createElement('link'), 'login_link_clicked')}
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;