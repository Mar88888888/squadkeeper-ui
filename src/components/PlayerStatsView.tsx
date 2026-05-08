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
import { useChartColors } from '../hooks/useChartColors';

interface CircularRatingProps {
  rating: number | null;
  maxRating?: number;
  chartColors: ReturnType<typeof useChartColors>;
}

function CircularRating({ rating, maxRating = 10, chartColors }: CircularRatingProps) {
  const displayRating = rating ?? 0;
  const percentage = Math.min((displayRating / maxRating) * 100, 100);
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const getColor = (pct: number) => {
    if (pct >= 70) return { stroke: chartColors.scoreGood, text: 'text-green-600 dark:text-green-400', bg: 'from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30' };
    if (pct >= 50) return { stroke: chartColors.scoreMedium, text: 'text-amber-600 dark:text-amber-400', bg: 'from-amber-50 to-yellow-50 dark:from-amber-900/30 dark:to-yellow-900/30' };
    return { stroke: chartColors.scoreLow, text: 'text-red-600 dark:text-red-400', bg: 'from-red-50 to-orange-50 dark:from-red-900/30 dark:to-orange-900/30' };
  };

  const colors = getColor(percentage);

  return (
    <div className={`relative w-28 h-28 bg-gradient-to-br ${colors.bg} rounded-full p-1`}>
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r={radius}
          stroke={chartColors.backgroundStroke}
          strokeWidth="8"
          fill="none"
        />
        <circle
          cx="50"
          cy="50"
          r={radius}
          stroke={colors.stroke}
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-2xl font-bold ${colors.text}`}>
          {rating?.toFixed(1) ?? '-'}
        </span>
        <span className="text-xs text-gray-400 dark:text-gray-500">/ {maxRating}</span>
      </div>
    </div>
  );
}

function CategoryBar({ label, value, maxValue = 10, color }: { label: string; value: number | null; maxValue?: number; color: string }) {
  const displayValue = value ?? 0;
  const percentage = Math.min((displayValue / maxValue) * 100, 100);

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-600 dark:text-gray-400 w-20">{label}</span>
      <div className="flex-1 h-2.5 bg-gray-100 dark:bg-gray-950 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 w-8 text-right">
        {value?.toFixed(1) ?? '-'}
      </span>
    </div>
  );
}

const CHART_CATEGORIES = [
  { key: 'average', name: 'Average', color: '#f59e0b', bgColor: 'bg-amber-500', bgLight: 'bg-amber-100 dark:bg-amber-900/40', isMain: true },
  { key: 'technical', name: 'Technical', color: '#3b82f6', bgColor: 'bg-blue-500', bgLight: 'bg-blue-100 dark:bg-blue-900/40' },
  { key: 'tactical', name: 'Tactical', color: '#22c55e', bgColor: 'bg-green-500', bgLight: 'bg-green-100 dark:bg-green-900/40' },
  { key: 'physical', name: 'Physical', color: '#ef4444', bgColor: 'bg-red-500', bgLight: 'bg-red-100 dark:bg-red-900/40' },
  { key: 'psychological', name: 'Mental', color: '#a855f7', bgColor: 'bg-purple-500', bgLight: 'bg-purple-100 dark:bg-purple-900/40' },
] as const;

const PERIOD_LABELS: Record<StatsPeriod, string> = {
  all_time: 'All Time Statistics',
  this_season: 'This Season',
  this_year: 'This Year',
  this_month: 'This Month',
};

const FireIcon = () => (
  <svg
    className="w-4 h-4 text-orange-500 dark:text-orange-400"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M12.1 2.25c.39 1.42 1.45 2.8 2.47 4.14 1.9 2.5 3.86 5.08 3.86 8.36 0 3.57-2.9 6.5-6.47 6.5s-6.47-2.93-6.47-6.5c0-2.66 1.44-4.73 2.95-6.92.69-1 1.41-2.04 1.95-3.2l.69-1.48 1.02 1.1zm-.2 8.55c-.66 1.15-1.54 2.26-1.54 3.65 0 1.01.79 1.8 1.8 1.8s1.8-.79 1.8-1.8c0-1.17-.71-2.24-1.4-3.28l-.66-1.01z" />
  </svg>
);

const ConeIcon = () => (
  <svg
    className="w-4 h-4 text-amber-500 dark:text-amber-300"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.9}
      d="M12 3l4.8 13H7.2L12 3zM9 11.5h6M8 15h8M6.2 17.8h11.6v2.6H6.2z"
    />
  </svg>
);

const BallIcon = () => (
  <svg
    className="w-4 h-4 text-amber-500 dark:text-amber-300"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="8" strokeWidth={1.9} />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.9}
      d="M12 8.1l2.35 1.7-.9 2.7h-2.9l-.9-2.7L12 8.1zm-2.55 1.7-2.35-.9L5.8 11l1.3 2.1m10.85-3.2 1.25 1.1-1.2 2.1-2.35.1m-8.55-.1-1.3 2.1 1.3 2 2.35-.9m8.55-3.2 1.2 2.1-1.25 1.1-2.35-.9m-1.4-2.3-.45 2.5 2 1.5m-7.5 0 2-1.5-.45-2.5m3.95 0h-3.9"
    />
  </svg>
);

interface PlayerStatsViewProps {
  stats: PlayerStats;
  ratingStats: RatingStats | null;
  period: StatsPeriod;
  playerName?: string;
}

export function PlayerStatsView({ stats, ratingStats, period, playerName }: PlayerStatsViewProps) {
  const displayName = playerName || stats.playerName;
  const isDefensive = isDefensivePosition(stats.position);
  const chartColors = useChartColors();
  const trainingStreak = stats.attendance.streaks?.trainings ?? 0;
  const matchStreak = stats.attendance.streaks?.matches ?? 0;

  const [visibleCategories, setVisibleCategories] = useState<Set<string>>(
    new Set(['average'])
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
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{displayName}</h2>
        <p className="text-gray-500 dark:text-gray-400">{PERIOD_LABELS[period]}</p>
      </div>

      <div className={`grid grid-cols-1 gap-6 ${isDefensive ? 'md:grid-cols-4' : 'md:grid-cols-3'}`}>
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <p className="text-4xl font-bold text-gray-900 dark:text-gray-100">{stats.matchesPlayed}</p>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500 mt-2">Matches Played</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <p className="text-4xl font-bold text-gray-900 dark:text-gray-100">{stats.goals}</p>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500 mt-2">Goals Scored</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
            </svg>
          </div>
          <p className="text-4xl font-bold text-gray-900 dark:text-gray-100">{stats.assists}</p>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500 mt-2">Assists</p>
        </div>

        {isDefensive && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-cyan-100 dark:bg-cyan-900/30 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-cyan-600 dark:text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <p className="text-4xl font-bold text-gray-900 dark:text-gray-100">{stats.cleanSheets}</p>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500 mt-2">Clean Sheets</p>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Goal Contributions</h3>
        <div className="flex items-center gap-4">
          <div className="flex-1 bg-gray-100 dark:bg-gray-950 rounded-full h-4 overflow-hidden">
            {stats.goals + stats.assists > 0 && (
              <div className="flex h-full">
                <div className="bg-green-500 h-full" style={{ width: `${(stats.goals / (stats.goals + stats.assists)) * 100}%` }} />
                <div className="bg-purple-500 h-full" style={{ width: `${(stats.assists / (stats.goals + stats.assists)) * 100}%` }} />
              </div>
            )}
          </div>
          <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.goals + stats.assists}</span>
        </div>
        <div className="flex justify-between mt-2 text-sm text-gray-700 dark:text-gray-300">
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
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Per Match Averages</h3>
          <div className={`grid gap-4 ${isDefensive ? 'grid-cols-3' : 'grid-cols-2'}`}>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {(stats.goals / stats.matchesPlayed).toFixed(2)}
              </p>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">Goals / Match</p>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {(stats.assists / stats.matchesPlayed).toFixed(2)}
              </p>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">Assists / Match</p>
            </div>
            {isDefensive && (
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <p className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">
                  {((stats.cleanSheets / stats.matchesPlayed) * 100).toFixed(0)}%
                </p>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">Clean Sheet Rate</p>
              </div>
            )}
          </div>
        </div>
      )}

      {stats.attendance.total > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Attendance</h3>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Attendance Rate</span>
              <span className={`text-2xl font-bold ${
                stats.attendance.rate >= 90 ? 'text-green-600 dark:text-green-400' :
                stats.attendance.rate >= 75 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'
              }`}>
                {stats.attendance.rate}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <div
                className={`h-3 rounded-full ${
                  stats.attendance.rate >= 90 ? 'bg-green-500' :
                  stats.attendance.rate >= 75 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${stats.attendance.rate}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-3 bg-green-50 dark:bg-green-900/30 rounded-lg">
              <p className="text-xl font-bold text-green-600 dark:text-green-400">{stats.attendance.present}</p>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">Present</p>
            </div>
            <div className="text-center p-3 bg-red-50 dark:bg-red-900/30 rounded-lg">
              <p className="text-xl font-bold text-red-600 dark:text-red-400">{stats.attendance.absent}</p>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">Absent</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center justify-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/25 rounded-lg border border-amber-200/70 dark:border-amber-700/50 select-none">
              <FireIcon />
              <ConeIcon />
              <span className="text-lg font-bold text-amber-800 dark:text-amber-200">
                {trainingStreak}
              </span>
              <span className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Training streak
              </span>
            </div>
            <div className="flex items-center justify-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/25 rounded-lg border border-amber-200/70 dark:border-amber-700/50 select-none">
              <FireIcon />
              <BallIcon />
              <span className="text-lg font-bold text-amber-800 dark:text-amber-200">
                {matchStreak}
              </span>
              <span className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Match streak
              </span>
            </div>
          </div>

          <div className="mt-4 flex justify-center gap-6 text-sm text-gray-500 dark:text-gray-400">
            <span>{stats.attendance.totalTrainings} trainings</span>
            <span>{stats.attendance.totalMatches} matches</span>
            <span>{stats.attendance.total} total events</span>
          </div>
        </div>
      )}

      {ratingStats && ratingStats.totalEvents > 0 && (
        <>
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">Performance Rating</h3>
            <div className="flex flex-col md:flex-row items-center gap-8">
              {/* Circular overall rating */}
              <div className="flex flex-col items-center">
                <CircularRating rating={ratingStats.averageRating} chartColors={chartColors} />
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mt-2">Overall Rating</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">{ratingStats.totalEvents} events</p>
              </div>

              {/* Category breakdown bars */}
              <div className="flex-1 w-full space-y-3">
                <CategoryBar
                  label="Technical"
                  value={ratingStats.byCategory.technical}
                  color="bg-blue-500"
                />
                <CategoryBar
                  label="Tactical"
                  value={ratingStats.byCategory.tactical}
                  color="bg-green-500"
                />
                <CategoryBar
                  label="Physical"
                  value={ratingStats.byCategory.physical}
                  color="bg-red-500"
                />
                <CategoryBar
                  label="Mental"
                  value={ratingStats.byCategory.psychological}
                  color="bg-purple-500"
                />
              </div>
            </div>
          </div>

          {ratingStats.history.length > 1 && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Rating Progress</h3>
                <div className="flex flex-wrap gap-2">
                  {CHART_CATEGORIES.map((cat) => {
                    const isVisible = visibleCategories.has(cat.key);
                    return (
                      <button
                        key={cat.key}
                        onClick={() => toggleCategory(cat.key)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                          isVisible
                            ? `${cat.bgLight} text-gray-800 dark:text-gray-200 ring-2 ring-offset-1 dark:ring-offset-gray-900`
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500'
                        }`}
                        style={isVisible ? { '--tw-ring-color': cat.color } as React.CSSProperties : undefined}
                      >
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${isVisible ? cat.bgColor : 'bg-gray-300 dark:bg-gray-600'}`}
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
                    <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                    <XAxis dataKey="date" tick={{ fontSize: 12, fill: chartColors.axis }} stroke={chartColors.axisLine} />
                    <YAxis domain={[0, 10]} tick={{ fontSize: 12, fill: chartColors.axis }} stroke={chartColors.axisLine} />
                    <Tooltip
                      contentStyle={{ backgroundColor: chartColors.tooltipBg, border: `1px solid ${chartColors.tooltipBorder}`, borderRadius: '8px', color: chartColors.tooltipText }}
                      formatter={(value, name) => [typeof value === 'number' ? value.toFixed(1) : '-', String(name).charAt(0).toUpperCase() + String(name).slice(1)]}
                      labelFormatter={(label, payload) => {
                        if (payload && payload[0]) {
                          const data = payload[0].payload;
                          return `${data.fullDate} (${data.eventType})`;
                        }
                        return label;
                      }}
                    />
                    {visibleCategories.has('average') && (
                      <Line isAnimationActive={false} type="linear" dataKey="average" name="Average" stroke={chartColors.average} strokeWidth={2} dot={{ fill: chartColors.average, r: 4 }} activeDot={{ r: 6 }} />
                    )}
                    {visibleCategories.has('technical') && (
                      <Line isAnimationActive={false} type="linear" dataKey="technical" name="Technical" stroke={chartColors.technical} strokeWidth={1.5} dot={false} strokeDasharray="5 5" />
                    )}
                    {visibleCategories.has('tactical') && (
                      <Line isAnimationActive={false} type="linear" dataKey="tactical" name="Tactical" stroke={chartColors.tactical} strokeWidth={1.5} dot={false} strokeDasharray="5 5" />
                    )}
                    {visibleCategories.has('physical') && (
                      <Line isAnimationActive={false} type="linear" dataKey="physical" name="Physical" stroke={chartColors.physical} strokeWidth={1.5} dot={false} strokeDasharray="5 5" />
                    )}
                    {visibleCategories.has('psychological') && (
                      <Line isAnimationActive={false} type="linear" dataKey="psychological" name="Mental" stroke={chartColors.mental} strokeWidth={1.5} dot={false} strokeDasharray="5 5" />
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
