import { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { PlayerStats, StatsPeriod } from '../api/stats';
import type { RatingStats } from '../api/evaluations';
import { isDefensivePosition } from '../constants/player.constants';

const CHART_CATEGORIES = [
  { key: 'average', name: 'Average', color: '#f59e0b', bgColor: 'bg-amber-500', bgLight: 'bg-amber-100', isMain: true },
  { key: 'technical', name: 'Technical', color: '#3b82f6', bgColor: 'bg-blue-500', bgLight: 'bg-blue-100' },
  { key: 'tactical', name: 'Tactical', color: '#22c55e', bgColor: 'bg-green-500', bgLight: 'bg-green-100' },
  { key: 'physical', name: 'Physical', color: '#ef4444', bgColor: 'bg-red-500', bgLight: 'bg-red-100' },
  { key: 'psychological', name: 'Mental', color: '#a855f7', bgColor: 'bg-purple-500', bgLight: 'bg-purple-100' },
] as const;

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
  playerName?: string;
}

export function PlayerStatsView({ stats, ratingStats, period, playerName }: PlayerStatsViewProps) {
  const displayName = playerName || stats.playerName;
  const isDefensive = isDefensivePosition(stats.position);

  const [visibleCategories, setVisibleCategories] = useState<Set<string>>(
    new Set(CHART_CATEGORIES.map(c => c.key))
  );

  const toggleCategory = (key: string) => {
    setVisibleCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

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
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">{displayName}</h2>
        <p className="text-gray-500">{PERIOD_LABELS[period]}</p>
      </div>

      <div className={`grid grid-cols-1 gap-6 ${isDefensive ? 'md:grid-cols-4' : 'md:grid-cols-3'}`}>
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

        {isDefensive && (
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-cyan-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <p className="text-4xl font-bold text-gray-900">{stats.cleanSheets}</p>
            <p className="text-gray-500 mt-2">Clean Sheets</p>
          </div>
        )}
      </div>

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

      {stats.matchesPlayed > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Per Match Averages</h3>
          <div className={`grid gap-4 ${isDefensive ? 'grid-cols-3' : 'grid-cols-2'}`}>
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
            {isDefensive && (
              <div className="text-center p-4 bg-gray-50 rounded-xl">
                <p className="text-2xl font-bold text-cyan-600">
                  {((stats.cleanSheets / stats.matchesPlayed) * 100).toFixed(0)}%
                </p>
                <p className="text-sm text-gray-500">Clean sheet rate</p>
              </div>
            )}
          </div>
        </div>
      )}

      {stats.attendance.total > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Attendance</h3>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Attendance Rate</span>
              <span className={`text-2xl font-bold ${
                stats.attendance.rate >= 90 ? 'text-green-600' :
                stats.attendance.rate >= 75 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {stats.attendance.rate}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full ${
                  stats.attendance.rate >= 90 ? 'bg-green-500' :
                  stats.attendance.rate >= 75 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${stats.attendance.rate}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-xl font-bold text-green-600">{stats.attendance.present}</p>
              <p className="text-xs text-gray-500">Present</p>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <p className="text-xl font-bold text-orange-600">{stats.attendance.late}</p>
              <p className="text-xs text-gray-500">Late</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-xl font-bold text-gray-600">{stats.attendance.benched}</p>
              <p className="text-xs text-gray-500">Benched</p>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <p className="text-xl font-bold text-red-600">{stats.attendance.absent}</p>
              <p className="text-xs text-gray-500">Absent</p>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <p className="text-xl font-bold text-yellow-600">{stats.attendance.sick}</p>
              <p className="text-xs text-gray-500">Sick</p>
            </div>
          </div>

          <div className="mt-4 flex justify-center gap-6 text-sm text-gray-500">
            <span>{stats.attendance.totalTrainings} trainings</span>
            <span>{stats.attendance.totalMatches} matches</span>
            <span>{stats.attendance.total} total events</span>
          </div>
        </div>
      )}

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

          {ratingStats.history.length > 1 && (
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Rating Progress</h3>
                <div className="flex flex-wrap gap-2">
                  {CHART_CATEGORIES.map((cat) => {
                    const isVisible = visibleCategories.has(cat.key);
                    return (
                      <button
                        key={cat.key}
                        onClick={() => toggleCategory(cat.key)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                          isVisible
                            ? `${cat.bgLight} text-gray-800 ring-2 ring-offset-1`
                            : 'bg-gray-100 text-gray-400'
                        }`}
                        style={isVisible ? { ringColor: cat.color } : undefined}
                      >
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${isVisible ? cat.bgColor : 'bg-gray-300'}`}
                        />
                        {cat.name}
                      </button>
                    );
                  })}
                </div>
              </div>
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
                    {visibleCategories.has('average') && (
                      <Line type="monotone" dataKey="average" name="Average" stroke="#f59e0b" strokeWidth={3} dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
                    )}
                    {visibleCategories.has('technical') && (
                      <Line type="monotone" dataKey="technical" name="Technical" stroke="#3b82f6" strokeWidth={1.5} dot={false} strokeDasharray="5 5" />
                    )}
                    {visibleCategories.has('tactical') && (
                      <Line type="monotone" dataKey="tactical" name="Tactical" stroke="#22c55e" strokeWidth={1.5} dot={false} strokeDasharray="5 5" />
                    )}
                    {visibleCategories.has('physical') && (
                      <Line type="monotone" dataKey="physical" name="Physical" stroke="#ef4444" strokeWidth={1.5} dot={false} strokeDasharray="5 5" />
                    )}
                    {visibleCategories.has('psychological') && (
                      <Line type="monotone" dataKey="psychological" name="Mental" stroke="#a855f7" strokeWidth={1.5} dot={false} strokeDasharray="5 5" />
                    )}
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
