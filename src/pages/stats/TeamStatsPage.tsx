import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { statsApi, type TeamStats, type StatsPeriod } from '../../api/stats';
import { isDefensivePosition } from '../../constants/player.constants';
import { PageHeader } from '../../components/layout/PageHeader';
import { PageContent } from '../../components/layout/PageContent';
import { Card, EmptyState } from '../../components/ui';

function getHeatIntensity(value: number, maxValue: number): number {
  if (maxValue === 0) return 0;
  return Math.min(value / maxValue, 1);
}

function getGoalHeatStyle(value: number, maxValue: number): string {
  const intensity = getHeatIntensity(value, maxValue);
  if (intensity === 0) return 'bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500';
  if (intensity < 0.25) return 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400';
  if (intensity < 0.5) return 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300';
  if (intensity < 0.75) return 'bg-green-200 dark:bg-green-900/70 text-green-800 dark:text-green-200';
  return 'bg-green-300 dark:bg-green-800 text-green-900 dark:text-green-100 font-semibold';
}

function getAssistHeatStyle(value: number, maxValue: number): string {
  const intensity = getHeatIntensity(value, maxValue);
  if (intensity === 0) return 'bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500';
  if (intensity < 0.25) return 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400';
  if (intensity < 0.5) return 'bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-300';
  if (intensity < 0.75) return 'bg-purple-200 dark:bg-purple-900/70 text-purple-800 dark:text-purple-200';
  return 'bg-purple-300 dark:bg-purple-800 text-purple-900 dark:text-purple-100 font-semibold';
}

function getContributionHeatStyle(value: number, maxValue: number): string {
  const intensity = getHeatIntensity(value, maxValue);
  if (intensity === 0) return 'bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500';
  if (intensity < 0.25) return 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400';
  if (intensity < 0.5) return 'bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300';
  if (intensity < 0.75) return 'bg-amber-200 dark:bg-amber-900/70 text-amber-800 dark:text-amber-200';
  return 'bg-amber-300 dark:bg-amber-800 text-amber-900 dark:text-amber-100 font-semibold';
}

function getCleanSheetHeatStyle(value: number, maxValue: number): string {
  const intensity = getHeatIntensity(value, maxValue);
  if (intensity === 0) return 'bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500';
  if (intensity < 0.25) return 'bg-cyan-50 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400';
  if (intensity < 0.5) return 'bg-cyan-100 dark:bg-cyan-900/50 text-cyan-800 dark:text-cyan-300';
  if (intensity < 0.75) return 'bg-cyan-200 dark:bg-cyan-900/70 text-cyan-800 dark:text-cyan-200';
  return 'bg-cyan-300 dark:bg-cyan-800 text-cyan-900 dark:text-cyan-100 font-semibold';
}

const PERIOD_OPTIONS: { value: StatsPeriod; label: string }[] = [
  { value: 'all_time', label: 'All Time' },
  { value: 'this_season', label: 'This Season' },
  { value: 'this_year', label: 'This Year' },
  { value: 'this_month', label: 'This Month' },
];

