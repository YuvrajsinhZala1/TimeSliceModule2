import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { slotService } from '../../services/slotService';
import { bookingService } from '../../services/bookingService';
import { useAuth } from '../../context/AuthContext';
import { logInfo, logComponent, logError, logInteraction, logPerformance } from '../../utils/logger';
import { formatDate, formatCredits, truncateText, debounce } from '../../utils/helpers';
import { SLOT_CATEGORIES, SLOT_DURATIONS } from '../../utils/constants';
import Button from '../../components/Common/Button/Button';
import { ProductCard } from '../../components/Common/Card/Card';
import Loading, { PageLoading } from '../../components/Common/Loading/Loading';
import ErrorMessage from '../../components/Common/ErrorMessage/ErrorMessage';
import Modal, { ConfirmModal } from '../../components/Common/Modal/Modal';
import { toast } from 'react-toastify';
import styles from './Explore.module.css';

const Explore = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // State management
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  // Filters state
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    minCost: searchParams.get('minCost') || '',
    maxCost: searchParams.get('maxCost') || '',
    duration: searchParams.get('duration') || '',
    sortBy: searchParams.get('sortBy') || 'newest',
    dateFrom: searchParams.get('dateFrom') || '',
    dateTo: searchParams.get('dateTo') || ''
  });

  // Booking modal state
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    logComponent('Explore', 'mounted');
    const startTime = logPerformance('explore_page_load');
    
    fetchSlots(true);
    
    return () => {
      logPerformance('explore_page_load', startTime);
    };
  }, []);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((newFilters) => {
      updateURLParams(newFilters);
      fetchSlots(true, newFilters);
    }, 500),
    []
  );

  const updateURLParams = (newFilters) => {
    const params = new URLSearchParams();
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    setSearchParams(params);
  };

  const fetchSlots = async (reset = false, customFilters = null) => {
    try {
      const activeFilters = customFilters || filters;
      const page = reset ? 1 : currentPage;
      
      if (reset) {
        setSearchLoading(true);
        setError(null);
      } else {
        setLoading(true);
      }

      logInfo('Fetching slots with filters:', { activeFilters, page });

      const params = {
        page,
        limit: 12,
        status: 'available',
        ...activeFilters
      };

      // Clean up empty parameters
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === null || params[key] === undefined) {
          delete params[key];
        }
      });

      const response = await slotService.getSlots(params);

      if (response.success) {
        const newSlots = response.data.slots || [];
        
        if (reset) {
          setSlots(newSlots);
          setCurrentPage(1);
        } else {
          setSlots(prev => [...prev, ...newSlots]);
        }
        
        setHasMore(newSlots.length === 12);
        if (!reset) setCurrentPage(prev => prev + 1);
        
        logInfo('Slots fetched successfully', { 
          count: newSlots.length, 
          total: slots.length + newSlots.length 
        });
      } else {
        throw new Error(response.message || 'Failed to fetch slots');
      }
    } catch (error) {
      logError('Error fetching slots:', error);
      setError('Failed to load time slots. Please try again.');
      toast.error('Failed to load time slots');
    } finally {
      setLoading(false);
      setSearchLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    debouncedSearch(newFilters);
    
    logInteraction(document.createElement('input'), 'filter_changed', { 
      filter: key, 
      value 
    });
  };

  const handleBookSlot = (slot) => {
    if (!user) {
      toast.info('Please sign in to book a session');
      navigate('/login');
      return;
    }

    if (user.credits < slot.cost) {
      toast.error('Insufficient credits to book this session');
      return;
    }

    setSelectedSlot(slot);
    setShowBookingModal(true);
    
    logInteraction(document.createElement('button'), 'book_slot_clicked', { 
      slotId: slot._id, 
      cost: slot.cost 
    });
  };

  const confirmBooking = async () => {
    if (!selectedSlot) return;

    try {
      setBookingLoading(true);
      
      const bookingData = {
        slotId: selectedSlot._id,
        message: `Booking for: ${selectedSlot.title}`
      };

      const response = await bookingService.createBooking(bookingData);

      if (response.success) {
        toast.success('Session booked successfully!');
        setShowBookingModal(false);
        setSelectedSlot(null);
        
        // Refresh slots to update availability
        fetchSlots(true);
        
        // Navigate to bookings page
        navigate('/my-bookings');
        
        logInfo('Booking created successfully', { 
          bookingId: response.data.booking._id,
          slotId: selectedSlot._id 
        });
      } else {
        throw new Error(response.message || 'Failed to create booking');
      }
    } catch (error) {
      logError('Error creating booking:', error);
      toast.error(error.message || 'Failed to book session');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      fetchSlots(false);
    }
  };

  const clearFilters = () => {
    const clearedFilters = {
      search: '',
      category: '',
      minCost: '',
      maxCost: '',
      duration: '',
      sortBy: 'newest',
      dateFrom: '',
      dateTo: ''
    };
    
    setFilters(clearedFilters);
    setSearchParams(new URLSearchParams());
    fetchSlots(true, clearedFilters);
    
    logInteraction(document.createElement('button'), 'filters_cleared');
  };

  const getFilterCount = () => {
    return Object.values(filters).filter(value => value && value !== 'newest').length;
  };

  if (loading && slots.length === 0) {
    return <PageLoading text="Loading available sessions..." />;
  }

  return (
    <div className={styles.explorePage}>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <h1 className={styles.title}>Explore Sessions</h1>
            <p className={styles.subtitle}>
              Discover knowledge-sharing opportunities from professionals worldwide
            </p>
          </div>
          
          {user && (
            <div className={styles.creditsDisplay}>
              <span className={styles.creditsLabel}>Available Credits:</span>
              <span className={styles.creditsAmount}>
                {formatCredits(user.credits)}
              </span>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className={styles.filtersSection}>
          <div className={styles.filtersHeader}>
            <h2 className={styles.filtersTitle}>
              Filters {getFilterCount() > 0 && `(${getFilterCount()})`}
            </h2>
            {getFilterCount() > 0 && (
              <Button
                variant="ghost"
                size="small"
                onClick={clearFilters}
              >
                Clear All
              </Button>
            )}
          </div>

          <div className={styles.filtersGrid}>
            {/* Search */}
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Search</label>
              <input
                type="text"
                placeholder="Search sessions..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className={styles.filterInput}
              />
            </div>

            {/* Category */}
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Category</label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className={styles.filterSelect}
              >
                <option value="">All Categories</option>
                {SLOT_CATEGORIES.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            {/* Duration */}
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Duration</label>
              <select
                value={filters.duration}
                onChange={(e) => handleFilterChange('duration', e.target.value)}
                className={styles.filterSelect}
              >
                <option value="">Any Duration</option>
                {SLOT_DURATIONS.map(duration => (
                  <option key={duration.value} value={duration.value}>
                    {duration.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Cost Range */}
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Min Cost</label>
              <input
                type="number"
                placeholder="Min credits"
                value={filters.minCost}
                onChange={(e) => handleFilterChange('minCost', e.target.value)}
                className={styles.filterInput}
                min="0"
              />
            </div>

            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Max Cost</label>
              <input
                type="number"
                placeholder="Max credits"
                value={filters.maxCost}
                onChange={(e) => handleFilterChange('maxCost', e.target.value)}
                className={styles.filterInput}
                min="0"
              />
            </div>

            {/* Sort */}
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Sort By</label>
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className={styles.filterSelect}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>
          </div>
        </div>

        {/* Search Loading */}
        {searchLoading && (
          <div className={styles.searchLoading}>
            <Loading variant="dots" text="Searching..." />
          </div>
        )}

        {/* Error State */}
        {error && (
          <ErrorMessage
            message={error}
            showRetry
            onRetry={() => fetchSlots(true)}
          />
        )}

        {/* Results */}
        <div className={styles.resultsSection}>
          <div className={styles.resultsHeader}>
            <h2 className={styles.resultsTitle}>
              Available Sessions ({slots.length})
            </h2>
          </div>

          {slots.length > 0 ? (
            <>
              <div className={styles.slotsGrid}>
                {slots.map((slot) => (
                  <ProductCard
                    key={slot._id}
                    title={slot.title}
                    description={truncateText(slot.description, 120)}
                    price={`${formatCredits(slot.cost)} credits`}
                    badge={slot.category}
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
                        <div className={styles.slotMeta}>
                          <span className={styles.duration}>
                            {slot.duration}min
                          </span>
                          <span className={styles.rating}>
                            ⭐ {slot.rating || 5.0}
                          </span>
                        </div>
                      </div>
                    }
                    actions={
                      <div className={styles.slotActions}>
                        <div className={styles.slotInfo}>
                          <span className={styles.mentor}>
                            by {slot.createdBy?.username || 'Anonymous'}
                          </span>
                          <span className={styles.date}>
                            {formatDate(slot.dateTime, 'MMM dd, h:mm a')}
                          </span>
                        </div>
                        <Button
                          variant="primary"
                          size="small"
                          onClick={() => handleBookSlot(slot)}
                          disabled={!user || user.credits < slot.cost}
                        >
                          {!user ? 'Sign In to Book' : 
                           user.credits < slot.cost ? 'Insufficient Credits' : 
                           'Book Session'}
                        </Button>
                      </div>
                    }
                    hover
                    clickable
                    onClick={() => handleBookSlot(slot)}
                  />
                ))}
              </div>

              {/* Load More Button */}
              {hasMore && (
                <div className={styles.loadMoreSection}>
                  <Button
                    variant="outline"
                    size="large"
                    onClick={handleLoadMore}
                    loading={loading}
                    disabled={loading}
                  >
                    {loading ? 'Loading...' : 'Load More Sessions'}
                  </Button>
                </div>
              )}
            </>
          ) : !searchLoading && !loading && (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>🔍</div>
              <h3 className={styles.emptyTitle}>No sessions found</h3>
              <p className={styles.emptyDescription}>
                Try adjusting your filters or search terms to find more sessions
              </p>
              <Button
                variant="outline"
                onClick={clearFilters}
              >
                Clear Filters
              </Button>
            </div>
          )}
        </div>

        {/* Booking Confirmation Modal */}
        <ConfirmModal
          isOpen={showBookingModal}
          onClose={() => setShowBookingModal(false)}
          onConfirm={confirmBooking}
          title="Confirm Booking"
          message={
            selectedSlot ? (
              <div className={styles.bookingConfirmation}>
                <h4>{selectedSlot.title}</h4>
                <p><strong>Mentor:</strong> {selectedSlot.createdBy?.username}</p>
                <p><strong>Duration:</strong> {selectedSlot.duration} minutes</p>
                <p><strong>Date:</strong> {formatDate(selectedSlot.dateTime, 'MMM dd, yyyy - h:mm a')}</p>
                <p><strong>Cost:</strong> {formatCredits(selectedSlot.cost)} credits</p>
                <div className={styles.creditBalance}>
                  <p>Your credits: {formatCredits(user?.credits || 0)}</p>
                  <p>After booking: {formatCredits((user?.credits || 0) - (selectedSlot.cost || 0))}</p>
                </div>
              </div>
            ) : ''
          }
          confirmText="Book Session"
          cancelText="Cancel"
          variant="primary"
          loading={bookingLoading}
        />
      </div>
    </div>
  );
};

export default Explore;