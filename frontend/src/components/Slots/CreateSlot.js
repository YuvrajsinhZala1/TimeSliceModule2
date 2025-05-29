import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { slotService } from '../../services/slotService';
import { SLOT_CATEGORIES, MEETING_PLATFORMS, VALIDATION_RULES } from '../../utils/constants';
import { logInfo, logError } from '../../utils/logger';
import Loading from '../Common/Loading';
import ErrorMessage from '../Common/ErrorMessage';

const CreateSlot = ({ onSuccess, onCancel, editingSlot = null }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [formData, setFormData] = useState({
    title: editingSlot?.title || '',
    description: editingSlot?.description || '',
    dateTime: editingSlot ? new Date(editingSlot.dateTime).toISOString().slice(0, 16) : '',
    duration: editingSlot?.duration || 30,
    category: editingSlot?.category || '',
    cost: editingSlot?.cost || 1,
    skills: editingSlot?.skills || [],
    meetingPlatform: editingSlot?.meetingPlatform || 'Google Meet',
    meetingLink: editingSlot?.meetingLink || '',
    maxParticipants: editingSlot?.maxParticipants || 1,
    tags: editingSlot?.tags || [],
    prerequisites: editingSlot?.prerequisites || '',
    outcomes: editingSlot?.outcomes || ''
  });
  
  const [skillInput, setSkillInput] = useState('');
  const [tagInput, setTagInput] = useState('');

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 0 : value
    }));
  };

  const handleAddSkill = () => {
    const skill = skillInput.trim();
    if (skill && !formData.skills.includes(skill) && formData.skills.length < 5) {
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

  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (tag && !formData.tags.includes(tag) && formData.tags.length < 10) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const validateForm = () => {
    const errors = [];

    if (!formData.title.trim() || formData.title.length < 5) {
      errors.push('Title must be at least 5 characters');
    }

    if (!formData.description.trim() || formData.description.length < 10) {
      errors.push('Description must be at least 10 characters');
    }

    if (!formData.dateTime) {
      errors.push('Date and time are required');
    } else {
      const slotDate = new Date(formData.dateTime);
      const now = new Date();
      const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
      
      if (slotDate <= oneHourFromNow) {
        errors.push('Slot must be scheduled at least 1 hour in advance');
      }
    }

    if (!formData.category) {
      errors.push('Category is required');
    }

    if (formData.cost < 1 || formData.cost > 20) {
      errors.push('Cost must be between 1 and 20 credits');
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

      const slotData = {
        ...formData,
        title: formData.title.trim(),
        description: formData.description.trim(),
        prerequisites: formData.prerequisites.trim(),
        outcomes: formData.outcomes.trim(),
        meetingLink: formData.meetingLink.trim()
      };

      let response;
      if (editingSlot) {
        logInfo('Updating slot', { slotId: editingSlot._id });
        response = await slotService.updateSlot(editingSlot._id, slotData);
      } else {
        logInfo('Creating new slot');
        response = await slotService.createSlot(slotData);
      }

      if (response.success) {
        toast.success(`Slot ${editingSlot ? 'updated' : 'created'} successfully!`);
        if (onSuccess) onSuccess(response.data.slot);
      }
    } catch (error) {
      logError('Error saving slot:', error);
      setError(error.message || 'Failed to save slot');
      toast.error(error.message || 'Failed to save slot');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900">
          {editingSlot ? 'Edit Slot' : 'Create New Slot'}
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Share your expertise by offering a time slot
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-6">
        {error && <ErrorMessage message={error} className="mb-6" />}

        <div className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              name="title"
              required
              value={formData.title}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="e.g., React.js Code Review Session"
              maxLength={VALIDATION_RULES.SLOT_TITLE.MAX_LENGTH}
            />
            <p className="mt-1 text-xs text-gray-500">
              {formData.title.length}/{VALIDATION_RULES.SLOT_TITLE.MAX_LENGTH} characters
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              name="description"
              required
              rows={4}
              value={formData.description}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Describe what you'll help with in this session..."
              maxLength={VALIDATION_RULES.SLOT_DESCRIPTION.MAX_LENGTH}
            />
            <p className="mt-1 text-xs text-gray-500">
              {formData.description.length}/{VALIDATION_RULES.SLOT_DESCRIPTION.MAX_LENGTH} characters
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Date Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date & Time *
              </label>
              <input
                type="datetime-local"
                name="dateTime"
                required
                value={formData.dateTime}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                min={new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16)}
              />
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration *
              </label>
              <select
                name="duration"
                required
                value={formData.duration}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value={30}>30 minutes</option>
                <option value={60}>60 minutes</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                name="category"
                required
                value={formData.category}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Select Category</option>
                {SLOT_CATEGORIES.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            {/* Cost */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cost (Credits) *
              </label>
              <input
                type="number"
                name="cost"
                required
                min={1}
                max={20}
                value={formData.cost}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Skills */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Skills (Optional)
            </label>
            <div className="flex mb-2">
              <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                placeholder="Add a skill"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                disabled={formData.skills.length >= 5}
              />
              <button
                type="button"
                onClick={handleAddSkill}
                disabled={!skillInput.trim() || formData.skills.length >= 5}
                className="px-4 py-2 border border-l-0 border-gray-300 bg-gray-50 text-gray-700 rounded-r-md hover:bg-gray-100 disabled:opacity-50"
              >
                Add
              </button>
            </div>
            {formData.skills.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 text-sm font-medium bg-indigo-100 text-indigo-800 rounded-full"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      className="ml-1 text-indigo-600 hover:text-indigo-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
            <p className="mt-1 text-xs text-gray-500">
              {formData.skills.length}/5 skills added
            </p>
          </div>

          {/* Meeting Platform & Link */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Meeting Platform
              </label>
              <select
                name="meetingPlatform"
                value={formData.meetingPlatform}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                {MEETING_PLATFORMS.map(platform => (
                  <option key={platform} value={platform}>{platform}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Meeting Link (Optional)
              </label>
              <input
                type="url"
                name="meetingLink"
                value={formData.meetingLink}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="https://..."
              />
            </div>
          </div>

          {/* Prerequisites */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Prerequisites (Optional)
            </label>
            <textarea
              name="prerequisites"
              rows={2}
              value={formData.prerequisites}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="What should participants know beforehand?"
              maxLength={300}
            />
          </div>

          {/* Outcomes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Learning Outcomes (Optional)
            </label>
            <textarea
              name="outcomes"
              rows={2}
              value={formData.outcomes}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="What will participants learn or achieve?"
              maxLength={300}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 mt-6">
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
            {loading ? (
              <Loading size="small" color="white" />
            ) : editingSlot ? 'Update Slot' : 'Create Slot'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateSlot;