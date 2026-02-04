import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { statsApi, type PlayerStats, type StatsPeriod } from '../api/stats';
import { evaluationsApi, type RatingStats } from '../api/evaluations';
import { PlayerStatsView } from '../components/PlayerStatsView';

const PERIOD_OPTIONS: { value: StatsPeriod; label: string }[] = [
  { value: 'all_time', label: 'All Time' },
  { value: 'this_season', label: 'This Season' },
  { value: 'this_year', label: 'This Year' },
  { value: 'this_month', label: 'This Month' },
];

export function MyStatsPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [ratingStats, setRatingStats] = useState<RatingStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState<StatsPeriod>('all_time');

  useEffect(() => {
    const loadStats = async () => {
      setIsLoading(true);
      setError('');
      try {
        const [statsData, ratingsData] = await Promise.all([
          statsApi.getMyStats(period),
          evaluationsApi.getMyRatingStats(period).catch((error) => {
            console.error('Failed to load rating stats:', error);
            return null;
          }),
        ]);
        setStats(statsData);
        setRatingStats(ratingsData);
      } catch {
        setError('Failed to load statistics');
      } finally {
        setIsLoading(false);
      }
    };

    loadStats();
  }, [period]);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950">
      <header className="bg-white dark:bg-gray-900 shadow">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">My Statistics</h1>
          <button
            onClick={() => navigate('/dashboard')}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          >
            Back to Dashboard
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="mb-6 flex justify-center">
          <div className="inline-flex rounded-lg bg-white dark:bg-gray-900 shadow p-1">
            {PERIOD_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => setPeriod(option.value)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  period === option.value
                    ? 'bg-green-600 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
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
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-gray-700 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
            {error}
          </div>
        ) : stats ? (
          <PlayerStatsView stats={stats} ratingStats={ratingStats} period={period} />
        ) : null}
      </main>
    </div>
  );
}
