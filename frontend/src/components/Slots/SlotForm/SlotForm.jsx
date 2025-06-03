import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { logInfo, logError, logDebug } from '../../../utils/logger';
import { VALIDATION_RULES, CREDIT_LIMITS } from '../../../utils/constants';
import Button from '../../Common/Button/Button';
import Loading from '../../Common/Loading/Loading';
import ErrorMessage from '../../Common/ErrorMessage/ErrorMessage';
import styles from './SlotForm.module.css';

const SlotForm = ({ 
  initialData = null, 
  onSubmit, 
  onCancel, 
  loading = false, 
  categories = [], 
  durations = [], 
  platforms = [],
  isEditing = false 
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    duration: 60,
    cost: 5,
    dateTime: '',
    platform: '',
    tags: []
  });
  
  const [tagInput, setTagInput] = useState('');
  const [errors, setErrors] = useState({});
  const [isDirty, setIsDirty] = useState(false);

  // Initialize form with existing data if editing
  useEffect(() => {
    if (initialData) {
      const dateTimeValue = initialData.dateTime 
        ? new Date(initialData.dateTime).toISOString().slice(0, 16)
        : '';
      
      setFormData({
        title: initialData.title || '',
        description: initialData.description || '',
        category: initialData.category || '',
        duration: initialData.duration || 60,
        cost: initialData.cost || 5,
        dateTime: dateTimeValue,
        platform: initialData.platform || '',
        tags: initialData.tags || []
      });
      
      logDebug('SlotForm initialized with data:', initialData);
    }
  }, [initialData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setIsDirty(true);
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (tag && !formData.tags.includes(tag) && formData.tags.length < VALIDATION_RULES.TAGS.MAX_COUNT) {
      if (tag.length <= VALIDATION_RULES.TAGS.MAX_LENGTH) {
        setFormData(prev => ({
          ...prev,
          tags: [...prev.tags, tag]
        }));
        setTagInput('');
        setIsDirty(true);
      } else {
        toast.error(`Tag must be ${VALIDATION_RULES.TAGS.MAX_LENGTH} characters or less`);
      }
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
    setIsDirty(true);
  };

  const validateForm = () => {
    const newErrors = {};

    // Title validation
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length < VALIDATION_RULES.SLOT_TITLE.MIN_LENGTH) {
      newErrors.title = `Title must be at least ${VALIDATION_RULES.SLOT_TITLE.MIN_LENGTH} characters`;
    } else if (formData.title.length > VALIDATION_RULES.SLOT_TITLE.MAX_LENGTH) {
      newErrors.title = `Title must be no more than ${VALIDATION_RULES.SLOT_TITLE.MAX_LENGTH} characters`;
    }

    // Description validation
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length < VALIDATION_RULES.SLOT_DESCRIPTION.MIN_LENGTH) {
      newErrors.description = `Description must be at least ${VALIDATION_RULES.SLOT_DESCRIPTION.MIN_LENGTH} characters`;
    } else if (formData.description.length > VALIDATION_RULES.SLOT_DESCRIPTION.MAX_LENGTH) {
      newErrors.description = `Description must be no more than ${VALIDATION_RULES.SLOT_DESCRIPTION.MAX_LENGTH} characters`;
    }

    // Category validation
    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    // Duration validation
    if (!formData.duration || formData.duration < 15) {
      newErrors.duration = 'Duration must be at least 15 minutes';
    } else if (formData.duration > 180) {
      newErrors.duration = 'Duration cannot exceed 180 minutes';
    }

    // Cost validation
    if (!formData.cost || formData.cost < CREDIT_LIMITS.MIN_SLOT_COST) {
      newErrors.cost = `Cost must be at least ${CREDIT_LIMITS.MIN_SLOT_COST} credit${CREDIT_LIMITS.MIN_SLOT_COST !== 1 ? 's' : ''}`;
    } else if (formData.cost > CREDIT_LIMITS.MAX_SLOT_COST) {
      newErrors.cost = `Cost cannot exceed ${CREDIT_LIMITS.MAX_SLOT_COST} credits`;
    }

    // DateTime validation
    if (!formData.dateTime) {
      newErrors.dateTime = 'Date and time are required';
    } else {
      const selectedDate = new Date(formData.dateTime);
      const now = new Date();
      const minFutureTime = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
      
      if (selectedDate <= minFutureTime) {
        newErrors.dateTime = 'Session must be scheduled at least 1 hour in the future';
      }
    }

    // Platform validation
    if (!formData.platform.trim()) {
      newErrors.platform = 'Platform is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors below');
      return;
    }

    try {
      logInfo('Submitting slot form', { 
        isEditing, 
        slotId: initialData?._id,
        title: formData.title 
      });

      const submitData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        duration: parseInt(formData.duration),
        cost: parseInt(formData.cost),
        dateTime: new Date(formData.dateTime).toISOString(),
        platform: formData.platform.trim(),
        tags: formData.tags
      };

      await onSubmit(submitData);
      
      logInfo('Slot form submitted successfully');
      
      // Reset form if creating new slot
      if (!isEditing) {
        setFormData({
          title: '',
          description: '',
          category: '',
          duration: 60,
          cost: 5,
          dateTime: '',
          platform: '',
          tags: []
        });
        setIsDirty(false);
      }
    } catch (error) {
      logError('Error submitting slot form:', error);
      toast.error(error.message || 'Failed to save slot');
    }
  };

  const getMinDateTime = () => {
    const now = new Date();
    now.setHours(now.getHours() + 1); // Minimum 1 hour from now
    return now.toISOString().slice(0, 16);
  };

  return (
    <div className={styles.slotForm}>
      <div className={styles.formHeader}>
        <h3 className={styles.formTitle}>
          {isEditing ? 'Edit Time Slot' : 'Create New Time Slot'}
        </h3>
        <p className={styles.formSubtitle}>
          {isEditing 
            ? 'Update your slot details below'
            : 'Share your expertise by creating a focused learning session'
          }
        </p>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        {/* Title */}
        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="title">
            Session Title *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            className={`${styles.input} ${errors.title ? styles.inputError : ''}`}
            placeholder="e.g., React Hooks Deep Dive"
            maxLength={VALIDATION_RULES.SLOT_TITLE.MAX_LENGTH}
            required
          />
          {errors.title && (
            <span className={styles.errorText}>{errors.title}</span>
          )}
          <span className={styles.characterCount}>
            {formData.title.length}/{VALIDATION_RULES.SLOT_TITLE.MAX_LENGTH}
          </span>
        </div>

        {/* Description */}
        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="description">
            Description *
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            className={`${styles.textarea} ${errors.description ? styles.inputError : ''}`}
            placeholder="Describe what you'll cover in this session, what participants will learn, and any prerequisites..."
            rows={4}
            maxLength={VALIDATION_RULES.SLOT_DESCRIPTION.MAX_LENGTH}
            required
          />
          {errors.description && (
            <span className={styles.errorText}>{errors.description}</span>
          )}
          <span className={styles.characterCount}>
            {formData.description.length}/{VALIDATION_RULES.SLOT_DESCRIPTION.MAX_LENGTH}
          </span>
        </div>

        {/* Category and Duration Row */}
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="category">
              Category *
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className={`${styles.select} ${errors.category ? styles.inputError : ''}`}
              required
            >
              <option value="">Select a category</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            {errors.category && (
              <span className={styles.errorText}>{errors.category}</span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="duration">
              Duration (minutes) *
            </label>
            <select
              id="duration"
              name="duration"
              value={formData.duration}
              onChange={handleInputChange}
              className={`${styles.select} ${errors.duration ? styles.inputError : ''}`}
              required
            >
              {durations.map(duration => (
                <option key={duration.value} value={duration.value}>
                  {duration.label}
                </option>
              ))}
            </select>
            {errors.duration && (
              <span className={styles.errorText}>{errors.duration}</span>
            )}
          </div>
        </div>

        {/* Cost and DateTime Row */}
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="cost">
              Cost (credits) *
            </label>
            <input
              type="number"
              id="cost"
              name="cost"
              value={formData.cost}
              onChange={handleInputChange}
              className={`${styles.input} ${errors.cost ? styles.inputError : ''}`}
              min={CREDIT_LIMITS.MIN_SLOT_COST}
              max={CREDIT_LIMITS.MAX_SLOT_COST}
              required
            />
            {errors.cost && (
              <span className={styles.errorText}>{errors.cost}</span>
            )}
            <span className={styles.helperText}>
              {CREDIT_LIMITS.MIN_SLOT_COST}-{CREDIT_LIMITS.MAX_SLOT_COST} credits
            </span>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="dateTime">
              Date & Time *
            </label>
            <input
              type="datetime-local"
              id="dateTime"
              name="dateTime"
              value={formData.dateTime}
              onChange={handleInputChange}
              className={`${styles.input} ${errors.dateTime ? styles.inputError : ''}`}
              min={getMinDateTime()}
              required
            />
            {errors.dateTime && (
              <span className={styles.errorText}>{errors.dateTime}</span>
            )}
          </div>
        </div>

        {/* Platform */}
        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="platform">
            Meeting Platform *
          </label>
          <select
            id="platform"
            name="platform"
            value={formData.platform}
            onChange={handleInputChange}
            className={`${styles.select} ${errors.platform ? styles.inputError : ''}`}
            required
          >
            <option value="">Select platform</option>
            {platforms.map(platform => (
              <option key={platform} value={platform}>
                {platform}
              </option>
            ))}
          </select>
          {errors.platform && (
            <span className={styles.errorText}>{errors.platform}</span>
          )}
        </div>

        {/* Tags */}
        <div className={styles.formGroup}>
          <label className={styles.label}>
            Tags (Optional)
          </label>
          <div className={styles.tagsInput}>
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
              className={styles.input}
              placeholder="Add tags to help people find your session"
              maxLength={VALIDATION_RULES.TAGS.MAX_LENGTH}
              disabled={formData.tags.length >= VALIDATION_RULES.TAGS.MAX_COUNT}
            />
            <Button
              type="button"
              variant="outline"
              size="small"
              onClick={handleAddTag}
              disabled={!tagInput.trim() || formData.tags.length >= VALIDATION_RULES.TAGS.MAX_COUNT}
            >
              Add
            </Button>
          </div>
          
          {formData.tags.length > 0 && (
            <div className={styles.tagsList}>
              {formData.tags.map((tag, index) => (
                <span key={index} className={styles.tag}>
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className={styles.tagRemove}
                    aria-label={`Remove ${tag} tag`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
          
          <span className={styles.helperText}>
            {formData.tags.length}/{VALIDATION_RULES.TAGS.MAX_COUNT} tags
          </span>
        </div>

        {/* Guidelines */}
        <div className={styles.guidelines}>
          <h4 className={styles.guidelinesTitle}>💡 Tips for a successful session:</h4>
          <ul className={styles.guidelinesList}>
            <li>Be specific about what you'll teach</li>
            <li>Set clear expectations and prerequisites</li>
            <li>Choose a realistic duration for your topic</li>
            <li>Price fairly based on complexity and your expertise</li>
            <li>Test your meeting platform beforehand</li>
          </ul>
        </div>

        {/* Form Actions */}
        <div className={styles.formActions}>
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            variant="primary"
            loading={loading}
            disabled={loading}
            icon={
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
              </svg>
            }
          >
            {loading ? (
              <Loading size="small" color="white" />
            ) : (
              isEditing ? 'Update Slot' : 'Create Slot'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default SlotForm;