export function TeamStatsPage() {
  const navigate = useNavigate();
  const [teamStats, setTeamStats] = useState<TeamStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState<StatsPeriod>('all_time');
  const [selectedGroup, setSelectedGroup] = useState<string>('');

  useEffect(() => {
    const loadStats = async () => {
      setIsLoading(true);
      setError('');
      try {
        const data = await statsApi.getTeamStats(period);
        setTeamStats(data);
        if (data.length > 0 && !selectedGroup) {
          setSelectedGroup(data[0].groupId);
        }
      } catch {
        setError('Failed to load statistics');
      } finally {
        setIsLoading(false);
      }
    };

    loadStats();
  }, [period]);

  const currentTeam = teamStats.find((t) => t.groupId === selectedGroup);

  const maxValues = useMemo(() => {
    if (!currentTeam) return { goals: 0, assists: 0, contributions: 0, cleanSheets: 0 };
    const players = currentTeam.players;
    return {
      goals: Math.max(...players.map(p => p.goals), 1),
      assists: Math.max(...players.map(p => p.assists), 1),
      contributions: Math.max(...players.map(p => p.goals + p.assists), 1),
      cleanSheets: Math.max(...players.filter(p => isDefensivePosition(p.position)).map(p => p.cleanSheets), 1),
    };
  }, [currentTeam]);

  const getPeriodLabel = () => {
    const opt = PERIOD_OPTIONS.find(o => o.value === period);
    return opt?.label || 'All Time';
  };

  const NoStatsIcon = () => (
    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );

  return (
    <>
      <PageHeader
        title="Statistics"
        subtitle="Team performance analytics"
        actions={
          <div className="flex items-center gap-3">
            {teamStats.length > 1 && (
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 dark:text-white"
              >
                {teamStats.map((team) => (
                  <option key={team.groupId} value={team.groupId}>
                    {team.groupName}
                  </option>
                ))}
              </select>
            )}
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
          </div>
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
        ) : teamStats.length === 0 ? (
          <Card>
            <EmptyState
              icon={<NoStatsIcon />}
              title="No statistics available"
              description="Create groups and add players to start tracking team statistics."
            />
          </Card>
        ) : currentTeam ? (
          <div className="space-y-6">
            {/* Team Overview Card */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-8 text-white relative overflow-hidden">
              <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
              <div className="absolute left-20 bottom-0 w-32 h-32 bg-white/10 rounded-full translate-y-1/2"></div>

              <div className="relative">
                <h2 className="text-2xl font-bold mb-2">{currentTeam.groupName}</h2>
                <p className="text-green-100">{getPeriodLabel()} Statistics</p>
                <div className="mt-6 grid grid-cols-3 gap-6">
                  <div className="text-center">
                    <p className="text-4xl font-bold">
                      {currentTeam.players.reduce((sum, p) => sum + p.matchesPlayed, 0)}
                    </p>
                    <p className="text-sm text-green-100 mt-1">Total Appearances</p>
                  </div>
                  <div className="text-center">
                    <p className="text-4xl font-bold">
                      {currentTeam.players.reduce((sum, p) => sum + p.goals, 0)}
                    </p>
                    <p className="text-sm text-green-100 mt-1">Total Goals</p>
                  </div>
                  <div className="text-center">
                    <p className="text-4xl font-bold">
                      {currentTeam.players.reduce((sum, p) => sum + p.assists, 0)}
                    </p>
                    <p className="text-sm text-green-100 mt-1">Total Assists</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Player Statistics Table */}
            <Card className="overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Player Statistics</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
                      <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        #
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Player
                      </th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Matches
                      </th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Goals
                      </th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Assists
                      </th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        CS
                      </th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        G+A
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentTeam.players.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                          No players in this group
                        </td>
                      </tr>
                    ) : (
                      currentTeam.players.map((player, index) => (
                        <tr
                          key={player.playerId}
                          onClick={() => navigate(`/stats/player/${player.playerId}`)}
                          className={`cursor-pointer border-b border-gray-100 dark:border-gray-800 transition-colors ${
                            index < 3
                              ? 'bg-green-50/50 dark:bg-green-900/20 hover:bg-green-100/50 dark:hover:bg-green-900/30'
                              : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                          }`}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                                index === 0
                                  ? 'bg-yellow-400 text-yellow-900'
                                  : index === 1
                                    ? 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200'
                                    : index === 2
                                      ? 'bg-orange-400 text-orange-900'
                                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                              }`}
                            >
                              {index + 1}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="font-medium text-gray-900 dark:text-white hover:text-green-600 dark:hover:text-green-400">
                              {player.playerName}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className="text-gray-600 dark:text-gray-400">{player.matchesPlayed}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm ${getGoalHeatStyle(player.goals, maxValues.goals)}`}>
                              {player.goals}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm ${getAssistHeatStyle(player.assists, maxValues.assists)}`}>
                              {player.assists}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            {isDefensivePosition(player.position) ? (
                              <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm ${getCleanSheetHeatStyle(player.cleanSheets, maxValues.cleanSheets)}`}>
                                {player.cleanSheets}
                              </span>
                            ) : (
                              <span className="text-gray-400 dark:text-gray-500">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm font-medium ${getContributionHeatStyle(player.goals + player.assists, maxValues.contributions)}`}>
                              {player.goals + player.assists}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Top Players Cards */}
            {currentTeam.players.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Top Scorers */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <span className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                        <circle cx="10" cy="10" r="8" />
                      </svg>
                    </span>
                    Top Scorers
                  </h3>
                  <div className="space-y-3">
                    {[...currentTeam.players]
                      .sort((a, b) => b.goals - a.goals)
                      .slice(0, 5)
                      .filter((p) => p.goals > 0)
                      .map((player, index) => (
                        <div key={player.playerId} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-gray-400 dark:text-gray-500 w-4">
                              {index + 1}.
                            </span>
                            <span className="text-gray-900 dark:text-white">{player.playerName}</span>
                          </div>
                          <span className="font-bold text-green-600 dark:text-green-400">{player.goals}</span>
                        </div>
                      ))}
                    {currentTeam.players.every((p) => p.goals === 0) && (
                      <p className="text-gray-500 dark:text-gray-400 text-sm">No goals scored yet</p>
                    )}
                  </div>
                </Card>

                {/* Top Assisters */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                      </svg>
                    </span>
                    Top Assisters
                  </h3>
                  <div className="space-y-3">
                    {[...currentTeam.players]
                      .sort((a, b) => b.assists - a.assists)
                      .slice(0, 5)
                      .filter((p) => p.assists > 0)
                      .map((player, index) => (
                        <div key={player.playerId} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-gray-400 dark:text-gray-500 w-4">
                              {index + 1}.
                            </span>
                            <span className="text-gray-900 dark:text-white">{player.playerName}</span>
                          </div>
                          <span className="font-bold text-purple-600 dark:text-purple-400">{player.assists}</span>
                        </div>
                      ))}
                    {currentTeam.players.every((p) => p.assists === 0) && (
                      <p className="text-gray-500 dark:text-gray-400 text-sm">No assists yet</p>
                    )}
                  </div>
                </Card>

                {/* Top Clean Sheets */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <span className="w-8 h-8 bg-cyan-100 dark:bg-cyan-900/30 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-cyan-600 dark:text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </span>
                    Top Clean Sheets
                  </h3>
                  <div className="space-y-3">
                    {[...currentTeam.players]
                      .filter((p) => isDefensivePosition(p.position))
                      .sort((a, b) => b.cleanSheets - a.cleanSheets)
                      .slice(0, 5)
                      .filter((p) => p.cleanSheets > 0)
                      .map((player, index) => (
                        <div key={player.playerId} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-gray-400 dark:text-gray-500 w-4">
                              {index + 1}.
                            </span>
                            <span className="text-gray-900 dark:text-white">{player.playerName}</span>
                          </div>
                          <span className="font-bold text-cyan-600 dark:text-cyan-400">{player.cleanSheets}</span>
                        </div>
                      ))}
                    {currentTeam.players
                      .filter((p) => isDefensivePosition(p.position))
                      .every((p) => p.cleanSheets === 0) && (
                      <p className="text-gray-500 dark:text-gray-400 text-sm">No clean sheets yet</p>
                    )}
                  </div>
                </Card>
              </div>
            )}
          </div>
        ) : null}
      </PageContent>
    </>
  );
}
