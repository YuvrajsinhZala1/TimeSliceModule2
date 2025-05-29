import React from 'react';
import SlotCard from './SlotCard';
import Loading from '../Common/Loading';

const SlotList = ({ 
  slots, 
  loading, 
  onBook, 
  onEdit, 
  onDelete, 
  showActions = true,
  showMentor = true,
  isOwnerView = false,
  currentUser = null
}) => {
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loading size="large" text="Loading slots..." />
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-6xl mb-4">⏰</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No slots found
        </h3>
        <p className="text-gray-500">
          {isOwnerView 
            ? "You haven't created any time slots yet." 
            : "No available slots match your criteria."}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {slots.map((slot) => (
        <SlotCard
          key={slot._id}
          slot={slot}
          onBook={onBook}
          onEdit={onEdit}
          onDelete={onDelete}
          showActions={showActions}
          showMentor={showMentor}
          isOwner={isOwnerView}
          canBook={currentUser && currentUser.credits >= slot.cost}
        />
      ))}
    </div>
  );
};

export default SlotList;