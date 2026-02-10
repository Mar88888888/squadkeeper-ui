import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { statsApi, type TeamStats, type StatsPeriod } from '../../api/stats';
import { isDefensivePosition } from '../../constants/player.constants';
import { EmptyState, emptyStateIcons } from '../../components/EmptyState';

// Heat color functions - returns opacity/intensity based on value relative to max
function getHeatIntensity(value: number, maxValue: number): number {
  if (maxValue === 0) return 0;
  return Math.min(value / maxValue, 1);
}

function getGoalHeatStyle(value: number, maxValue: number): string {
  const intensity = getHeatIntensity(value, maxValue);
  if (intensity === 0) return 'bg-gray-50 text-gray-400';
  if (intensity < 0.25) return 'bg-green-50 text-green-700';
  if (intensity < 0.5) return 'bg-green-100 text-green-800';
  if (intensity < 0.75) return 'bg-green-200 text-green-800';
  return 'bg-green-300 text-green-900 font-semibold';
}

function getAssistHeatStyle(value: number, maxValue: number): string {
  const intensity = getHeatIntensity(value, maxValue);
  if (intensity === 0) return 'bg-gray-50 text-gray-400';
  if (intensity < 0.25) return 'bg-purple-50 text-purple-700';
  if (intensity < 0.5) return 'bg-purple-100 text-purple-800';
  if (intensity < 0.75) return 'bg-purple-200 text-purple-800';
  return 'bg-purple-300 text-purple-900 font-semibold';
}

function getContributionHeatStyle(value: number, maxValue: number): string {
  const intensity = getHeatIntensity(value, maxValue);
  if (intensity === 0) return 'bg-gray-50 text-gray-400';
  if (intensity < 0.25) return 'bg-amber-50 text-amber-700';
  if (intensity < 0.5) return 'bg-amber-100 text-amber-800';
  if (intensity < 0.75) return 'bg-amber-200 text-amber-800';
  return 'bg-amber-300 text-amber-900 font-semibold';
}

function getCleanSheetHeatStyle(value: number, maxValue: number): string {
  const intensity = getHeatIntensity(value, maxValue);
  if (intensity === 0) return 'bg-gray-50 text-gray-400';
  if (intensity < 0.25) return 'bg-cyan-50 text-cyan-700';
  if (intensity < 0.5) return 'bg-cyan-100 text-cyan-800';
  if (intensity < 0.75) return 'bg-cyan-200 text-cyan-800';
  return 'bg-cyan-300 text-cyan-900 font-semibold';
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

  // Calculate max values for heat coloring
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
    switch (period) {
      case 'this_month':
        return 'This Month';
      case 'this_year':
        return 'This Year';
      default:
        return 'All Time';
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950">
      <header className="bg-white dark:bg-gray-900 shadow">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Team Statistics</h1>
          <button
            onClick={() => navigate('/dashboard')}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          >
            Back to Dashboard
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-center">
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

          {teamStats.length > 1 && (
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-800 dark:text-gray-100 shadow focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              {teamStats.map((team) => (
                <option key={team.groupId} value={team.groupId}>
                  {team.groupName}
                </option>
              ))}
            </select>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-gray-700 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
            {error}
          </div>
        ) : teamStats.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
            <EmptyState
              icon={emptyStateIcons.stats}
              title="No statistics available"
              description="Create groups and add players to start tracking team statistics."
              action={{ label: 'Manage Groups', to: '/admin/groups' }}
            />
          </div>
        ) : currentTeam ? (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-green-600 to-green-500 rounded-2xl shadow-lg p-6 text-white">
              <h2 className="text-2xl font-bold">{currentTeam.groupName}</h2>
              <p className="text-green-100">{getPeriodLabel()} Statistics</p>
              <div className="mt-4 grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-3xl font-bold">
                    {currentTeam.players.reduce((sum, p) => sum + p.matchesPlayed, 0)}
                  </p>
                  <p className="text-sm text-green-100">Total Appearances</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold">
                    {currentTeam.players.reduce((sum, p) => sum + p.goals, 0)}
                  </p>
                  <p className="text-sm text-green-100">Total Goals</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold">
                    {currentTeam.players.reduce((sum, p) => sum + p.assists, 0)}
                  </p>
                  <p className="text-sm text-green-100">Total Assists</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold tracking-tight text-gray-900 dark:text-gray-100">Player Statistics</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        #
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Player
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Matches
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Goals
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Assists
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        CS
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        G+A
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
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
                          className={`cursor-pointer transition-colors ${
                            index < 3 ? 'bg-green-50/50 dark:bg-green-900/20 hover:bg-green-100/50 dark:hover:bg-green-900/30' : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                          }`}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                                index === 0
                                  ? 'bg-yellow-400 text-yellow-900'
                                  : index === 1
                                    ? 'bg-gray-300 text-gray-700'
                                    : index === 2
                                      ? 'bg-orange-400 text-orange-900'
                                      : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {index + 1}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="font-medium text-gray-900 dark:text-gray-100 hover:text-green-600 dark:hover:text-green-400">
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
            </div>

            {currentTeam.players.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">
                  <h3 className="text-lg font-semibold tracking-tight text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                    <span className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" />
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
                            <span className="text-gray-900 dark:text-gray-100">{player.playerName}</span>
                          </div>
                          <span className="font-bold text-green-600 dark:text-green-400">{player.goals}</span>
                        </div>
                      ))}
                    {currentTeam.players.every((p) => p.goals === 0) && (
                      <p className="text-gray-500 dark:text-gray-400 text-sm">No goals scored yet</p>
                    )}
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">
                  <h3 className="text-lg font-semibold tracking-tight text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
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
                            <span className="text-gray-900 dark:text-gray-100">{player.playerName}</span>
                          </div>
                          <span className="font-bold text-purple-600 dark:text-purple-400">{player.assists}</span>
                        </div>
                      ))}
                    {currentTeam.players.every((p) => p.assists === 0) && (
                      <p className="text-gray-500 dark:text-gray-400 text-sm">No assists yet</p>
                    )}
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">
                  <h3 className="text-lg font-semibold tracking-tight text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
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
                            <span className="text-gray-900 dark:text-gray-100">{player.playerName}</span>
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
                </div>
              </div>
            )}
          </div>
        ) : null}
      </main>
    </div>
  );
}
