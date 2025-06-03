import React, { useState, useEffect, useMemo } from 'react';
import { logInfo, logComponent, logError, logInteraction } from '../../../utils/logger';
import { SLOT_CATEGORIES, SLOT_DURATIONS } from '../../../utils/constants';
import SlotCard from '../SlotCard/SlotCard';
import Button from '../../Common/Button/Button';
import Loading from '../../Common/Loading/Loading';
import ErrorMessage from '../../Common/ErrorMessage/ErrorMessage';
import { toast } from 'react-toastify';
import styles from './SlotList.module.css';

const SlotList = ({ 
  slots = [], 
  loading = false, 
  error = null,
  onBook,
  onEdit,
  onDelete,
  onLoadMore,
  hasMore = false,
  showFilters = true,
  showSearch = true,
  emptyMessage = "No time slots available",
  emptyDescription = "Check back later for new sessions",
  variant = 'grid', // 'grid', 'list', 'compact'
  isOwn = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedDuration, setSelectedDuration] = useState('');
  const [sortBy, setSortBy] = useState('dateTime'); // 'dateTime', 'cost', 'title', 'category'
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc', 'desc'
  const [showExpired, setShowExpired] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    logComponent('SlotList', 'mounted', { 
      slotsCount: slots.length, 
      variant, 
      isOwn 
    });
  }, [slots.length, variant, isOwn]);

  // Filter and sort slots
  const filteredAndSortedSlots = useMemo(() => {
    let filtered = [...slots];

    // Filter by search term
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(slot => 
        slot.title.toLowerCase().includes(searchLower) ||
        slot.description.toLowerCase().includes(searchLower) ||
        slot.category.toLowerCase().includes(searchLower) ||
        (slot.tags && slot.tags.some(tag => tag.toLowerCase().includes(searchLower)))
      );
    }

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(slot => slot.category === selectedCategory);
    }

    // Filter by duration
    if (selectedDuration) {
      filtered = filtered.filter(slot => slot.duration === parseInt(selectedDuration));
    }

    // Filter expired slots (unless explicitly showing them)
    if (!showExpired) {
      const now = new Date();
      filtered = filtered.filter(slot => new Date(slot.dateTime) > now);
    }

    // Sort slots
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case 'cost':
          aValue = a.cost;
          bValue = b.cost;
          break;
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'category':
          aValue = a.category.toLowerCase();
          bValue = b.category.toLowerCase();
          break;
        case 'dateTime':
        default:
          aValue = new Date(a.dateTime);
          bValue = new Date(b.dateTime);
          break;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [slots, searchTerm, selectedCategory, selectedDuration, sortBy, sortOrder, showExpired]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    logInteraction(e.target, 'slot_search', { searchTerm: e.target.value });
  };

  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
    logInteraction(e.target, 'category_filter_changed', { category: e.target.value });
  };

  const handleDurationChange = (e) => {
    setSelectedDuration(e.target.value);
    logInteraction(e.target, 'duration_filter_changed', { duration: e.target.value });
  };

  const handleSortChange = (newSortBy) => {
    if (newSortBy === sortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('asc');
    }
    logInteraction(document.createElement('button'), 'sort_changed', { 
      sortBy: newSortBy, 
      sortOrder: sortOrder === 'asc' ? 'desc' : 'asc' 
    });
  };

  const handleLoadMore = async () => {
    if (!onLoadMore || loadingMore) return;

    try {
      setLoadingMore(true);
      logInteraction(document.createElement('button'), 'load_more_slots_clicked');
      await onLoadMore();
      logInfo('More slots loaded successfully');
    } catch (error) {
      logError('Error loading more slots:', error);
      toast.error('Failed to load more slots');
    } finally {
      setLoadingMore(false);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setSelectedDuration('');
    setSortBy('dateTime');
    setSortOrder('asc');
    setShowExpired(false);
    logInteraction(document.createElement('button'), 'clear_filters_clicked');
  };

  const hasActiveFilters = searchTerm || selectedCategory || selectedDuration || showExpired;

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <ErrorMessage 
          message={error}
          showRetry={false}
        />
      </div>
    );
  }

  return (
    <div className={styles.slotList}>
      {/* Filters and Search */}
      {(showFilters || showSearch) && (
        <div className={styles.filtersSection}>
          <div className={styles.filtersContainer}>
            {/* Search */}
            {showSearch && (
              <div className={styles.searchContainer}>
                <div className={styles.searchInputWrapper}>
                  <svg className={styles.searchIcon} viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"/>
                  </svg>
                  <input
                    type="text"
                    placeholder="Search slots by title, description, or tags..."
                    value={searchTerm}
                    onChange={handleSearch}
                    className={styles.searchInput}
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className={styles.clearSearchButton}
                      aria-label="Clear search"
                    >
                      <svg viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Filters */}
            {showFilters && (
              <div className={styles.filtersRow}>
                <div className={styles.filterGroup}>
                  <select
                    value={selectedCategory}
                    onChange={handleCategoryChange}
                    className={styles.filterSelect}
                  >
                    <option value="">All Categories</option>
                    {SLOT_CATEGORIES.map(category => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.filterGroup}>
                  <select
                    value={selectedDuration}
                    onChange={handleDurationChange}
                    className={styles.filterSelect}
                  >
                    <option value="">All Durations</option>
                    {SLOT_DURATIONS.map(duration => (
                      <option key={duration.value} value={duration.value}>
                        {duration.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.filterGroup}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={showExpired}
                      onChange={(e) => setShowExpired(e.target.checked)}
                      className={styles.checkbox}
                    />
                    <span className={styles.checkboxText}>Show Expired</span>
                  </label>
                </div>

                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className={styles.clearFiltersButton}
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sort Controls */}
      <div className={styles.sortSection}>
        <div className={styles.sortContainer}>
          <span className={styles.sortLabel}>Sort by:</span>
          <div className={styles.sortButtons}>
            {[
              { key: 'dateTime', label: 'Date' },
              { key: 'cost', label: 'Cost' },
              { key: 'title', label: 'Title' },
              { key: 'category', label: 'Category' }
            ].map(sort => (
              <button
                key={sort.key}
                onClick={() => handleSortChange(sort.key)}
                className={`${styles.sortButton} ${sortBy === sort.key ? styles.sortButtonActive : ''}`}
              >
                {sort.label}
                {sortBy === sort.key && (
                  <span className={styles.sortIndicator}>
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.resultsInfo}>
          {filteredAndSortedSlots.length} of {slots.length} slot{slots.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Slots Grid/List */}
      {loading && slots.length === 0 ? (
        <div className={styles.loadingContainer}>
          <Loading size="large" text="Loading slots..." />
        </div>
      ) : filteredAndSortedSlots.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🔍</div>
          <h3 className={styles.emptyTitle}>
            {hasActiveFilters ? 'No slots match your filters' : emptyMessage}
          </h3>
          <p className={styles.emptyDescription}>
            {hasActiveFilters 
              ? 'Try adjusting your search criteria or clearing filters to see more results.'
              : emptyDescription
            }
          </p>
          {hasActiveFilters && (
            <Button
              variant="outline"
              onClick={clearFilters}
              className={styles.clearFiltersEmptyButton}
            >
              Clear Filters
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className={`${styles.slotsGrid} ${styles[variant]}`}>
            {filteredAndSortedSlots.map((slot) => (
              <SlotCard
                key={slot._id}
                slot={slot}
                onBook={onBook}
                onEdit={onEdit}
                onDelete={onDelete}
                showActions={true}
                variant={variant === 'compact' ? 'compact' : 'default'}
                isOwn={isOwn}
                loading={loading}
              />
            ))}
          </div>

          {/* Load More Button */}
          {hasMore && onLoadMore && (
            <div className={styles.loadMoreSection}>
              <Button
                variant="outline"
                size="large"
                onClick={handleLoadMore}
                loading={loadingMore}
                disabled={loadingMore || loading}
                icon={
                  <svg viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"/>
                  </svg>
                }
              >
                {loadingMore ? 'Loading...' : 'Load More Slots'}
              </Button>
            </div>
          )}

          {/* Loading Indicator for Additional Slots */}
          {loading && slots.length > 0 && (
            <div className={styles.additionalLoadingContainer}>
              <Loading size="medium" text="Loading more slots..." />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SlotList;