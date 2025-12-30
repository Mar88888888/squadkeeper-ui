import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { statsApi, type ChildrenStats, type StatsPeriod } from '../api/stats';

const PERIOD_OPTIONS: { value: StatsPeriod; label: string }[] = [
  { value: 'all_time', label: 'All Time' },
  { value: 'this_year', label: 'This Year' },
  { value: 'this_month', label: 'This Month' },
];

export function ChildStatsPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<ChildrenStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState<StatsPeriod>('all_time');
  const [selectedChildId, setSelectedChildId] = useState<string>('');

  useEffect(() => {
    const loadStats = async () => {
      setIsLoading(true);
      setError('');
      try {
        const result = await statsApi.getChildrenStats(period, selectedChildId || undefined);
        setData(result);
        // Set selected child if not set yet
        if (!selectedChildId && result.children.length > 0) {
          setSelectedChildId(result.children[0].id);
        }
      } catch {
        setError('Failed to load statistics');
      } finally {
        setIsLoading(false);
      }
    };

    loadStats();
  }, [period, selectedChildId]);

  const stats = data?.stats;
  const children = data?.children || [];

  const getSelectedChildName = () => {
    const child = children.find((c) => c.id === selectedChildId);
    return child ? `${child.firstName} ${child.lastName}` : '';
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">Child Statistics</h1>
          <button
            onClick={() => navigate('/dashboard')}
            className="text-gray-600 hover:text-gray-900"
          >
            Back to Dashboard
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-center items-center">
          {/* Child Switcher */}
          {children.length > 1 && (
            <select
              value={selectedChildId}
              onChange={(e) => setSelectedChildId(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 bg-white shadow focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              {children.map((child) => (
                <option key={child.id} value={child.id}>
                  {child.firstName} {child.lastName}
                </option>
              ))}
            </select>
          )}

          {/* Period Filter */}
          <div className="inline-flex rounded-lg bg-white shadow p-1">
            {PERIOD_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => setPeriod(option.value)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  period === option.value
                    ? 'bg-green-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        ) : children.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <p className="text-gray-500">No children linked to your account</p>
          </div>
        ) : stats ? (
          <div className="space-y-6">
            {/* Player Name */}
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900">
                {children.length > 1 ? getSelectedChildName() : stats.playerName}
              </h2>
              <p className="text-gray-500">
                {period === 'all_time'
                  ? 'All Time Statistics'
                  : period === 'this_year'
                    ? 'This Year'
                    : 'This Month'}
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Matches Played */}
              <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </div>
                <p className="text-4xl font-bold text-gray-900">{stats.matchesPlayed}</p>
                <p className="text-gray-500 mt-2">Matches Played</p>
              </div>

              {/* Goals */}
              <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <p className="text-4xl font-bold text-gray-900">{stats.goals}</p>
                <p className="text-gray-500 mt-2">Goals Scored</p>
              </div>

              {/* Assists */}
              <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-purple-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11"
                    />
                  </svg>
                </div>
                <p className="text-4xl font-bold text-gray-900">{stats.assists}</p>
                <p className="text-gray-500 mt-2">Assists</p>
              </div>
            </div>

            {/* Goal Contributions */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Goal Contributions</h3>
              <div className="flex items-center gap-4">
                <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                  {stats.goals + stats.assists > 0 && (
                    <div className="flex h-full">
                      <div
                        className="bg-green-500 h-full"
                        style={{
                          width: `${(stats.goals / (stats.goals + stats.assists)) * 100}%`,
                        }}
                      />
                      <div
                        className="bg-purple-500 h-full"
                        style={{
                          width: `${(stats.assists / (stats.goals + stats.assists)) * 100}%`,
                        }}
                      />
                    </div>
                  )}
                </div>
                <span className="text-2xl font-bold text-gray-900">
                  {stats.goals + stats.assists}
                </span>
              </div>
              <div className="flex justify-between mt-2 text-sm">
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-green-500"></span>
                  Goals: {stats.goals}
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-purple-500"></span>
                  Assists: {stats.assists}
                </span>
              </div>
            </div>

            {/* Per Match Stats */}
            {stats.matchesPlayed > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Per Match Averages</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-xl">
                    <p className="text-2xl font-bold text-green-600">
                      {(stats.goals / stats.matchesPlayed).toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-500">Goals per match</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-xl">
                    <p className="text-2xl font-bold text-purple-600">
                      {(stats.assists / stats.matchesPlayed).toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-500">Assists per match</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </main>
    </div>
  );
}
