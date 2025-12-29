import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, type CalendarEvent } from '../components/Calendar';
import { trainingsApi, type Training } from '../api/trainings';
import { matchesApi, type Match } from '../api/matches';
import { groupsApi, type GroupInfo } from '../api/groups';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';

export function CalendarPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [groups, setGroups] = useState<GroupInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterGroupId, setFilterGroupId] = useState<string>('');

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
      endTime: t.endTime,
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

  const handleEventClick = (event: CalendarEvent) => {
    if (event.type === 'training') {
      navigate(`/trainings/${event.id}`);
    } else {
      navigate(`/matches/${event.id}`);
    }
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
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-gray-900">Calendar</h1>
            <div className="flex items-center gap-2">
              <select
                id="groupFilter"
                value={filterGroupId}
                onChange={(e) => setFilterGroupId(e.target.value)}
                className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="">All Groups</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="text-gray-600 hover:text-gray-900"
          >
            Back to Dashboard
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        ) : (
          <div className="space-y-4">
            <Calendar
              year={currentYear}
              month={currentMonth}
              events={events}
              onEventClick={handleEventClick}
              onPrevMonth={handlePrevMonth}
              onNextMonth={handleNextMonth}
              onToday={handleToday}
            />

            {/* Stats */}
            <div className="flex justify-center gap-6 text-sm text-gray-500">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                {events.filter((e) => e.type === 'training').length} trainings
              </span>
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                {events.filter((e) => e.type === 'match').length} matches
              </span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
