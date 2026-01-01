import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { PlayerStats, StatsPeriod } from '../api/stats';
import type { RatingStats } from '../api/evaluations';

const PERIOD_LABELS: Record<StatsPeriod, string> = {
  all_time: 'All Time Statistics',
  this_season: 'This Season',
  this_year: 'This Year',
  this_month: 'This Month',
};

interface PlayerStatsViewProps {
  stats: PlayerStats;
  ratingStats: RatingStats | null;
  period: StatsPeriod;
  playerName?: string; // Override the name from stats if needed
}

export function PlayerStatsView({ stats, ratingStats, period, playerName }: PlayerStatsViewProps) {
  const displayName = playerName || stats.playerName;

  const formatChartData = (history: RatingStats['history']) => {
    return history.map((point) => ({
      date: new Date(point.date).toLocaleDateString('uk-UA', {
        day: '2-digit',
        month: '2-digit',
      }),
      fullDate: new Date(point.date).toLocaleDateString('uk-UA', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
      average: point.averageRating,
      technical: point.ratings.technical,
      tactical: point.ratings.tactical,
      physical: point.ratings.physical,
      psychological: point.ratings.psychological,
      eventType: point.eventType === 'match' ? 'Match' : 'Training',
    }));
  };

  return (
    <div className="space-y-6">
      {/* Player Name */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">{displayName}</h2>
        <p className="text-gray-500">{PERIOD_LABELS[period]}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <p className="text-4xl font-bold text-gray-900">{stats.matchesPlayed}</p>
          <p className="text-gray-500 mt-2">Matches Played</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <p className="text-4xl font-bold text-gray-900">{stats.goals}</p>
          <p className="text-gray-500 mt-2">Goals Scored</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-purple-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
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
                <div className="bg-green-500 h-full" style={{ width: `${(stats.goals / (stats.goals + stats.assists)) * 100}%` }} />
                <div className="bg-purple-500 h-full" style={{ width: `${(stats.assists / (stats.goals + stats.assists)) * 100}%` }} />
              </div>
            )}
          </div>
          <span className="text-2xl font-bold text-gray-900">{stats.goals + stats.assists}</span>
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

      {/* Rating Statistics */}
      {ratingStats && ratingStats.totalEvents > 0 && (
        <>
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Average Ratings</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center p-4 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl border-2 border-yellow-200">
                <p className="text-3xl font-bold text-yellow-600">
                  {ratingStats.averageRating?.toFixed(1) ?? '-'}
                </p>
                <p className="text-sm text-gray-600 font-medium">Overall</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-xl">
                <p className="text-2xl font-bold text-blue-600">
                  {ratingStats.byCategory.technical?.toFixed(1) ?? '-'}
                </p>
                <p className="text-sm text-gray-500">Technical</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-xl">
                <p className="text-2xl font-bold text-green-600">
                  {ratingStats.byCategory.tactical?.toFixed(1) ?? '-'}
                </p>
                <p className="text-sm text-gray-500">Tactical</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-xl">
                <p className="text-2xl font-bold text-red-600">
                  {ratingStats.byCategory.physical?.toFixed(1) ?? '-'}
                </p>
                <p className="text-sm text-gray-500">Physical</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-xl">
                <p className="text-2xl font-bold text-purple-600">
                  {ratingStats.byCategory.psychological?.toFixed(1) ?? '-'}
                </p>
                <p className="text-sm text-gray-500">Mental</p>
              </div>
            </div>
            <p className="text-center text-sm text-gray-400 mt-4">
              Based on {ratingStats.totalEvents} evaluated events
            </p>
          </div>

          {/* Rating History Chart */}
          {ratingStats.history.length > 1 && (
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Rating Progress</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={formatChartData(ratingStats.history)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                    <YAxis domain={[0, 10]} tick={{ fontSize: 12 }} stroke="#9ca3af" />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                      formatter={(value: number, name: string) => [value?.toFixed(1) ?? '-', name.charAt(0).toUpperCase() + name.slice(1)]}
                      labelFormatter={(label, payload) => {
                        if (payload && payload[0]) {
                          const data = payload[0].payload;
                          return `${data.fullDate} (${data.eventType})`;
                        }
                        return label;
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="average" name="Average" stroke="#f59e0b" strokeWidth={3} dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="technical" name="Technical" stroke="#3b82f6" strokeWidth={1.5} dot={false} strokeDasharray="5 5" />
                    <Line type="monotone" dataKey="tactical" name="Tactical" stroke="#22c55e" strokeWidth={1.5} dot={false} strokeDasharray="5 5" />
                    <Line type="monotone" dataKey="physical" name="Physical" stroke="#ef4444" strokeWidth={1.5} dot={false} strokeDasharray="5 5" />
                    <Line type="monotone" dataKey="psychological" name="Mental" stroke="#a855f7" strokeWidth={1.5} dot={false} strokeDasharray="5 5" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
