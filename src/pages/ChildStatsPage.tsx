import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { statsApi, type ChildrenStats, type StatsPeriod } from '../api/stats';
import { evaluationsApi, type RatingStats } from '../api/evaluations';
import { PlayerStatsView } from '../components/PlayerStatsView';

const PERIOD_OPTIONS: { value: StatsPeriod; label: string }[] = [
  { value: 'all_time', label: 'All Time' },
  { value: 'this_season', label: 'This Season' },
  { value: 'this_year', label: 'This Year' },
  { value: 'this_month', label: 'This Month' },
];

export function ChildStatsPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<ChildrenStats | null>(null);
  const [ratingStats, setRatingStats] = useState<RatingStats | null>(null);
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
        const childId = selectedChildId || (result.children.length > 0 ? result.children[0].id : '');
        if (!selectedChildId && result.children.length > 0) {
          setSelectedChildId(childId);
        }
        // Load rating stats for selected child
        if (childId) {
          const ratings = await evaluationsApi.getPlayerRatingStats(childId, period).catch(() => null);
          setRatingStats(ratings);
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
          <PlayerStatsView
            stats={stats}
            ratingStats={ratingStats}
            period={period}
            playerName={children.length > 1 ? getSelectedChildName() : undefined}
          />
        ) : null}
      </main>
    </div>
  );
}
