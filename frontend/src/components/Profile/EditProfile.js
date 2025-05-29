import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';
import { VALIDATION_RULES } from '../../utils/constants';
import Loading from '../Common/Loading';
import ErrorMessage from '../Common/ErrorMessage';

const EditProfile = ({ onCancel, onSave }) => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [formData, setFormData] = useState({
    username: '',
    bio: '',
    skills: []
  });
  
  const [skillInput, setSkillInput] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        bio: user.bio || '',
        skills: user.skills || []
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddSkill = () => {
    const skill = skillInput.trim();
    if (skill && !formData.skills.includes(skill) && formData.skills.length < 10) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, skill]
      }));
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };

  const validateForm = () => {
    const errors = [];

    if (!formData.username.trim()) {
      errors.push('Username is required');
    } else if (formData.username.length < VALIDATION_RULES.USERNAME.MIN_LENGTH) {
      errors.push(`Username must be at least ${VALIDATION_RULES.USERNAME.MIN_LENGTH} characters`);
    } else if (!VALIDATION_RULES.USERNAME.PATTERN.test(formData.username)) {
      errors.push('Username can only contain letters, numbers, and underscores');
    }

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

    try {
      setLoading(true);
      setError(null);

      const response = await authService.updateProfile({
        username: formData.username.trim(),
        bio: formData.bio.trim(),
        skills: formData.skills
      });
      
      if (response.success) {
        toast.success('Profile updated successfully!');
        updateUser(response.data.user);
        if (onSave) onSave(response.data.user);
      }
    } catch (error) {
      setError(error.message || 'Failed to update profile');
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900">Edit Profile</h2>
      </div>
      
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {error && <ErrorMessage message={error} />}

        {/* Username */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Username *
          </label>
          <input
            type="text"
            name="username"
            required
            value={formData.username}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            minLength={VALIDATION_RULES.USERNAME.MIN_LENGTH}
            maxLength={VALIDATION_RULES.USERNAME.MAX_LENGTH}
            pattern={VALIDATION_RULES.USERNAME.PATTERN.source}
          />
          <p className="mt-1 text-xs text-gray-500">
            3-30 characters, letters, numbers, and underscores only
          </p>
        </div>

        {/* Bio */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bio
          </label>
          <textarea
            name="bio"
            rows={4}
            value={formData.bio}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Tell others about yourself..."
            maxLength={VALIDATION_RULES.BIO.MAX_LENGTH}
          />
          <p className="mt-1 text-xs text-gray-500">
            {formData.bio.length}/{VALIDATION_RULES.BIO.MAX_LENGTH} characters
          </p>
        </div>

        {/* Skills */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Skills
          </label>
          
          {/* Add Skill Input */}
          <div className="flex mb-3">
            <input
              type="text"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
              placeholder="Add a skill"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              disabled={formData.skills.length >= 10}
            />
            <button
              type="button"
              onClick={handleAddSkill}
              disabled={!skillInput.trim() || formData.skills.length >= 10}
              className="px-4 py-2 border border-l-0 border-gray-300 bg-gray-50 text-gray-700 rounded-r-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add
            </button>
          </div>
          
          {/* Skills Display */}
          {formData.skills.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.skills.map((skill, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 text-sm font-medium bg-indigo-100 text-indigo-800 rounded-full"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill)}
                    className="ml-2 text-indigo-600 hover:text-indigo-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
          
          <p className="text-xs text-gray-500">
            {formData.skills.length}/10 skills added
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-medium disabled:opacity-50"
          >
            {loading ? <Loading size="small" color="white" /> : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditProfile;