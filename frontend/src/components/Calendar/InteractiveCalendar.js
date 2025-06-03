import React, { useState, useEffect, useMemo } from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  isToday, 
  isWeekend,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  parseISO,
  isAfter,
  isBefore
} from 'date-fns';
import { logInfo, logComponent, logError, logInteraction } from '../../utils/logger';
import { formatDate, formatCredits } from '../../utils/helpers';
import Button from '../Common/Button/Button';
import Loading from '../Common/Loading/Loading';
import { toast } from 'react-toastify';

const InteractiveCalendar = ({ 
  slots = [], 
  bookings = [],
  onDateSelect,
  onSlotSelect,
  onBookingSelect,
  selectedDate = null,
  loading = false,
  minDate = new Date(),
  maxDate = null,
  showBookings = true,
  showSlots = true,
  highlightAvailable = true,
  variant = 'full', // 'full', 'compact', 'mini'
  className = ''
}) => {
  const [currentDate, setCurrentDate] = useState(selectedDate || new Date());
  const [viewMode, setViewMode] = useState('month'); // 'month', 'week'
  const [hoveredDate, setHoveredDate] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    logComponent('InteractiveCalendar', 'mounted', { 
      variant, 
      slotsCount: slots.length,
      bookingsCount: bookings.length 
    });
  }, [variant, slots.length, bookings.length]);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate));
    const end = endOfWeek(endOfMonth(currentDate));
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  // Get events for a specific date
  const getEventsForDate = useMemo(() => {
    const eventsByDate = new Map();
    
    // Process slots
    if (showSlots) {
      slots.forEach(slot => {
        const dateKey = format(parseISO(slot.dateTime), 'yyyy-MM-dd');
        if (!eventsByDate.has(dateKey)) {
          eventsByDate.set(dateKey, { slots: [], bookings: [] });
        }
        eventsByDate.get(dateKey).slots.push(slot);
      });
    }
    
    // Process bookings
    if (showBookings) {
      bookings.forEach(booking => {
        const dateKey = format(parseISO(booking.slotId.dateTime), 'yyyy-MM-dd');
        if (!eventsByDate.has(dateKey)) {
          eventsByDate.set(dateKey, { slots: [], bookings: [] });
        }
        eventsByDate.get(dateKey).bookings.push(booking);
      });
    }
    
    return (date) => {
      const dateKey = format(date, 'yyyy-MM-dd');
      return eventsByDate.get(dateKey) || { slots: [], bookings: [] };
    };
  }, [slots, bookings, showSlots, showBookings]);

  const handleDateClick = (date) => {
    if (isDateDisabled(date)) return;

    logInteraction(document.createElement('button'), 'calendar_date_clicked', { 
      date: format(date, 'yyyy-MM-dd') 
    });

    if (onDateSelect) {
      onDateSelect(date);
    }
  };

  const handleSlotClick = (e, slot) => {
    e.stopPropagation();
    logInteraction(e.target, 'calendar_slot_clicked', { slotId: slot._id });
    
    if (onSlotSelect) {
      onSlotSelect(slot);
    }
  };

  const handleBookingClick = (e, booking) => {
    e.stopPropagation();
    logInteraction(e.target, 'calendar_booking_clicked', { bookingId: booking._id });
    
    if (onBookingSelect) {
      onBookingSelect(booking);
    }
  };

  const handleMouseEnter = (e, date) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 10
    });
    setHoveredDate(date);
  };

  const handleMouseLeave = () => {
    setHoveredDate(null);
  };

  const isDateDisabled = (date) => {
    if (minDate && isBefore(date, minDate)) return true;
    if (maxDate && isAfter(date, maxDate)) return true;
    return false;
  };

  const isDateSelected = (date) => {
    return selectedDate && isSameDay(date, selectedDate);
  };

  const getDayClassName = (date) => {
    const events = getEventsForDate(date);
    const hasSlots = events.slots.length > 0;
    const hasBookings = events.bookings.length > 0;
    const hasAvailableSlots = events.slots.some(slot => 
      slot.status !== 'booked' && 
      slot.status !== 'completed' && 
      !slot.bookedBy
    );

    let classes = ['calendar-day'];
    
    if (!isSameMonth(date, currentDate)) classes.push('other-month');
    if (isToday(date)) classes.push('today');
    if (isWeekend(date)) classes.push('weekend');
    if (isDateSelected(date)) classes.push('selected');
    if (isDateDisabled(date)) classes.push('disabled');
    if (hasSlots) classes.push('has-slots');
    if (hasBookings) classes.push('has-bookings');
    if (hasAvailableSlots && highlightAvailable) classes.push('has-available');
    if (hoveredDate && isSameDay(date, hoveredDate)) classes.push('hovered');

    return classes.join(' ');
  };

  const getEventIndicators = (date) => {
    const events = getEventsForDate(date);
    const indicators = [];

    // Available slots indicator
    const availableSlots = events.slots.filter(slot => 
      slot.status !== 'booked' && 
      slot.status !== 'completed' && 
      !slot.bookedBy
    );
    
    if (availableSlots.length > 0) {
      indicators.push({
        type: 'available',
        count: availableSlots.length,
        color: '#10b981', // green
        label: `${availableSlots.length} available slot${availableSlots.length !== 1 ? 's' : ''}`
      });
    }

    // Booked slots indicator
    const bookedSlots = events.slots.filter(slot => 
      slot.status === 'booked' || slot.bookedBy
    );
    
    if (bookedSlots.length > 0) {
      indicators.push({
        type: 'booked',
        count: bookedSlots.length,
        color: '#3b82f6', // blue
        label: `${bookedSlots.length} booked slot${bookedSlots.length !== 1 ? 's' : ''}`
      });
    }

    // Bookings indicator
    if (events.bookings.length > 0) {
      const statusColors = {
        pending: '#f59e0b',
        confirmed: '#3b82f6',
        completed: '#10b981',
        cancelled: '#ef4444'
      };
      
      const groupedBookings = events.bookings.reduce((acc, booking) => {
        if (!acc[booking.status]) acc[booking.status] = 0;
        acc[booking.status]++;
        return acc;
      }, {});

      Object.entries(groupedBookings).forEach(([status, count]) => {
        indicators.push({
          type: `booking-${status}`,
          count,
          color: statusColors[status] || '#6b7280',
          label: `${count} ${status} booking${count !== 1 ? 's' : ''}`
        });
      });
    }

    return indicators;
  };

  const navigateMonth = (direction) => {
    const newDate = direction === 'next' ? addMonths(currentDate, 1) : subMonths(currentDate, 1);
    setCurrentDate(newDate);
    
    logInteraction(document.createElement('button'), 'calendar_month_navigated', { 
      direction, 
      newMonth: format(newDate, 'yyyy-MM') 
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    logInteraction(document.createElement('button'), 'calendar_today_clicked');
  };

  const renderTooltip = () => {
    if (!hoveredDate) return null;

    const events = getEventsForDate(hoveredDate);
    const indicators = getEventIndicators(hoveredDate);

    if (indicators.length === 0) return null;

    return (
      <div 
        className="calendar-tooltip"
        style={{
          position: 'fixed',
          left: tooltipPosition.x,
          top: tooltipPosition.y,
          transform: 'translateX(-50%) translateY(-100%)',
          zIndex: 1000,
          pointerEvents: 'none'
        }}
      >
        <div className="tooltip-content">
          <div className="tooltip-date">
            {format(hoveredDate, 'EEEE, MMMM d, yyyy')}
          </div>
          <div className="tooltip-events">
            {indicators.map((indicator, index) => (
              <div key={index} className="tooltip-event">
                <div 
                  className="event-indicator"
                  style={{ backgroundColor: indicator.color }}
                />
                <span className="event-label">{indicator.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderCalendarDay = (date) => {
    const events = getEventsForDate(date);
    const indicators = getEventIndicators(date);
    const dayNumber = format(date, 'd');

    return (
      <div
        key={date.toISOString()}
        className={getDayClassName(date)}
        onClick={() => handleDateClick(date)}
        onMouseEnter={(e) => handleMouseEnter(e, date)}
        onMouseLeave={handleMouseLeave}
        role="button"
        tabIndex={isDateDisabled(date) ? -1 : 0}
        aria-label={`${format(date, 'EEEE, MMMM d, yyyy')}${indicators.length > 0 ? `. ${indicators.map(i => i.label).join(', ')}` : ''}`}
      >
        <div className="day-number">{dayNumber}</div>
        
        {/* Event indicators */}
        {indicators.length > 0 && (
          <div className="event-indicators">
            {indicators.slice(0, 3).map((indicator, index) => (
              <div
                key={index}
                className={`event-dot ${indicator.type}`}
                style={{ backgroundColor: indicator.color }}
                title={indicator.label}
              />
            ))}
            {indicators.length > 3 && (
              <div className="event-more">
                +{indicators.length - 3}
              </div>
            )}
          </div>
        )}

        {/* Quick access to slots/bookings */}
        {variant === 'full' && events.slots.length > 0 && (
          <div className="day-events">
            {events.slots.slice(0, 2).map((slot, index) => (
              <div
                key={slot._id}
                className={`event-item slot ${slot.status || 'available'}`}
                onClick={(e) => handleSlotClick(e, slot)}
                title={`${format(parseISO(slot.dateTime), 'h:mm a')} - ${slot.title}`}
              >
                <span className="event-time">
                  {format(parseISO(slot.dateTime), 'h:mm a')}
                </span>
                <span className="event-title">{slot.title}</span>
              </div>
            ))}
            {events.slots.length > 2 && (
              <div className="event-more-text">
                +{events.slots.length - 2} more
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className={`interactive-calendar ${variant} ${className}`}>
      {loading && (
        <div className="calendar-loading">
          <Loading size="large" text="Loading calendar..." />
        </div>
      )}

      {/* Calendar Header */}
      <div className="calendar-header">
        <div className="header-controls">
          <Button
            variant="outline"
            size="small"
            onClick={() => navigateMonth('prev')}
            disabled={loading}
            icon={
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd"/>
              </svg>
            }
          />
          
          <h2 className="current-month">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
          
          <Button
            variant="outline"
            size="small"
            onClick={() => navigateMonth('next')}
            disabled={loading}
            icon={
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"/>
              </svg>
            }
          />
        </div>

        <div className="header-actions">
          <Button
            variant="outline"
            size="small"
            onClick={goToToday}
            disabled={loading}
          >
            Today
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="calendar-grid">
        {/* Weekday Headers */}
        <div className="weekday-headers">
          {weekdays.map(day => (
            <div key={day} className="weekday-header">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="calendar-days">
          {calendarDays.map(renderCalendarDay)}
        </div>
      </div>

      {/* Legend */}
      <div className="calendar-legend">
        <div className="legend-item">
          <div className="legend-dot available" />
          <span>Available Slots</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot booked" />
          <span>Booked Slots</span>
        </div>
        {showBookings && (
          <>
            <div className="legend-item">
              <div className="legend-dot booking-confirmed" />
              <span>Confirmed</span>
            </div>
            <div className="legend-item">
              <div className="legend-dot booking-pending" />
              <span>Pending</span>
            </div>
          </>
        )}
      </div>

      {/* Tooltip */}
      {renderTooltip()}

      {/* Styles */}
      <style jsx>{`
        .interactive-calendar {
          background: white;
          border-radius: var(--border-radius-xl);
          box-shadow: var(--shadow-soft);
          border: 1px solid var(--border-color);
          overflow: hidden;
          position: relative;
        }

        .calendar-loading {
          position: absolute;
          inset: 0;
          background: rgba(255, 255, 255, 0.9);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
        }

        .calendar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--spacing-lg);
          background: var(--background-secondary);
          border-bottom: 1px solid var(--border-color);
        }

        .header-controls {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
        }

        .current-month {
          font-size: var(--text-xl);
          font-weight: var(--weight-bold);
          color: var(--text-primary);
          margin: 0;
          min-width: 200px;
          text-align: center;
        }

        .header-actions {
          display: flex;
          gap: var(--spacing-sm);
        }

        .calendar-grid {
          padding: var(--spacing-md);
        }

        .weekday-headers {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 1px;
          margin-bottom: var(--spacing-sm);
        }

        .weekday-header {
          padding: var(--spacing-sm);
          text-align: center;
          font-size: var(--text-sm);
          font-weight: var(--weight-semibold);
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .calendar-days {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 1px;
          background: var(--border-color);
          border-radius: var(--border-radius-sm);
          overflow: hidden;
        }

        .calendar-day {
          min-height: 80px;
          background: white;
          padding: var(--spacing-xs);
          cursor: pointer;
          transition: all var(--transition-fast) ease;
          position: relative;
          display: flex;
          flex-direction: column;
          border: 2px solid transparent;
        }

        .calendar-day:hover {
          background: var(--background-secondary);
        }

        .calendar-day.other-month {
          color: var(--text-tertiary);
          background: var(--background-tertiary);
        }

        .calendar-day.today {
          background: rgba(99, 102, 241, 0.1);
          border-color: var(--primary-color);
        }

        .calendar-day.selected {
          background: var(--primary-color);
          color: white;
        }

        .calendar-day.disabled {
          opacity: 0.5;
          cursor: not-allowed;
          pointer-events: none;
        }

        .calendar-day.has-available {
          border-left: 4px solid var(--success-color);
        }

        .calendar-day.has-bookings {
          border-right: 4px solid var(--info-color);
        }

        .day-number {
          font-size: var(--text-sm);
          font-weight: var(--weight-semibold);
          margin-bottom: var(--spacing-xs);
        }

        .event-indicators {
          display: flex;
          gap: 2px;
          margin-bottom: var(--spacing-xs);
          flex-wrap: wrap;
        }

        .event-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .event-more {
          font-size: 10px;
          color: var(--text-tertiary);
          font-weight: var(--weight-medium);
        }

        .day-events {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 1px;
        }

        .event-item {
          background: rgba(99, 102, 241, 0.1);
          border-radius: 2px;
          padding: 1px 3px;
          font-size: 10px;
          line-height: 1.2;
          cursor: pointer;
          transition: background var(--transition-fast) ease;
        }

        .event-item:hover {
          background: rgba(99, 102, 241, 0.2);
        }

        .event-item.available {
          background: rgba(16, 185, 129, 0.1);
        }

        .event-item.booked {
          background: rgba(59, 130, 246, 0.1);
        }

        .event-time {
          font-weight: var(--weight-semibold);
          display: block;
        }

        .event-title {
          color: var(--text-secondary);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .event-more-text {
          font-size: 9px;
          color: var(--text-tertiary);
          text-align: center;
          margin-top: 1px;
        }

        .calendar-legend {
          display: flex;
          justify-content: center;
          gap: var(--spacing-lg);
          padding: var(--spacing-md);
          background: var(--background-secondary);
          border-top: 1px solid var(--border-color);
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
          font-size: var(--text-xs);
          color: var(--text-secondary);
        }

        .legend-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .legend-dot.available {
          background: var(--success-color);
        }

        .legend-dot.booked {
          background: var(--info-color);
        }

        .legend-dot.booking-confirmed {
          background: var(--info-color);
        }

        .legend-dot.booking-pending {
          background: var(--warning-color);
        }

        .calendar-tooltip {
          background: var(--gray-900);
          color: white;
          border-radius: var(--border-radius-lg);
          box-shadow: var(--shadow-strong);
          max-width: 250px;
        }

        .tooltip-content {
          padding: var(--spacing-sm);
        }

        .tooltip-date {
          font-size: var(--text-sm);
          font-weight: var(--weight-semibold);
          margin-bottom: var(--spacing-xs);
        }

        .tooltip-events {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-xs);
        }

        .tooltip-event {
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
        }

        .tooltip-event .event-indicator {
          width: 6px;
          height: 6px;
          border-radius: 50%;
        }

        .event-label {
          font-size: var(--text-xs);
        }

        /* Compact variant */
        .interactive-calendar.compact .calendar-day {
          min-height: 40px;
        }

        .interactive-calendar.compact .day-events {
          display: none;
        }

        /* Mini variant */
        .interactive-calendar.mini .calendar-day {
          min-height: 30px;
          padding: 2px;
        }

        .interactive-calendar.mini .day-number {
          font-size: 11px;
        }

        .interactive-calendar.mini .event-indicators {
          margin: 0;
        }

        .interactive-calendar.mini .day-events {
          display: none;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .calendar-header {
            padding: var(--spacing-md);
          }

          .current-month {
            font-size: var(--text-lg);
            min-width: 150px;
          }

          .calendar-day {
            min-height: 60px;
          }

          .calendar-legend {
            flex-wrap: wrap;
            gap: var(--spacing-sm);
          }
        }
      `}</style>
    </div>
  );
};

export default InteractiveCalendar;