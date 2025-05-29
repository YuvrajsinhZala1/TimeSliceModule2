import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import { logInfo, logError } from '../../utils/logger';
import { validatePasswordStrength } from '../../utils/helpers';
import { VALIDATION_RULES } from '../../utils/constants';
import Loading from '../Common/Loading';
import ErrorMessage from '../Common/ErrorMessage';

const Signup = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    bio: '',
    skills: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(null);
  const [skillInput, setSkillInput] = useState('');

  const { signup, error, clearError } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    logInfo('Signup component mounted');
    return () => clearError();
  }, [clearError]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Check password strength
    if (name === 'password') {
      setPasswordStrength(validatePasswordStrength(value));
    }
    
    // Clear error when user starts typing
    if (error) clearError();
  };

  const handleSkillAdd = (e) => {
    e.preventDefault();
    const skill = skillInput.trim();
    
    if (skill && !formData.skills.includes(skill) && formData.skills.length < 10) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, skill]
      }));
      setSkillInput('');
    }
  };

  const handleSkillRemove = (skillToRemove) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };

  const validateForm = () => {
    const errors = [];

    // Username validation
    if (!formData.username.trim()) {
      errors.push('Username is required');
    } else if (formData.username.length < VALIDATION_RULES.USERNAME.MIN_LENGTH) {
      errors.push(`Username must be at least ${VALIDATION_RULES.USERNAME.MIN_LENGTH} characters`);
    } else if (!VALIDATION_RULES.USERNAME.PATTERN.test(formData.username)) {
      errors.push('Username can only contain letters, numbers, and underscores');
    }

    // Email validation
    if (!formData.email.trim()) {
      errors.push('Email is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.push('Please enter a valid email address');
    }

    // Password validation
    if (!formData.password) {
      errors.push('Password is required');
    } else if (!passwordStrength?.isValid) {
      errors.push('Password does not meet requirements');
    }

    // Confirm password
    if (formData.password !== formData.confirmPassword) {
      errors.push('Passwords do not match');
    }

    // Bio validation
    if (formData.bio.length > VALIDATION_RULES.BIO.MAX_LENGTH) {
      errors.push(`Bio cannot exceed ${VALIDATION_RULES.BIO.MAX_LENGTH} characters`);
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      toast.error(validationErrors[0]);
      return;
    }

    setIsLoading(true);
    logInfo('Signup form submitted', { 
      username: formData.username,
      email: formData.email,
      skillsCount: formData.skills.length
    });

    try {
      const signupData = {
        username: formData.username.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        bio: formData.bio.trim(),
        skills: formData.skills
      };

      const result = await signup(signupData);
      
      if (result.success) {
        logInfo('Signup successful');
        toast.success('Account created successfully!');
        navigate('/dashboard');
      } else {
        logError('Signup failed:', result.message);
        toast.error(result.message || 'Signup failed');
      }
    } catch (error) {
      logError('Signup error:', error);
      toast.error('An error occurred during signup');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link
              to="/login"
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              sign in to existing account
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Enter username"
                value={formData.username}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Enter email"
                value={formData.email}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPasswords ? 'text' : 'password'}
                  required
                  className="mt-1 appearance-none relative block w-full px-3 py-2 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Enter password"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center top-1"
                  onClick={() => setShowPasswords(!showPasswords)}
                  disabled={isLoading}
                >
                  <span className="text-gray-400 hover:text-gray-500">
                    {showPasswords ? '🙈' : '👁️'}
                  </span>
                </button>
              </div>
              
              {/* Password Strength Indicator */}
              {passwordStrength && formData.password && (
                <div className="mt-2">
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 h-2 bg-gray-200 rounded">
                      <div
                        className={`h-full rounded transition-all duration-300 ${
                          passwordStrength.score >= 3 ? 'bg-green-500' :
                          passwordStrength.score >= 2 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${(passwordStrength.score / 4) * 100}%` }}
                      />
                    </div>
                    <span className={`text-xs ${
                      passwordStrength.isValid ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {passwordStrength.isValid ? 'Strong' : 'Weak'}
                    </span>
                  </div>
                  {passwordStrength.feedback.length > 0 && (
                    <ul className="mt-1 text-xs text-red-600">
                      {passwordStrength.feedback.map((feedback, index) => (
                        <li key={index}>• {feedback}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showPasswords ? 'text' : 'password'}
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Confirm password"
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={isLoading}
              />
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <p className="mt-1 text-xs text-red-600">Passwords do not match</p>
              )}
            </div>

            {/* Bio */}
            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
                Bio (Optional)
              </label>
              <textarea
                id="bio"
                name="bio"
                rows={3}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Tell us about yourself..."
                value={formData.bio}
                onChange={handleChange}
                disabled={isLoading}
                maxLength={VALIDATION_RULES.BIO.MAX_LENGTH}
              />
              <p className="mt-1 text-xs text-gray-500">
                {formData.bio.length}/{VALIDATION_RULES.BIO.MAX_LENGTH} characters
              </p>
            </div>

            {/* Skills */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Skills (Optional)
              </label>
              <div className="mt-1 flex">
                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSkillAdd(e)}
                  placeholder="Add a skill"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  disabled={isLoading || formData.skills.length >= 10}
                />
                <button
                  type="button"
                  onClick={handleSkillAdd}
                  disabled={isLoading || !skillInput.trim() || formData.skills.length >= 10}
                  className="px-4 py-2 border border-l-0 border-gray-300 bg-gray-50 text-gray-700 rounded-r-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add
                </button>
              </div>
              
              {/* Skills Display */}
              {formData.skills.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {formData.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-800 rounded-full"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => handleSkillRemove(skill)}
                        className="ml-1 text-indigo-600 hover:text-indigo-800"
                        disabled={isLoading}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <p className="mt-1 text-xs text-gray-500">
                {formData.skills.length}/10 skills added
              </p>
            </div>
          </div>

          {error && <ErrorMessage message={error} />}

          <div>
            <button
              type="submit"
              disabled={isLoading || !passwordStrength?.isValid}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loading size="small" color="white" />
              ) : (
                'Create Account'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Signup;