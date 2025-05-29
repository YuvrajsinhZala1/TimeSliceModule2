import React from 'react';
import BookingCard from './BookingCard';
import Loading from '../Common/Loading';

const BookingList = ({ 
  bookings, 
  loading, 
  currentUserRole, 
  onStatusUpdate, 
  onCancel, 
  onReview 
}) => {
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loading size="large" text="Loading bookings..." />
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-6xl mb-4">📅</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No bookings found
        </h3>
        <p className="text-gray-500">
          {currentUserRole === 'student' 
            ? "You haven't booked any sessions yet." 
            : "No one has booked your slots yet."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {bookings.map((booking) => (
        <BookingCard
          key={booking._id}
          booking={booking}
          currentUserRole={currentUserRole}
          onStatusUpdate={onStatusUpdate}
          onCancel={onCancel}
          onReview={onReview}
        />
      ))}
    </div>
  );
};

export default BookingList;