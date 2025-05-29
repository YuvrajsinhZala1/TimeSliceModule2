import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { slotService } from '../services/slotService';
import { logInfo, logError, logInteraction } from '../utils/logger';
import { formatDate, formatCredits } from '../utils/helpers';
import { SLOT_CATEGORIES, MEETING_PLATFORMS, VALIDATION_RULES } from '../utils/constants';
import Loading from '../components/Common/Loading';
import ErrorMessage from '../components/Common/ErrorMessage';

const MySlots = () => {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dateTime: '',
    duration: 30,
    category: '',
    cost: 1,
    skills: [],
    meetingPlatform: 'Google Meet',
    meetingLink: '',
    maxParticipants: 1,
    tags: [],
    prerequisites: '',
    outcomes: ''
  });
  
  const [skillInput, setSkillInput] = useState('');
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    logInfo('MySlots page loaded');
    fetchSlots();
  }, [statusFilter]);

  const fetchSlots = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = statusFilter ? { status: statusFilter } : {};
      const response = await slotService.getMySlots(params);
      
      setSlots(response.data.slots);
      logInfo('Slots loaded successfully', { count: response.data.slots.length });
    } catch (error) {
      logError('Error loading slots:', error);
      setError('Failed to load slots');
      toast.error('Failed to load slots');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      dateTime: '',
      duration: 30,
      category: '',
      cost: 1,
      skills: [],
      meetingPlatform: 'Google Meet',
      meetingLink: '',
      maxParticipants: 1,
      tags: [],
      prerequisites: '',
      outcomes: ''
    });
    setSkillInput('');
    setTagInput('');
    setEditingSlot(null);
  };

  const handleCreateSlot = () => {
    resetForm();
    setShowCreateModal(true);
    logInteraction({ tagName: 'BUTTON' }, 'create_slot_clicked');
  };

  const handleEditSlot = (slot) => {
    setFormData({
      title: slot.title,
      description: slot.description,
      dateTime: new Date(slot.dateTime).toISOString().slice(0, 16),
      duration: slot.duration,
      category: slot.category,
      cost: slot.cost,
      skills: slot.skills || [],
      meetingPlatform: slot.meetingPlatform || 'Google Meet',
      meetingLink: slot.meetingLink || '',
      maxParticipants: slot.maxParticipants || 1,
      tags: slot.tags || [],
      prerequisites: slot.prerequisites || '',
      outcomes: slot.outcomes || ''
    });
    setEditingSlot(slot);
    setShowCreateModal(true);
    logInteraction({ tagName: 'BUTTON' }, 'edit_slot_clicked', { slotId: slot._id });
  };

  const handleDeleteSlot = async (slotId) => {
    if (!window.confirm('Are you sure you want to delete this slot?')) {
      return;
    }

    try {
      setActionLoading(slotId);
      
      const response = await slotService.deleteSlot(slotId);
      
      if (response.success) {
        toast.success('Slot deleted successfully');
        fetchSlots();
        logInfo('Slot deleted successfully', { slotId });
      }
    } catch (error) {
      logError('Error deleting slot:', error);
      toast.error(error.message || 'Failed to delete slot');
    } finally {
      setActionLoading(null);
    }
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
      setActionLoading('submit');
      
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
        setShowCreateModal(false);
        resetForm();
        fetchSlots();
      }
    } catch (error) {
      logError('Error saving slot:', error);
      toast.error(error.message || 'Failed to save slot');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="large" text="Loading your slots..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Time Slots</h1>
            <p className="text-gray-600 mt-2">
              Manage your available time slots for sharing expertise
            </p>
          </div>
          <button
            onClick={handleCreateSlot}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium"
          >
            Create New Slot
          </button>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">All Slots</option>
            <option value="active">Active</option>
            <option value="booked">Booked</option>
            <option value="available">Available</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {/* Slots List */}
        {error ? (
          <ErrorMessage message={error} />
        ) : slots.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">⏰</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No slots found
            </h3>
            <p className="text-gray-500 mb-4">
              Create your first time slot to start sharing your expertise
            </p>
            <button
              onClick={handleCreateSlot}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-md font-medium"
            >
              Create Your First Slot
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {slots.map((slot) => (
              <div key={slot._id} className="bg-white rounded-lg shadow-sm">
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {slot.title}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          slot.isBooked ? 'bg-red-100 text-red-800' :
                          slot.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {slot.isBooked ? 'Booked' : slot.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-gray-700 text-sm mb-4 line-clamp-3">
                    {slot.description}
                  </p>

                  {/* Meta Info */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="mr-2">📅</span>
                      {formatDate(slot.dateTime, 'MMM dd, yyyy - h:mm a')}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="mr-2">⏱️</span>
                      {slot.duration} minutes
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="mr-2">🏷️</span>
                      {slot.category}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="mr-2">💰</span>
                      {formatCredits(slot.cost)} credits
                    </div>
                  </div>

                  {/* Skills */}
                  {slot.skills && slot.skills.length > 0 && (
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-1">
                        {slot.skills.slice(0, 3).map((skill, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-800 rounded-full"
                          >
                            {skill}
                          </span>
                        ))}
                        {slot.skills.length > 3 && (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                            +{slot.skills.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex justify-between pt-4 border-t border-gray-200">
                    <button
                      onClick={() => handleEditSlot(slot)}
                      disabled={slot.isBooked}
                      className="text-indigo-600 hover:text-indigo-800 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteSlot(slot._id)}
                      disabled={slot.isBooked || actionLoading === slot._id}
                      className="text-red-600 hover:text-red-800 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {actionLoading === slot._id ? (
                        <Loading size="small" color="red" />
                      ) : 'Delete'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create/Edit Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowCreateModal(false)} />
              
              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
                <form onSubmit={handleSubmit}>
                  <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                      {editingSlot ? 'Edit Slot' : 'Create New Slot'}
                    </h3>
                    
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {/* Title */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Title *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.title}
                          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="e.g., React.js Code Review Session"
                          maxLength={VALIDATION_RULES.SLOT_TITLE.MAX_LENGTH}
                        />
                      </div>

                      {/* Description */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description *
                        </label>
                        <textarea
                          required
                          rows={3}
                          value={formData.description}
                          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="Describe what you'll help with in this session..."
                          maxLength={VALIDATION_RULES.SLOT_DESCRIPTION.MAX_LENGTH}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Date Time */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Date & Time *
                          </label>
                          <input
                            type="datetime-local"
                            required
                            value={formData.dateTime}
                            onChange={(e) => setFormData(prev => ({ ...prev, dateTime: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            min={new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16)}
                          />
                        </div>

                        {/* Duration */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Duration *
                          </label>
                          <select
                            required
                            value={formData.duration}
                            onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                          >
                            <option value={30}>30 minutes</option>
                            <option value={60}>60 minutes</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Category */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Category *
                          </label>
                          <select
                            required
                            value={formData.category}
                            onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
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
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Cost (Credits) *
                          </label>
                          <input
                            type="number"
                            required
                            min={1}
                            max={20}
                            value={formData.cost}
                            onChange={(e) => setFormData(prev => ({ ...prev, cost: parseInt(e.target.value) }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>
                      </div>

                      {/* Skills */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
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
                            className="px-4 py-2 border border-l-0 border-gray-300 bg-gray-50 text-gray-700 rounded-r-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Add
                          </button>
                        </div>
                        {formData.skills.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {formData.skills.map((skill, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-800 rounded-full"
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
                      </div>

                      {/* Meeting Platform & Link */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Meeting Platform
                          </label>
                          <select
                            value={formData.meetingPlatform}
                            onChange={(e) => setFormData(prev => ({ ...prev, meetingPlatform: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                          >
                            {MEETING_PLATFORMS.map(platform => (
                              <option key={platform} value={platform}>{platform}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Meeting Link (Optional)
                          </label>
                          <input
                            type="url"
                            value={formData.meetingLink}
                            onChange={(e) => setFormData(prev => ({ ...prev, meetingLink: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="https://..."
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                    <button
                      type="submit"
                      disabled={actionLoading === 'submit'}
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                    >
                      {actionLoading === 'submit' ? (
                        <Loading size="small" color="white" />
                      ) : editingSlot ? 'Update Slot' : 'Create Slot'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MySlots;