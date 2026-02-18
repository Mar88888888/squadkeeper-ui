import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { statsApi, type PlayerStats, type StatsPeriod } from '../../api/stats';
import { evaluationsApi, type RatingStats } from '../../api/evaluations';
import { PageHeader } from '../../components/layout/PageHeader';
import { PageContent } from '../../components/layout/PageContent';
import { PlayerStatsView } from '../../components/PlayerStatsView';

const PERIOD_OPTIONS: { value: StatsPeriod; label: string }[] = [
  { value: 'all_time', label: 'All Time' },
  { value: 'this_season', label: 'This Season' },
  { value: 'this_year', label: 'This Year' },
  { value: 'this_month', label: 'This Month' },
];

export function PlayerStatsPage() {
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
          evaluationsApi.getPlayerRatingStats(id, period).catch((error) => {
            console.error('Failed to load rating stats:', error);
            return null;
          }),
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
    <>
      <PageHeader
        title={stats?.playerName || 'Player Statistics'}
        subtitle="Individual performance analytics"
        backTo="/stats/team"
        actions={
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as StatsPeriod)}
            className="px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 dark:text-white"
          >
            {PERIOD_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        }
      />

      <PageContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl">
            {error}
          </div>
        ) : stats ? (
          <PlayerStatsView stats={stats} ratingStats={ratingStats} period={period} />
        ) : null}
      </PageContent>
    </>
  );
}
