import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import {
  matchesApi,
  type Match,
  type CreateMatchRequest,
  type MatchTimeFilter,
  type MatchFilters,
} from '../api/matches';
import { groupsApi, type GroupInfo } from '../api/groups';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';

const TIME_FILTER_OPTIONS: { value: MatchTimeFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'past', label: 'Past' },
  { value: 'this_week', label: 'This Week' },
  { value: 'next_week', label: 'Next Week' },
  { value: 'this_month', label: 'This Month' },
];

export function MatchesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [groups, setGroups] = useState<GroupInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterGroupId, setFilterGroupId] = useState<string>('');
  const [timeFilter, setTimeFilter] = useState<MatchTimeFilter>('all');
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<CreateMatchRequest>({
    groupId: '',
    startTime: '',
    endTime: '',
    location: '',
    opponent: '',
    isHome: true,
  });

  const canCreate = user?.role === UserRole.ADMIN || user?.role === UserRole.COACH;

  const formatDateForApi = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  const buildFilters = useCallback((): MatchFilters => {
    const filters: MatchFilters = {};
    if (timeFilter !== 'all') {
      filters.timeFilter = timeFilter;
    }
    if (dateFrom) filters.dateFrom = formatDateForApi(dateFrom);
    if (dateTo) filters.dateTo = formatDateForApi(dateTo);
    return filters;
  }, [timeFilter, dateFrom, dateTo]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const isAdmin = user?.role === UserRole.ADMIN;
      const filters = buildFilters();
      const [matchesData, groupsData] = await Promise.all([
        isAdmin ? matchesApi.getAll(filters) : matchesApi.getMy(filters),
        isAdmin ? groupsApi.getAll() : groupsApi.getMy(),
      ]);
      setMatches(matchesData);
      setGroups(groupsData);
    } catch {
      setError('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }, [user, buildFilters]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, loadData]);

  const filteredMatches = filterGroupId
    ? matches.filter((m) => m.group.id === filterGroupId)
    : matches;

  const sortedMatches = [...filteredMatches].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  const openCreateModal = () => {
    const now = new Date();
    const startTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    startTime.setMinutes(0, 0, 0);
    const endTime = new Date(startTime.getTime() + 90 * 60 * 1000);

    setFormData({
      groupId: groups[0]?.id || '',
      startTime: formatDateTimeLocal(startTime),
      endTime: formatDateTimeLocal(endTime),
      location: '',
      opponent: '',
      isHome: true,
    });
    setIsModalOpen(true);
    setError('');
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setError('');
  };

  const handleCreate = async () => {
    if (!formData.groupId) {
      setError('Please select a group');
      return;
    }
    if (!formData.startTime || !formData.endTime) {
      setError('Please set start and end time');
      return;
    }
    if (!formData.location.trim()) {
      setError('Please enter a location');
      return;
    }
    if (!formData.opponent.trim()) {
      setError('Please enter opponent name');
      return;
    }

    const start = new Date(formData.startTime);
    const end = new Date(formData.endTime);
    if (end <= start) {
      setError('End time must be after start time');
      return;
    }

    try {
      const newMatch = await matchesApi.create({
        ...formData,
        startTime: new Date(formData.startTime).toISOString(),
        endTime: new Date(formData.endTime).toISOString(),
      });
      setMatches((prev) => [...prev, newMatch]);
      closeModal();
    } catch {
      setError('Failed to create match');
    }
  };

  const formatDateTimeLocal = (date: Date) => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isUpcoming = (dateStr: string) => new Date(dateStr) > new Date();

  const formatScore = (match: Match) => {
    if (match.homeGoals === null || match.awayGoals === null) {
      return null;
    }
    return match.isHome
      ? `${match.homeGoals} - ${match.awayGoals}`
      : `${match.awayGoals} - ${match.homeGoals}`;
  };

  const getMatchResult = (match: Match): 'win' | 'draw' | 'loss' | null => {
    if (match.homeGoals === null || match.awayGoals === null) return null;
    const ourGoals = match.isHome ? match.homeGoals : match.awayGoals;
    const theirGoals = match.isHome ? match.awayGoals : match.homeGoals;
    if (ourGoals > theirGoals) return 'win';
    if (ourGoals < theirGoals) return 'loss';
    return 'draw';
  };

  const resultColors = {
    win: 'bg-green-100 text-green-700',
    draw: 'bg-yellow-100 text-yellow-700',
    loss: 'bg-red-100 text-red-700',
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">Matches</h1>
          <div className="flex gap-3">
            {canCreate && (
              <button
                onClick={openCreateModal}
                className="text-green-600 hover:text-green-700 font-medium"
              >
                + Schedule Match
              </button>
            )}
            <button
              onClick={() => navigate('/dashboard')}
              className="text-gray-600 hover:text-gray-900"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Filters */}
          <div className="p-4 border-b border-gray-200 space-y-4">
            {/* Quick time filters */}
            <div className="flex flex-wrap gap-2">
              {TIME_FILTER_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setTimeFilter(option.value);
                    setDateFrom(null);
                    setDateTo(null);
                  }}
                  className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
                    timeFilter === option.value && !dateFrom && !dateTo
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {/* Custom date range and group filter */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">From:</label>
                <DatePicker
                  selected={dateFrom}
                  onChange={(date: Date | null) => {
                    setDateFrom(date);
                    if (date) setTimeFilter('all');
                  }}
                  selectsStart
                  startDate={dateFrom}
                  endDate={dateTo}
                  maxDate={dateTo || undefined}
                  dateFormat="MMM d, yyyy"
                  placeholderText="Select date"
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 w-36"
                  calendarClassName="!font-sans"
                  showPopperArrow={false}
                  isClearable
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">To:</label>
                <DatePicker
                  selected={dateTo}
                  onChange={(date: Date | null) => {
                    setDateTo(date);
                    if (date) setTimeFilter('all');
                  }}
                  selectsEnd
                  startDate={dateFrom}
                  endDate={dateTo}
                  minDate={dateFrom || undefined}
                  dateFormat="MMM d, yyyy"
                  placeholderText="Select date"
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 w-36"
                  calendarClassName="!font-sans"
                  showPopperArrow={false}
                  isClearable
                />
              </div>
              {(dateFrom || dateTo) && (
                <button
                  onClick={() => {
                    setDateFrom(null);
                    setDateTo(null);
                  }}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Clear dates
                </button>
              )}
              <div className="flex items-center gap-2 ml-auto">
                <label className="text-sm font-medium text-gray-700">Group:</label>
                <select
                  value={filterGroupId}
                  onChange={(e) => setFilterGroupId(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">All groups</option>
                  {groups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {error && !isModalOpen && (
            <div className="m-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            </div>
          ) : sortedMatches.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              {matches.length === 0
                ? 'No matches scheduled yet'
                : 'No matches for selected group'}
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {sortedMatches.map((match) => {
                const score = formatScore(match);
                const result = getMatchResult(match);
                return (
                  <button
                    key={match.id}
                    onClick={() => navigate(`/matches/${match.id}`)}
                    className={`w-full text-left p-4 hover:bg-gray-50 cursor-pointer ${
                      !isUpcoming(match.startTime) && !score ? 'opacity-60' : ''
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 bg-blue-100 rounded-lg flex flex-col items-center justify-center">
                        <span className="text-xs text-blue-600 uppercase">
                          {new Date(match.startTime).toLocaleDateString('en-US', {
                            weekday: 'short',
                          })}
                        </span>
                        <span className="text-xl font-bold text-blue-700">
                          {new Date(match.startTime).getDate()}
                        </span>
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-700 rounded-full">
                            {match.group.name}
                          </span>
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              match.isHome
                                ? 'bg-green-100 text-green-700'
                                : 'bg-orange-100 text-orange-700'
                            }`}
                          >
                            {match.isHome ? 'Home' : 'Away'}
                          </span>
                          {result && (
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full ${resultColors[result]}`}
                            >
                              {result.charAt(0).toUpperCase() + result.slice(1)}
                            </span>
                          )}
                          {isUpcoming(match.startTime) && !score && (
                            <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                              Upcoming
                            </span>
                          )}
                        </div>

                        <div className="mt-1 flex items-center gap-3">
                          <span className="font-semibold text-gray-900">
                            vs {match.opponent}
                          </span>
                          {score && (
                            <span className="text-lg font-bold text-gray-800">{score}</span>
                          )}
                        </div>

                        <p className="mt-1 text-sm text-gray-600">
                          <span className="font-medium">
                            {formatTime(match.startTime)} - {formatTime(match.endTime)}
                          </span>
                          <span className="text-gray-500 ml-2">
                            {formatDateTime(match.startTime).split(',')[0]}
                          </span>
                        </p>

                        <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                            </svg>
                            <span>{match.location}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-gray-400">
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Schedule Match</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Group *</label>
                <select
                  value={formData.groupId}
                  onChange={(e) => setFormData((prev) => ({ ...prev, groupId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">Select group</option>
                  {groups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Opponent *
                </label>
                <input
                  type="text"
                  value={formData.opponent}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, opponent: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="e.g., FC Dynamo U12"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Home/Away *
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="isHome"
                      checked={formData.isHome}
                      onChange={() => setFormData((prev) => ({ ...prev, isHome: true }))}
                      className="w-4 h-4 text-green-600 focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700">Home</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="isHome"
                      checked={!formData.isHome}
                      onChange={() => setFormData((prev) => ({ ...prev, isHome: false }))}
                      className="w-4 h-4 text-green-600 focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700">Away</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Time *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.startTime}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, startTime: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Time *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.endTime}
                    onChange={(e) => setFormData((prev) => ({ ...prev, endTime: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="e.g., Stadium A"
                />
              </div>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
