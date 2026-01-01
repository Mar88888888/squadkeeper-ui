import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { statsApi, type PlayerStats, type StatsPeriod } from '../api/stats';
import { evaluationsApi, type RatingStats } from '../api/evaluations';
import { PlayerStatsView } from '../components/PlayerStatsView';

const PERIOD_OPTIONS: { value: StatsPeriod; label: string }[] = [
  { value: 'all_time', label: 'All Time' },
  { value: 'this_season', label: 'This Season' },
  { value: 'this_year', label: 'This Year' },
  { value: 'this_month', label: 'This Month' },
];

export function PlayerStatsPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [ratingStats, setRatingStats] = useState<RatingStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState<StatsPeriod>('all_time');

  useEffect(() => {
    const loadStats = async () => {
      if (!id) return;
      setIsLoading(true);
      setError('');
      try {
        const [statsData, ratingsData] = await Promise.all([
          statsApi.getPlayerStats(id, period),
          evaluationsApi.getPlayerRatingStats(id, period).catch(() => null),
        ]);
        setStats(statsData);
        setRatingStats(ratingsData);
      } catch {
        setError('Failed to load player statistics');
      } finally {
        setIsLoading(false);
      }
    };

    loadStats();
  }, [id, period]);

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">Player Statistics</h1>
          <button
            onClick={() => navigate(-1)}
            className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Period Filter */}
        <div className="mb-6 flex justify-center">
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
        ) : stats ? (
          <PlayerStatsView stats={stats} ratingStats={ratingStats} period={period} />
        ) : null}
      </main>
    </div>
  );
}
