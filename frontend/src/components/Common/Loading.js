import React from 'react';

const Loading = ({ 
  size = 'medium', 
  color = 'indigo', 
  text = '', 
  overlay = false,
  className = '' 
}) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12',
    xlarge: 'w-16 h-16'
  };

  const colorClasses = {
    indigo: 'text-indigo-600',
    blue: 'text-blue-600',
    green: 'text-green-600',
    red: 'text-red-600',
    yellow: 'text-yellow-600',
    purple: 'text-purple-600',
    pink: 'text-pink-600',
    gray: 'text-gray-600',
    white: 'text-white'
  };

  const SpinnerIcon = () => (
    <svg
      className={`${sizeClasses[size]} ${colorClasses[color]} animate-spin ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );

  const LoadingContent = () => (
    <div className={`flex flex-col items-center justify-center ${text ? 'space-y-3' : ''}`}>
      <SpinnerIcon />
      {text && (
        <p 
          className={`text-sm font-medium ${colorClasses[color]} animate-pulse`}
          role="status"
          aria-live="polite"
        >
          {text}
        </p>
      )}
    </div>
  );

  if (overlay) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-lg p-6 mx-4">
          <LoadingContent />
        </div>
      </div>
    );
  }

  return <LoadingContent />;
};

// Skeleton Loading Component
export const LoadingSkeleton = ({ 
  lines = 3, 
  height = 'h-4', 
  className = '',
  animate = true 
}) => {
  return (
    <div className={`space-y-3 ${className}`} role="status" aria-label="Loading content">
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className={`bg-gray-200 rounded ${height} ${
            animate ? 'animate-pulse' : ''
          } ${index === lines - 1 ? 'w-3/4' : 'w-full'}`}
        />
      ))}
    </div>
  );
};

// Card Loading Component
export const LoadingCard = ({ className = '' }) => {
  return (
    <div className={`bg-white rounded-lg shadow-sm p-6 ${className}`} role="status" aria-label="Loading card">
      <div className="animate-pulse">
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-12 h-12 bg-gray-200 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-3 bg-gray-200 rounded w-1/2" />
          </div>
        </div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded" />
          <div className="h-4 bg-gray-200 rounded w-5/6" />
          <div className="h-4 bg-gray-200 rounded w-4/6" />
        </div>
        <div className="flex justify-between items-center mt-6">
          <div className="h-8 bg-gray-200 rounded w-20" />
          <div className="h-8 bg-gray-200 rounded w-24" />
        </div>
      </div>
    </div>
  );
};

// Button Loading Component
export const LoadingButton = ({ 
  children, 
  loading = false, 
  disabled = false,
  className = '',
  size = 'medium',
  ...props 
}) => {
  const sizeClasses = {
    small: 'px-3 py-1.5 text-sm',
    medium: 'px-4 py-2 text-sm',
    large: 'px-6 py-3 text-base'
  };

  return (
    <button
      {...props}
      disabled={loading || disabled}
      className={`
        inline-flex items-center justify-center font-medium rounded-md
        transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${sizeClasses[size]}
        ${className}
      `}
    >
      {loading && (
        <Loading size="small" color="white" className="mr-2" />
      )}
      {children}
    </button>
  );
};

// Inline Loading Component
export const InlineLoading = ({ text = 'Loading...', className = '' }) => {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <Loading size="small" />
      <span className="text-sm text-gray-600">{text}</span>
    </div>
  );
};

// Page Loading Component
export const PageLoading = ({ title = 'Loading...', subtitle = '' }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loading size="large" text={title} />
        {subtitle && (
          <p className="mt-2 text-sm text-gray-500">{subtitle}</p>
        )}
      </div>
    </div>
  );
};

// Data Loading Component
export const DataLoading = ({ 
  rows = 5, 
  columns = 3, 
  className = '' 
}) => {
  return (
    <div className={`space-y-4 ${className}`} role="status" aria-label="Loading data">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div
              key={colIndex}
              className="h-4 bg-gray-200 rounded animate-pulse"
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export default Loading;