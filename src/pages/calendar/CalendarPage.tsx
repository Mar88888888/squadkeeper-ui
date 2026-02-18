import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, type CalendarEvent } from '../../components/Calendar';
import { trainingsApi, getTrainingEndTime, type Training } from '../../api/trainings';
import { matchesApi, type Match } from '../../api/matches';
import { groupsApi, type GroupInfo } from '../../api/groups';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types';
import { PageHeader, PageContent } from '../../components/layout';
import { Card, CardContent } from '../../components/ui';

// Icons
const TrainingIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/>
  </svg>
);

const MatchIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"/>
  </svg>
);

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function formatDateRelative(date: Date): string {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  }
  if (date.toDateString() === tomorrow.toDateString()) {
    return 'Tomorrow';
  }
  return WEEKDAYS[date.getDay()];
}

function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

export function CalendarPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [groups, setGroups] = useState<GroupInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterGroupId, setFilterGroupId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const isAdmin = user?.role === UserRole.ADMIN;
      const [trainingsData, matchesData, groupsData] = await Promise.all([
        isAdmin ? trainingsApi.getAll() : trainingsApi.getMy(),
        isAdmin ? matchesApi.getAll() : matchesApi.getMy(),
        isAdmin ? groupsApi.getAll() : groupsApi.getMy(),
      ]);
      setTrainings(trainingsData);
      setMatches(matchesData);
      setGroups(groupsData);
    } catch {
      setError('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, loadData]);

  const events: CalendarEvent[] = useMemo(() => {
    const filteredTrainings = filterGroupId
      ? trainings.filter((t) => t.group.id === filterGroupId)
      : trainings;

    const filteredMatches = filterGroupId
      ? matches.filter((m) => m.group.id === filterGroupId)
      : matches;

    const trainingEvents: CalendarEvent[] = filteredTrainings.map((t) => ({
      id: t.id,
      type: 'training' as const,
      title: t.topic || 'Training',
      startTime: t.startTime,
      endTime: getTrainingEndTime(t).toISOString(),
      group: t.group.name,
    }));

    const matchEvents: CalendarEvent[] = filteredMatches.map((m) => ({
      id: m.id,
      type: 'match' as const,
      title: m.isHome ? `vs ${m.opponent}` : `@ ${m.opponent}`,
      startTime: m.startTime,
      endTime: m.endTime,
      group: m.group.name,
    }));

    return [...trainingEvents, ...matchEvents];
  }, [trainings, matches, filterGroupId]);

  // Events for selected day
  const selectedDayEvents = useMemo(() => {
    if (!selectedDate) return [];
    return events
      .filter((event) => isSameDay(new Date(event.startTime), selectedDate))
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }, [events, selectedDate]);

  // Upcoming events (next 5)
  const upcomingEvents = useMemo(() => {
    const now = new Date();
    return events
      .filter((event) => new Date(event.startTime) >= now)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
      .slice(0, 5);
  }, [events]);

  const handleEventClick = (event: CalendarEvent) => {
    if (event.type === 'training') {
      navigate(`/trainings/${event.id}`);
    } else {
      navigate(`/matches/${event.id}`);
    }
  };

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
  };

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    setSelectedDate(today);
  };

  const formatSelectedDate = () => {
    if (!selectedDate) return '';
    return `${MONTHS[selectedDate.getMonth()]} ${selectedDate.getDate()}`;
  };

  const getSelectedDayOfWeek = () => {
    if (!selectedDate) return '';
    return WEEKDAYS[selectedDate.getDay()];
  };

  return (
    <>
      <PageHeader
        title="Calendar"
        subtitle="Trainings and matches"
        actions={
          <select
            value={filterGroupId}
            onChange={(e) => setFilterGroupId(e.target.value)}
            className="px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 text-gray-900 dark:text-white"
          >
            <option value="">All Groups</option>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
        }
      />

      <PageContent>
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl text-sm">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Calendar - 3 columns */}
            <div className="lg:col-span-3">
              <Calendar
                year={currentYear}
                month={currentMonth}
                events={events}
                onEventClick={handleEventClick}
                onDayClick={handleDayClick}
                onPrevMonth={handlePrevMonth}
                onNextMonth={handleNextMonth}
                onToday={handleToday}
                selectedDate={selectedDate}
              />
            </div>

            {/* Sidebar - 1 column */}
            <div className="space-y-6">
              {/* Selected Day */}
              <Card>
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {formatSelectedDate()}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {getSelectedDayOfWeek()}
                  </p>
                </div>
                <CardContent>
                  {selectedDayEvents.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                      No events on this day
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {selectedDayEvents.map((event) => (
                        <button
                          key={event.id}
                          onClick={() => handleEventClick(event)}
                          className={`block w-full text-left p-4 rounded-xl border transition-colors ${
                            event.type === 'training'
                              ? 'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-900/50 hover:bg-green-100 dark:hover:bg-green-900/30'
                              : 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-900/50 hover:bg-blue-100 dark:hover:bg-blue-900/30'
                          }`}
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              event.type === 'training'
                                ? 'bg-green-500 text-white'
                                : 'bg-blue-500 text-white'
                            }`}>
                              {event.type === 'training' ? <TrainingIcon /> : <MatchIcon />}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 dark:text-white">
                                {event.title}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {formatTime(event.startTime)} - {formatTime(event.endTime)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 text-xs font-medium rounded">
                              {event.group}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Legend */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Legend</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-green-500 rounded"></div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Trainings</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-blue-500 rounded"></div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Matches</span>
                  </div>
                </div>
              </Card>

              {/* Upcoming Events */}
              <Card>
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Upcoming Events
                  </h3>
                </div>
                <div className="p-4 space-y-3">
                  {upcomingEvents.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                      No upcoming events
                    </p>
                  ) : (
                    upcomingEvents.map((event) => (
                      <button
                        key={event.id}
                        onClick={() => handleEventClick(event)}
                        className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors w-full text-left"
                      >
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          event.type === 'training'
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                            : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                        }`}>
                          {event.type === 'training' ? <TrainingIcon /> : <MatchIcon />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {event.title}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {formatDateRelative(new Date(event.startTime))}, {formatTime(event.startTime)}
                          </p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </Card>

            </div>
          </div>
        )}
      </PageContent>
    </>
  );
}
