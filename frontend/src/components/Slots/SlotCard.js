import React from 'react';
import { formatDate, formatCredits, getInitials } from '../../utils/helpers';

const SlotCard = ({ 
  slot, 
  onBook, 
  onEdit, 
  onDelete, 
  showActions = true, 
  showMentor = true,
  isOwner = false,
  canBook = true 
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {slot.title}
            </h3>
            {showMentor && slot.userId && (
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-medium">
                    {getInitials(slot.userId.username)}
                  </span>
                </div>
                <span className="text-sm text-gray-600">
                  {slot.userId.username}
                </span>
                {slot.userId.rating?.average && (
                  <div className="flex items-center">
                    <span className="text-yellow-400 text-sm">⭐</span>
                    <span className="text-sm text-gray-600 ml-1">
                      {slot.userId.rating.average.toFixed(1)}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Status Badge */}
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            slot.isBooked 
              ? 'bg-red-100 text-red-800' 
              : slot.isActive 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-800'
          }`}>
            {slot.isBooked ? 'Booked' : slot.isActive ? 'Available' : 'Inactive'}
          </span>
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
          {slot.meetingPlatform && (
            <div className="flex items-center text-sm text-gray-600">
              <span className="mr-2">💻</span>
              {slot.meetingPlatform}
            </div>
          )}
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

        {/* Tags */}
        {slot.tags && slot.tags.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-1">
              {slot.tags.slice(0, 4).map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                >
                  #{tag}
                </span>
              ))}
              {slot.tags.length > 4 && (
                <span className="inline-flex items-center px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                  +{slot.tags.length - 4}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Prerequisites */}
        {slot.prerequisites && (
          <div className="mb-4 p-3 bg-yellow-50 rounded-md">
            <h5 className="text-xs font-medium text-yellow-800 mb-1">Prerequisites:</h5>
            <p className="text-xs text-yellow-700">{slot.prerequisites}</p>
          </div>
        )}

        {/* Outcomes */}
        {slot.outcomes && (
          <div className="mb-4 p-3 bg-green-50 rounded-md">
            <h5 className="text-xs font-medium text-green-800 mb-1">What you'll learn:</h5>
            <p className="text-xs text-green-700">{slot.outcomes}</p>
          </div>
        )}

        {/* Footer */}
        {showActions && (
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div className="flex items-center">
              <span className="text-lg font-bold text-gray-900">
                {formatCredits(slot.cost)} credits
              </span>
              {slot.maxParticipants > 1 && (
                <span className="ml-2 text-sm text-gray-500">
                  ({slot.currentParticipants || 0}/{slot.maxParticipants} spots)
                </span>
              )}
            </div>
            
            <div className="flex space-x-2">
              {isOwner ? (
                <>
                  <button
                    onClick={() => onEdit && onEdit(slot)}
                    disabled={slot.isBooked}
                    className="px-3 py-1 text-sm text-indigo-600 hover:text-indigo-800 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete && onDelete(slot._id)}
                    disabled={slot.isBooked}
                    className="px-3 py-1 text-sm text-red-600 hover:text-red-800 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Delete
                  </button>
                </>
              ) : (
                <button
                  onClick={() => onBook && onBook(slot)}
                  disabled={!canBook || slot.isBooked || !slot.isActive}
                  className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {slot.isBooked ? 'Booked' : !slot.isActive ? 'Unavailable' : 'Book Now'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SlotCard;