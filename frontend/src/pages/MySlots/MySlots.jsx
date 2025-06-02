import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { slotService } from '../../services/slotService';
import { bookingService } from '../../services/bookingService';
import { useAuth } from '../../context/AuthContext';
import { logInfo, logComponent, logError, logInteraction } from '../../utils/logger';
import { formatDate, formatCredits, formatRelativeTime } from '../../utils/helpers';
import { SLOT_CATEGORIES, SLOT_DURATIONS, MEETING_PLATFORMS } from '../../utils/constants';
import Button from '../../components/Common/Button/Button';
import { ProductCard } from '../../components/Common/Card/Card';
import Loading, { PageLoading } from '../../components/Common/Loading/Loading';
import ErrorMessage from '../../components/Common/ErrorMessage/ErrorMessage';
import Modal, { ConfirmModal } from '../../components/Common/Modal/Modal';
import SlotForm from '../../components/Slots/SlotForm/SlotForm';
import { toast } from 'react-toastify';
import styles from './MySlots.module.css';

const MySlots = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // State management
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [deleteLoading, setDeleteLoading] = useState(null);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  // Filtering
  const [filteredSlots, setFilteredSlots] = useState([]);

  useEffect(() => {
    logComponent('MySlots', 'mounted', { userId: user?._id });
    fetchSlots();

    // Check if we should show create form from navigation state
    if (location.state?.showCreateForm) {
      setShowCreateModal(true);
    }
  }, [location.state]);

  useEffect(() => {
    filterSlots();
  }, [slots, activeTab]);

  const fetchSlots = async () => {
    try {
      setLoading(true);
      setError(null);

      logInfo('Fetching user slots');

      const response = await slotService.getMySlots({
        limit: 50,
        sort: '-createdAt'
      });

      if (response.success) {
        const userSlots = response.data.slots || [];
        setSlots(userSlots);
        
        logInfo('Slots fetched successfully', { 
          count: userSlots.length 
        });
      } else {
        throw new Error(response.message || 'Failed to fetch slots');
      }
    } catch (error) {
      logError('Error fetching slots:', error);
      setError('Failed to load your slots. Please try again.');
      toast.error('Failed to load slots');
    } finally {
      setLoading(false);
    }
  };

  const filterSlots = () => {
    let filtered = [...slots];

    switch (activeTab) {
      case 'available':
        filtered = slots.filter(slot => 
          slot.status === 'available' && 
          new Date(slot.dateTime) > new Date()
        );
        break;
      case 'booked':
        filtered = slots.filter(slot => 
          slot.status === 'booked'
        );
        break;
      case 'completed':
        filtered = slots.filter(slot => 
          slot.status === 'completed'
        );
        break;
      case 'past':
        filtered = slots.filter(slot => 
          new Date(slot.dateTime) < new Date()
        );
        break;
      default:
        // 'all' - no filtering
        break;
    }

    setFilteredSlots(filtered);
  };

  const handleCreateSlot = () => {
    setSelectedSlot(null);
    setShowCreateModal(true);
    
    logInteraction(document.createElement('button'), 'create_slot_clicked');
  };

  const handleEditSlot = (slot) => {
    setSelectedSlot(slot);
    setShowEditModal(true);
    
    logInteraction(document.createElement('button'), 'edit_slot_clicked', {
      slotId: slot._id,
      slotTitle: slot.title
    });
  };

  const handleDeleteSlot = (slot) => {
    setSelectedSlot(slot);
    setShowDeleteModal(true);
    
    logInteraction(document.createElement('button'), 'delete_slot_clicked', {
      slotId: slot._id,
      slotTitle: slot.title
    });
  };

  const handleSlotFormSubmit = async (slotData) => {
    try {
      setFormLoading(true);

      let response;
      if (selectedSlot) {
        // Edit existing slot
        response = await slotService.updateSlot(selectedSlot._id, slotData);
        
        if (response.success) {
          toast.success('Slot updated successfully!');
          setShowEditModal(false);
          
          // Update local state
          setSlots(prev => 
            prev.map(slot => 
              slot._id === selectedSlot._id 
                ? { ...slot, ...response.data.slot }
                : slot
            )
          );
          
          logInfo('Slot updated successfully', { 
            slotId: selectedSlot._id 
          });
        }
      } else {
        // Create new slot
        response = await slotService.createSlot(slotData);
        
        if (response.success) {
          toast.success('Slot created successfully!');
          setShowCreateModal(false);
          
          // Add to local state
          setSlots(prev => [response.data.slot, ...prev]);
          
          logInfo('Slot created successfully', { 
            slotId: response.data.slot._id 
          });
        }
      }

      if (!response.success) {
        throw new Error(response.message || 'Failed to save slot');
      }

      setSelectedSlot(null);
    } catch (error) {
      logError('Error saving slot:', error);
      toast.error(error.message || 'Failed to save slot');
    } finally {
      setFormLoading(false);
    }
  };

  const confirmDeleteSlot = async () => {
    if (!selectedSlot) return;

    try {
      setDeleteLoading(selectedSlot._id);
      
      const response = await slotService.deleteSlot(selectedSlot._id);

      if (response.success) {
        toast.success('Slot deleted successfully');
        setShowDeleteModal(false);
        
        // Remove from local state
        setSlots(prev => prev.filter(slot => slot._id !== selectedSlot._id));
        
        logInfo('Slot deleted successfully', { 
          slotId: selectedSlot._id 
        });
      } else {
        throw new Error(response.message || 'Failed to delete slot');
      }
    } catch (error) {
      logError('Error deleting slot:', error);
      toast.error(error.message || 'Failed to delete slot');
    } finally {
      setDeleteLoading(null);
      setSelectedSlot(null);
    }
  };

  const getSlotActions = (slot) => {
    const now = new Date();
    const slotTime = new Date(slot.dateTime);
    const isPast = slotTime < now;
    const canEdit = !isPast && slot.status !== 'booked';
    const canDelete = !isPast && slot.status !== 'booked';

    return (
      <div className={styles.slotActions}>
        {slot.status === 'booked' && (
          <span className={styles.bookedNote}>
            Session Booked
          </span>
        )}
        
        {canEdit && (
          <Button
            variant="outline"
            size="small"
            onClick={() => handleEditSlot(slot)}
          >
            Edit Slot
          </Button>
        )}
        
        {canDelete && (
          <Button
            variant="danger"
            size="small"
            onClick={() => handleDeleteSlot(slot)}
            loading={deleteLoading === slot._id}
          >
            Delete
          </Button>
        )}
        
        {isPast && slot.status === 'completed' && (
          <span className={styles.completedNote}>
            ✓ Completed
          </span>
        )}
        
        {isPast && slot.status !== 'completed' && slot.status !== 'booked' && (
          <span className={styles.expiredNote}>
            Expired
          </span>
        )}

        {slot.bookings && slot.bookings.length > 0 && (
          <div className={styles.bookingInfo}>
            <span className={styles.bookingCount}>
              {slot.bookings.length} booking{slot.bookings.length !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>
    );
  };

  const getStatusBadge = (slot) => {
    const now = new Date();
    const slotTime = new Date(slot.dateTime);
    
    let status = slot.status;
    let colorClass = '';

    if (slotTime < now && status !== 'completed') {
      status = 'expired';
      colorClass = styles.statusExpired;
    } else {
      switch (status) {
        case 'available':
          colorClass = styles.statusAvailable;
          break;
        case 'booked':
          colorClass = styles.statusBooked;
          break;
        case 'completed':
          colorClass = styles.statusCompleted;
          break;
        default:
          colorClass = styles.statusDefault;
      }
    }

    return (
      <span className={`${styles.statusBadge} ${colorClass}`}>
        {status}
      </span>
    );
  };

  const getTabCount = (tab) => {
    const now = new Date();
    
    switch (tab) {
      case 'available':
        return slots.filter(slot => 
          slot.status === 'available' && 
          new Date(slot.dateTime) > now
        ).length;
      case 'booked':
        return slots.filter(slot => slot.status === 'booked').length;
      case 'completed':
        return slots.filter(slot => slot.status === 'completed').length;
      case 'past':
        return slots.filter(slot => new Date(slot.dateTime) < now).length;
      default:
        return slots.length;
    }
  };

  if (loading) {
    return <PageLoading text="Loading your slots..." />;
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <ErrorMessage 
          message={error}
          showRetry
          onRetry={fetchSlots}
        />
      </div>
    );
  }

  return (
    <div className={styles.mySlotsPage}>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <h1 className={styles.title}>My Slots</h1>
            <p className={styles.subtitle}>
              Manage your time slots and track your mentoring sessions
            </p>
          </div>
          
          <Button
            variant="primary"
            onClick={handleCreateSlot}
            icon={
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"/>
              </svg>
            }
          >
            Create New Slot
          </Button>
        </div>

        {/* Stats Summary */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{getTabCount('all')}</div>
            <div className={styles.statLabel}>Total Slots</div>
          </div>
          
          <div className={styles.statCard}>
            <div className={styles.statValue}>{getTabCount('available')}</div>
            <div className={styles.statLabel}>Available</div>
          </div>
          
          <div className={styles.statCard}>
            <div className={styles.statValue}>{getTabCount('booked')}</div>
            <div className={styles.statLabel}>Booked</div>
          </div>
          
          <div className={styles.statCard}>
            <div className={styles.statValue}>{getTabCount('completed')}</div>
            <div className={styles.statLabel}>Completed</div>
          </div>
        </div>

        {/* Tabs */}
        <div className={styles.tabsContainer}>
          <div className={styles.tabs}>
            {[
              { key: 'all', label: 'All Slots' },
              { key: 'available', label: 'Available' },
              { key: 'booked', label: 'Booked' },
              { key: 'completed', label: 'Completed' },
              { key: 'past', label: 'Past' }
            ].map(tab => (
              <button
                key={tab.key}
                className={`${styles.tab} ${activeTab === tab.key ? styles.tabActive : ''}`}
                onClick={() => {
                  setActiveTab(tab.key);
                  logInteraction(document.createElement('button'), 'slot_tab_changed', { tab: tab.key });
                }}
              >
                {tab.label} ({getTabCount(tab.key)})
              </button>
            ))}
          </div>
        </div>

        {/* Slots List */}
        <div className={styles.slotsSection}>
          {filteredSlots.length > 0 ? (
            <div className={styles.slotsGrid}>
              {filteredSlots.map((slot) => (
                <ProductCard
                  key={slot._id}
                  title={slot.title}
                  description={
                    <div className={styles.slotDetails}>
                      <div className={styles.slotDescription}>
                        {slot.description}
                      </div>
                      
                      <div className={styles.slotMeta}>
                        <span className={styles.duration}>
                          <strong>Duration:</strong> {slot.duration} minutes
                        </span>
                        <span className={styles.cost}>
                          <strong>Cost:</strong> {formatCredits(slot.cost)} credits
                        </span>
                        <span className={styles.platform}>
                          <strong>Platform:</strong> {slot.platform}
                        </span>
                      </div>
                      
                      <div className={styles.slotTiming}>
                        <span className={styles.sessionDate}>
                          <strong>Scheduled:</strong> {formatDate(slot.dateTime, 'MMM dd, yyyy - h:mm a')}
                        </span>
                        <span className={styles.createdAt}>
                          <strong>Created:</strong> {formatRelativeTime(slot.createdAt)}
                        </span>
                      </div>

                      {slot.tags && slot.tags.length > 0 && (
                        <div className={styles.slotTags}>
                          {slot.tags.map((tag, index) => (
                            <span key={index} className={styles.tag}>
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  }
                  badge={getStatusBadge(slot)}
                  image={
                    <div className={styles.slotImage}>
                      <div className={styles.slotIcon}>
                        {slot.category === 'Programming' && '💻'}
                        {slot.category === 'Design' && '🎨'}
                        {slot.category === 'Marketing' && '📈'}
                        {slot.category === 'Business' && '💼'}
                        {slot.category === 'Writing' && '✍️'}
                        {slot.category === 'Consulting' && '🤝'}
                        {slot.category === 'Teaching' && '📚'}
                        {slot.category === 'Mentoring' && '👨‍🏫'}
                        {slot.category === 'Career Advice' && '🎯'}
                        {slot.category === 'Code Review' && '🔍'}
                        {!slot.category && '⏰'}
                      </div>
                      <div className={styles.slotCategory}>
                        {slot.category}
                      </div>
                    </div>
                  }
                  actions={getSlotActions(slot)}
                  hover
                />
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                {activeTab === 'all' && '📅'}
                {activeTab === 'available' && '🟢'}
                {activeTab === 'booked' && '📋'}
                {activeTab === 'completed' && '✅'}
                {activeTab === 'past' && '⏰'}
              </div>
              <h3 className={styles.emptyTitle}>
                {activeTab === 'all' && 'No slots created yet'}
                {activeTab === 'available' && 'No available slots'}
                {activeTab === 'booked' && 'No booked slots'}
                {activeTab === 'completed' && 'No completed slots'}
                {activeTab === 'past' && 'No past slots'}
              </h3>
              <p className={styles.emptyDescription}>
                {activeTab === 'all' 
                  ? 'Start sharing your expertise by creating your first time slot'
                  : `You don't have any ${activeTab} slots at the moment`
                }
              </p>
              {activeTab === 'all' && (
                <Button
                  variant="primary"
                  onClick={handleCreateSlot}
                >
                  Create Your First Slot
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Create Slot Modal */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Create New Time Slot"
          size="large"
        >
          <SlotForm
            onSubmit={handleSlotFormSubmit}
            onCancel={() => setShowCreateModal(false)}
            loading={formLoading}
            categories={SLOT_CATEGORIES}
            durations={SLOT_DURATIONS}
            platforms={MEETING_PLATFORMS}
          />
        </Modal>

        {/* Edit Slot Modal */}
        <Modal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          title="Edit Time Slot"
          size="large"
        >
          {selectedSlot && (
            <SlotForm
              initialData={selectedSlot}
              onSubmit={handleSlotFormSubmit}
              onCancel={() => setShowEditModal(false)}
              loading={formLoading}
              categories={SLOT_CATEGORIES}
              durations={SLOT_DURATIONS}
              platforms={MEETING_PLATFORMS}
              isEditing
            />
          )}
        </Modal>

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={confirmDeleteSlot}
          title="Delete Time Slot"
          message={
            selectedSlot ? (
              <div className={styles.deleteConfirmation}>
                <p>Are you sure you want to delete this time slot?</p>
                <div className={styles.deleteDetails}>
                  <p><strong>Title:</strong> {selectedSlot.title}</p>
                  <p><strong>Date:</strong> {formatDate(selectedSlot.dateTime, 'MMM dd, yyyy - h:mm a')}</p>
                  <p><strong>Duration:</strong> {selectedSlot.duration} minutes</p>
                  <p><strong>Cost:</strong> {formatCredits(selectedSlot.cost)} credits</p>
                </div>
                <p className={styles.deleteWarning}>
                  ⚠️ This action cannot be undone.
                </p>
              </div>
            ) : ''
          }
          confirmText="Delete Slot"
          cancelText="Keep Slot"
          variant="danger"
          loading={deleteLoading === selectedSlot?._id}
        />
      </div>
    </div>
  );
};

export default MySlots;