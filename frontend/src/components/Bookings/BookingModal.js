import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { formatDate, formatCredits } from '../../utils/helpers';
import { useAuth } from '../../context/AuthContext';
import Loading from '../Common/Loading';

const BookingModal = ({ slot, isOpen, onClose, onBook }) => {
  const { user } = useAuth();
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please log in to book a slot');
      return;
    }

    if (user.credits < slot.cost) {
      toast.error('Insufficient credits');
      return;
    }

    setLoading(true);
    try {
      await onBook(slot._id, notes.trim());
      setNotes('');
      onClose();
    } catch (error) {
      // Error handling is done in parent component
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !slot) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
          onClick={onClose}
        />
        
        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Book Time Slot
                  </h3>
                  
                  {/* Slot Details */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <h4 className="font-semibold text-gray-900 mb-2">
                      {slot.title}
                    </h4>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center">
                        <span className="mr-2">👤</span>
                        {slot.userId.username}
                      </div>
                      <div className="flex items-center">
                        <span className="mr-2">📅</span>
                        {formatDate(slot.dateTime, 'MMM dd, yyyy - h:mm a')}
                      </div>
                      <div className="flex items-center">
                        <span className="mr-2">⏱️</span>
                        {slot.duration} minutes
                      </div>
                      <div className="flex items-center">
                        <span className="mr-2">💰</span>
                        {formatCredits(slot.cost)} credits
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 mt-3">
                      {slot.description}
                    </p>
                  </div>

                  {/* User Credits */}
                  {user && (
                    <div className="mb-4 p-3 bg-blue-50 rounded-md">
                      <p className="text-sm text-blue-800">
                        Your balance: <strong>{formatCredits(user.credits)} credits</strong>
                      </p>
                      {user.credits < slot.cost && (
                        <p className="text-sm text-red-600 mt-1">
                          Insufficient credits. You need {formatCredits(slot.cost - user.credits)} more credits.
                        </p>
                      )}
                    </div>
                  )}

                  {/* Notes */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notes (Optional)
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Any specific questions or topics you'd like to cover?"
                      maxLength={500}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      {notes.length}/500 characters
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={loading || !user || user.credits < slot.cost}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loading size="small" color="white" />
                ) : !user ? (
                  'Login Required'
                ) : user.credits < slot.cost ? (
                  'Insufficient Credits'
                ) : (
                  `Book for ${formatCredits(slot.cost)} Credits`
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BookingModal;