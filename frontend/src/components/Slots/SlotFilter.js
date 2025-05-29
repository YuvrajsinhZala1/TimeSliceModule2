import React from 'react';
import { SLOT_CATEGORIES } from '../../utils/constants';

const SlotFilter = ({ filters, onFilterChange, onReset }) => {
  const handleChange = (key, value) => {
    onFilterChange(key, value);
  };

  const handleReset = () => {
    if (onReset) onReset();
  };

  const hasActiveFilters = Object.values(filters).some(value => 
    value !== '' && value !== null && value !== undefined
  );

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Filters</h3>
        {hasActiveFilters && (
          <button
            onClick={handleReset}
            className="text-sm text-indigo-600 hover:text-indigo-800"
          >
            Clear All
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Category Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category
          </label>
          <select
            value={filters.category || ''}
            onChange={(e) => handleChange('category', e.target.value)}
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
            value={filters.duration || ''}
            onChange={(e) => handleChange('duration', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">Any Duration</option>
            <option value="30">30 minutes</option>
            <option value="60">60 minutes</option>
          </select>
        </div>

        {/* Cost Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Max Cost (Credits)
          </label>
          <input
            type="number"
            min="1"
            max="20"
            value={filters.maxCost || ''}
            onChange={(e) => handleChange('maxCost', e.target.value)}
            placeholder="Max credits"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Sort Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sort By
          </label>
          <select
            value={`${filters.sortBy || 'dateTime'}-${filters.sortOrder || 'asc'}`}
            onChange={(e) => {
              const [sortBy, sortOrder] = e.target.value.split('-');
              handleChange('sortBy', sortBy);
              handleChange('sortOrder', sortOrder);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="dateTime-asc">Date (Earliest First)</option>
            <option value="dateTime-desc">Date (Latest First)</option>
            <option value="cost-asc">Cost (Low to High)</option>
            <option value="cost-desc">Cost (High to Low)</option>
            <option value="createdAt-desc">Recently Created</option>
          </select>
        </div>
      </div>

      {/* Skills Search */}
      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Skills (comma-separated)
        </label>
        <input
          type="text"
          value={filters.skills || ''}
          onChange={(e) => handleChange('skills', e.target.value)}
          placeholder="e.g., React, JavaScript, Design"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        />
        <p className="mt-1 text-xs text-gray-500">
          Enter skills separated by commas to find relevant slots
        </p>
      </div>

      {/* Date Range Filter */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            From Date
          </label>
          <input
            type="date"
            value={filters.dateFrom || ''}
            onChange={(e) => handleChange('dateFrom', e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            To Date
          </label>
          <input
            type="date"
            value={filters.dateTo || ''}
            onChange={(e) => handleChange('dateTo', e.target.value)}
            min={filters.dateFrom || new Date().toISOString().split('T')[0]}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Active Filters:</h4>
          <div className="flex flex-wrap gap-2">
            {Object.entries(filters).map(([key, value]) => {
              if (!value) return null;
              
              let displayValue = value;
              if (key === 'duration') displayValue = `${value} min`;
              if (key === 'maxCost') displayValue = `≤${value} credits`;
              if (key === 'sortBy') return null; // Don't show sort as active filter
              if (key === 'sortOrder') return null;
              
              return (
                <span
                  key={key}
                  className="inline-flex items-center px-3 py-1 text-sm bg-indigo-100 text-indigo-800 rounded-full"
                >
                  {key}: {displayValue}
                  <button
                    onClick={() => handleChange(key, '')}
                    className="ml-2 text-indigo-600 hover:text-indigo-800"
                  >
                    ×
                  </button>
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default SlotFilter;