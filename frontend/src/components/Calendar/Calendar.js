import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday } from 'date-fns';
import { slotService } from '../../services/slotService';
import { bookingService } from '../../services/bookingService';
import { formatDate } from '../../utils/helpers';

const Calendar = ({ onDateSelect, selectedDate, showBookings = false }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [slots, setSlots] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMonthData();
  }, [currentDate]);

  const fetchMonthData = async () => {
    try {
      setLoading(true);
      const start = startOfMonth(currentDate);
      const end = endOfMonth(currentDate);

      const promises = [
        slotService.getSlots({
          dateFrom: start.toISOString(),
          dateTo: end.toISOString(),
          limit: 100
        })
      ];

      if (showBookings) {
        promises.push(bookingService.getBookings({ limit: 100 }));
      }

      const responses = await Promise.all(promises);
      setSlots(responses[0].data.slots || []);
      
      if (showBookings && responses[1]) {
        setBookings(responses[1].data.bookings || []);
      }
    } catch (error) {
      console.error('Error fetching calendar data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = () => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    return eachDayOfInterval({ start, end });
  };

  const getEventsForDate = (date) => {
    const daySlots = slots.filter(slot => 
      isSameDay(new Date(slot.dateTime), date)
    );
    
    const dayBookings = showBookings ? bookings.filter(booking => 
      isSameDay(new Date(booking.slotId.dateTime), date)
    ) : [];

    return { slots: daySlots, bookings: dayBookings };
  };

  const goToPreviousMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const days = getDaysInMonth();
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold text-gray-900">
          {format(currentDate, 'MMMM yyyy')}
        </h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={goToPreviousMonth}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={goToToday}
            className="px-3 py-1 text-sm text-indigo-600 hover:text-indigo-800 rounded-md hover:bg-indigo-50"
          >
            Today
          </button>
          <button
            onClick={goToNextMonth}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-4">
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekdays.map(day => (
            <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, index) => {
            const events = getEventsForDate(day);
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const isTodayDate = isToday(day);
            const isCurrentMonth = isSameMonth(day, currentDate);

            return (
              <div
                key={index}
                onClick={() => onDateSelect && onDateSelect(day)}
                className={`
                  relative p-2 h-20 border border-gray-200 cursor-pointer hover:bg-gray-50
                  ${!isCurrentMonth ? 'text-gray-400 bg-gray-50' : ''}
                  ${isSelected ? 'bg-indigo-100 border-indigo-300' : ''}
                  ${isTodayDate ? 'bg-blue-50 border-blue-300' : ''}
                `}
              >
                <div className="text-sm">
                  {format(day, 'd')}
                </div>

                {/* Events */}
                <div className="mt-1 space-y-1">
                  {events.slots.slice(0, 2).map((slot, idx) => (
                    <div
                      key={idx}
                      className="w-full h-1 bg-green-400 rounded-full"
                      title={`${slot.title} - ${format(new Date(slot.dateTime), 'h:mm a')}`}
                    />
                  ))}
                  
                  {showBookings && events.bookings.slice(0, 2).map((booking, idx) => (
                    <div
                      key={idx}
                      className={`w-full h-1 rounded-full ${
                        booking.status === 'confirmed' ? 'bg-blue-400' :
                        booking.status === 'completed' ? 'bg-purple-400' :
                        booking.status === 'cancelled' ? 'bg-red-400' : 'bg-yellow-400'
                      }`}
                      title={`${booking.slotId.title} - ${booking.status}`}
                    />
                  ))}

                  {(events.slots.length + events.bookings.length) > 2 && (
                    <div className="text-xs text-gray-500 text-center">
                      +{(events.slots.length + events.bookings.length) - 2} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-4 flex items-center justify-center space-x-6 text-xs text-gray-600">
          <div className="flex items-center">
            <div className="w-3 h-1 bg-green-400 rounded-full mr-2" />
            Available Slots
          </div>
          {showBookings && (
            <>
              <div className="flex items-center">
                <div className="w-3 h-1 bg-blue-400 rounded-full mr-2" />
                Confirmed
              </div>
              <div className="flex items-center">
                <div className="w-3 h-1 bg-purple-400 rounded-full mr-2" />
                Completed
              </div>
              <div className="flex items-center">
                <div className="w-3 h-1 bg-yellow-400 rounded-full mr-2" />
                Pending
              </div>
            </>
          )}
        </div>
      </div>

      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
          <div className="text-indigo-600">Loading...</div>
        </div>
      )}
    </div>
  );
};

export default Calendar;