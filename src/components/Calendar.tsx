import { useMemo } from 'react';

export interface CalendarEvent {
  id: string;
  type: 'training' | 'match';
  title: string;
  startTime: string;
  endTime: string;
  group: string;
}

interface CalendarProps {
  year: number;
  month: number;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
}

function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

export function Calendar({
  year,
  month,
  events,
  onEventClick,
  onPrevMonth,
  onNextMonth,
  onToday,
}: CalendarProps) {
  const today = new Date();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

  const eventsByDay = useMemo(() => {
    const map = new Map<number, CalendarEvent[]>();
    events.forEach((event) => {
      const eventDate = new Date(event.startTime);
      if (eventDate.getFullYear() === year && eventDate.getMonth() === month) {
        const day = eventDate.getDate();
        if (!map.has(day)) {
          map.set(day, []);
        }
        map.get(day)!.push(event);
      }
    });
    map.forEach((dayEvents) => {
      dayEvents.sort((a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      );
    });
    return map;
  }, [events, year, month]);

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const isToday = (day: number) => {
    return isSameDay(new Date(year, month, day), today);
  };

  const isWeekend = (index: number) => {
    return index % 7 === 5 || index % 7 === 6;
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-500 px-5 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-white">
              {MONTHS[month]} {year}
            </h2>
            {!isCurrentMonth && (
              <button
                onClick={onToday}
                className="px-2.5 py-1 text-xs font-medium text-green-700 bg-white/90 hover:bg-white rounded-md transition-all shadow-sm"
              >
                Today
              </button>
            )}
          </div>
          <div className="flex items-center gap-4">
            {/* Legend */}
            <div className="hidden sm:flex gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-300"></span>
                <span className="text-xs text-white/80">Training</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-300"></span>
                <span className="text-xs text-white/80">Match</span>
              </div>
            </div>
            <div className="flex gap-0.5">
              <button
                onClick={onPrevMonth}
                className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-all"
                aria-label="Previous month"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={onNextMonth}
                className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-all"
                aria-label="Next month"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-100">
        {WEEKDAYS.map((day, index) => (
          <div
            key={day}
            className={`py-2 text-center text-xs font-semibold uppercase tracking-wider ${
              index >= 5 ? 'text-gray-400' : 'text-gray-500'
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {days.map((day, index) => {
          const dayEvents = day ? eventsByDay.get(day) || [] : [];
          const hasMore = dayEvents.length > 2;
          const displayEvents = hasMore ? dayEvents.slice(0, 2) : dayEvents;
          const hasEvents = dayEvents.length > 0;

          return (
            <div
              key={index}
              className={`min-h-[90px] border-b border-r border-gray-100 p-1.5 transition-colors ${
                day === null
                  ? 'bg-gray-50/50'
                  : isWeekend(index)
                    ? 'bg-gray-50/30'
                    : 'bg-white hover:bg-gray-50/50'
              } ${index % 7 === 6 ? 'border-r-0' : ''}`}
            >
              {day !== null && (
                <>
                  <div className="flex items-center justify-between mb-1">
                    <div
                      className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full transition-all ${
                        isToday(day)
                          ? 'bg-green-600 text-white shadow-md shadow-green-200'
                          : hasEvents
                            ? 'text-gray-900'
                            : 'text-gray-400'
                      }`}
                    >
                      {day}
                    </div>
                    {hasEvents && (
                      <div className="flex gap-0.5">
                        {dayEvents.some(e => e.type === 'training') && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        )}
                        {dayEvents.some(e => e.type === 'match') && (
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="space-y-0.5">
                    {displayEvents.map((event) => (
                      <button
                        key={event.id}
                        onClick={() => onEventClick(event)}
                        className={`w-full text-left px-1.5 py-0.5 rounded text-[11px] font-medium truncate transition-all hover:opacity-90 ${
                          event.type === 'training'
                            ? 'bg-emerald-500 text-white'
                            : 'bg-blue-500 text-white'
                        }`}
                        title={`${event.title} - ${event.group} (${formatTime(event.startTime)})`}
                      >
                        {formatTime(event.startTime)} {event.title}
                      </button>
                    ))}
                    {hasMore && (
                      <div className="text-[10px] font-medium text-gray-400 px-1.5">
                        +{dayEvents.length - 2} more
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
