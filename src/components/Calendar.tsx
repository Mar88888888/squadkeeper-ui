import { useMemo } from 'react';
import { getLocaleCode, useI18n } from '../contexts/I18nContext';

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
  onDayClick?: (date: Date) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  selectedDate?: Date | null;
}

function getWeekdayLabels(locale: string): string[] {
  const start = new Date(Date.UTC(2021, 10, 1)); // Monday, Nov 1 2021
  const formatter = new Intl.DateTimeFormat(locale, { weekday: 'short' });
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setUTCDate(start.getUTCDate() + index);
    return formatter.format(date);
  });
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

function formatTime(dateStr: string, locale: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', hour12: false });
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
  onDayClick,
  onPrevMonth,
  onNextMonth,
  onToday,
  selectedDate,
}: CalendarProps) {
  const { t, locale } = useI18n();
  const localeCode = getLocaleCode(locale);
  const today = new Date();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const prevMonthDays = getDaysInMonth(year, month - 1);
  const weekdayLabels = useMemo(() => getWeekdayLabels(localeCode), [localeCode]);

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

  // Build day cells
  const days: { day: number; isCurrentMonth: boolean }[] = [];

  // Previous month days
  for (let i = firstDay - 1; i >= 0; i--) {
    days.push({ day: prevMonthDays - i, isCurrentMonth: false });
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({ day: i, isCurrentMonth: true });
  }

  // Next month days to fill the grid
  const remainingDays = 42 - days.length; // 6 rows * 7 days
  for (let i = 1; i <= remainingDays; i++) {
    days.push({ day: i, isCurrentMonth: false });
  }

  const isToday = (day: number) => {
    return isSameDay(new Date(year, month, day), today);
  };

  const isSelected = (day: number) => {
    return selectedDate && isSameDay(new Date(year, month, day), selectedDate);
  };

  const handleDayClick = (day: number, isCurrentMonth: boolean) => {
    if (isCurrentMonth && onDayClick) {
      onDayClick(new Date(year, month, day));
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
      {/* Calendar Header */}
      <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onPrevMonth}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            aria-label={t('calendar.controls.prevMonth')}
          >
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            {new Date(year, month, 1).toLocaleDateString(localeCode, { month: 'long', year: 'numeric' })}
          </h3>
          <button
            onClick={onNextMonth}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            aria-label={t('calendar.controls.nextMonth')}
          >
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        <button
          onClick={onToday}
          className="px-4 py-2 text-sm font-medium text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors"
        >
          {t('calendar.controls.today')}
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="p-4">
        {/* Week days header */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekdayLabels.map((day, index) => (
            <div
              key={day}
              className={`text-center text-sm font-semibold py-3 ${
                index >= 5 ? 'text-red-400 dark:text-red-500' : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((dayInfo, index) => {
            const { day, isCurrentMonth } = dayInfo;
            const dayEvents = isCurrentMonth ? eventsByDay.get(day) || [] : [];
            const isTodayCell = isCurrentMonth && isToday(day);
            const isSelectedCell = isCurrentMonth && isSelected(day);

            return (
              <div
                key={index}
                onClick={() => handleDayClick(day, isCurrentMonth)}
                className={`min-h-[120px] p-2 rounded-lg cursor-pointer transition-all ${
                  !isCurrentMonth
                    ? 'bg-gray-50 dark:bg-gray-800/50 text-gray-400 dark:text-gray-600'
                    : isTodayCell
                      ? 'bg-green-50 dark:bg-green-900/20 border-2 border-green-500'
                      : isSelectedCell
                        ? 'bg-green-50 dark:bg-green-900/20 ring-2 ring-green-500'
                        : 'bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 hover:border-green-200 dark:hover:border-green-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-medium ${
                    isTodayCell
                      ? 'text-green-600 dark:text-green-400 font-bold'
                      : isCurrentMonth
                        ? 'text-gray-900 dark:text-white'
                        : 'text-gray-400 dark:text-gray-600'
                  }`}>
                    {day}
                  </span>
                  {dayEvents.length > 0 && (
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  )}
                </div>
                {isCurrentMonth && dayEvents.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {dayEvents.slice(0, 2).map((event) => (
                      <button
                        key={event.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEventClick(event);
                        }}
                        className={`w-full text-left p-1.5 rounded text-xs truncate transition-colors ${
                          event.type === 'training'
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
                            : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50'
                        }`}
                      >
                        {formatTime(event.startTime, localeCode)} {event.title}
                      </button>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 pl-1">
                        {t('calendar.more', { count: dayEvents.length - 2 })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
