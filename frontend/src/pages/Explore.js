import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { slotService } from '../services/slotService';
import { bookingService } from '../services/bookingService';
import { useAuth } from '../context/AuthContext';
import { logInfo, logError, logInteraction } from '../utils/logger';
import { formatDate, formatCredits } from '../utils/helpers';
import { SLOT_CATEGORIES } from '../utils/constants';
import Loading from '../components/Common/Loading';
import ErrorMessage from '../components/Common/ErrorMessage';

const Explore = () => {
  const { user } = useAuth();
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(null);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    category: '',
    skills: '',
    minCost: '',
    maxCost: '',
    duration: '',
    sortBy: 'dateTime',
    sortOrder: 'asc'
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0,
    limit: 12
  });

  useEffect(() => {
    logInfo('Explore page loaded');
    fetchSlots();
  }, [filters, pagination.currentPage]);

  const fetchSlots = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        ...filters,
        page: pagination.currentPage,
        limit: pagination.limit
      };

      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (params[key] === '') delete params[key];
      });

      const response = await slotService.getSlots(params);
      
      setSlots(response.data.slots);
      setPagination(prev => ({
        ...prev,
        ...response.data.pagination
      }));

      logInfo('Slots loaded successfully', { count: response.data.slots.length });
    } catch (error) {
      logError('Error loading slots:', error);
      setError('Failed to load slots');
      toast.error('Failed to load slots');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setPagination(prev => ({
      ...prev,
      currentPage: 1
    }));
    logInteraction({ tagName: 'SELECT' }, 'filter_changed', { key, value });
  };

  const handleBookSlot = async (slotId) => {
    if (!user) {
      toast.error('Please log in to book a slot');
      return;
    }

    try {
      setBookingLoading(slotId);
      logInteraction({ tagName: 'BUTTON' }, 'book_slot_clicked', { slotId });

      const response = await bookingService.createBooking({
        slotId: slotId,
        notes: ''
      });

      if (response.success) {
        toast.success('Slot booked successfully!');
        fetchSlots(); // Refresh slots to update availability
        logInfo('Slot booked successfully', { slotId });
      }
    } catch (error) {
      logError('Error booking slot:', error);
      toast.error(error.message || 'Failed to book slot');
    } finally {
      setBookingLoading(null);
    }
  };

  const handlePageChange = (page) => {
    setPagination(prev => ({
      ...prev,
      currentPage: page
    }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Explore Time Slots</h1>
          <p className="text-gray-600 mt-2">
            Discover and book sessions with experts in various fields
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">All Categories</option>
                {SLOT_CATEGORIES.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            {/* Duration Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration
              </label>
              <select
                value={filters.duration}
                onChange={(e) => handleFilterChange('duration', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Any Duration</option>
                <option value="30">30 minutes</option>
                <option value="60">60 minutes</option>
              </select>
            </div>

            {/* Cost Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Cost (Credits)
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={filters.maxCost}
                onChange={(e) => handleFilterChange('maxCost', e.target.value)}
                placeholder="Max credits"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort By
              </label>
              <select
                value={`${filters.sortBy}-${filters.sortOrder}`}
                onChange={(e) => {
                  const [sortBy, sortOrder] = e.target.value.split('-');
                  handleFilterChange('sortBy', sortBy);
                  handleFilterChange('sortOrder', sortOrder);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="dateTime-asc">Date (Earliest First)</option>
                <option value="dateTime-desc">Date (Latest First)</option>
                <option value="cost-asc">Cost (Low to High)</option>
                <option value="cost-desc">Cost (High to Low)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loading size="large" text="Loading slots..." />
          </div>
        ) : error ? (
          <ErrorMessage message={error} />
        ) : slots.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🔍</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No slots found</h3>
            <p className="text-gray-500">Try adjusting your filters to see more results.</p>
          </div>
        ) : (
          <>
            {/* Results Header */}
            <div className="flex justify-between items-center mb-6">
              <p className="text-gray-600">
                Showing {slots.length} of {pagination.total} slots
              </p>
            </div>

            {/* Slots Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {slots.map((slot) => (
                <div key={slot._id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
                  <div className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {slot.title}
                        </h3>
                        <p className="text-sm text-gray-600">
                          by {slot.userId.username}
                        </p>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span className="text-yellow-400">⭐</span>
                        <span className="text-sm text-gray-600">
                          {slot.userId.rating?.average?.toFixed(1) || 'New'}
                        </span>
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
                    </div>

                    {/* Skills */}
                    {slot.skills.length > 0 && (
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

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <div className="flex items-center">
                        <span className="text-lg font-bold text-gray-900">
                          {formatCredits(slot.cost)} credits
                        </span>
                      </div>
                      <button
                        onClick={() => handleBookSlot(slot._id)}
                        disabled={!user || bookingLoading === slot._id || (user && user.credits < slot.cost)}
                        className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {bookingLoading === slot._id ? (
                          <Loading size="small" color="white" />
                        ) : !user ? (
                          'Login to Book'
                        ) : user.credits < slot.cost ? (
                          'Not Enough Credits'
                        ) : (
                          'Book Now'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 rounded-lg">
                <div className="flex flex-1 justify-between sm:hidden">
                  <button
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={pagination.currentPage === 1}
                    className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={pagination.currentPage === pagination.totalPages}
                    className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium">{((pagination.currentPage - 1) * pagination.limit) + 1}</span> to{' '}
                      <span className="font-medium">
                        {Math.min(pagination.currentPage * pagination.limit, pagination.total)}
                      </span>{' '}
                      of <span className="font-medium">{pagination.total}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm">
                      <button
                        onClick={() => handlePageChange(pagination.currentPage - 1)}
                        disabled={pagination.currentPage === 1}
                        className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">Previous</span>
                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                        </svg>
                      </button>
                      
                      {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                        const page = i + Math.max(1, pagination.currentPage - 2);
                        if (page > pagination.totalPages) return null;
                        
                        return (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                              page === pagination.currentPage
                                ? 'z-10 bg-indigo-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
                                : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      })}

                      <button
                        onClick={() => handlePageChange(pagination.currentPage + 1)}
                        disabled={pagination.currentPage === pagination.totalPages}
                        className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">Next</span>
                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Explore;