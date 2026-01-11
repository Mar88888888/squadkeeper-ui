import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { statsApi, type TeamStats, type StatsPeriod } from '../api/stats';
import { isDefensivePosition } from '../constants/player.constants';

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
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">Team Statistics</h1>
          <button
            onClick={() => navigate('/dashboard')}
            className="text-gray-600 hover:text-gray-900"
          >
            Back to Dashboard
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-center">
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

          {teamStats.length > 1 && (
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 bg-white shadow focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        ) : teamStats.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <p className="text-gray-500">No teams found</p>
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

            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Player Statistics</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        #
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Player
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Matches
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Goals
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Assists
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        CS
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        G+A
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {currentTeam.players.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                          No players in this group
                        </td>
                      </tr>
                    ) : (
                      currentTeam.players.map((player, index) => (
                        <tr
                          key={player.playerId}
                          onClick={() => navigate(`/stats/player/${player.playerId}`)}
                          className={`cursor-pointer transition-colors ${
                            index < 3 ? 'bg-green-50/50 hover:bg-green-100/50' : 'hover:bg-gray-100'
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
                            <span className="font-medium text-gray-900 hover:text-green-600">
                              {player.playerName}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className="text-gray-600">{player.matchesPlayed}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-green-100 text-green-800">
                              {player.goals}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                              {player.assists}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            {isDefensivePosition(player.position) ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-cyan-100 text-cyan-800">
                                {player.cleanSheets}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className="font-bold text-gray-900">
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
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
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
                            <span className="text-sm font-medium text-gray-400 w-4">
                              {index + 1}.
                            </span>
                            <span className="text-gray-900">{player.playerName}</span>
                          </div>
                          <span className="font-bold text-green-600">{player.goals}</span>
                        </div>
                      ))}
                    {currentTeam.players.every((p) => p.goals === 0) && (
                      <p className="text-gray-500 text-sm">No goals scored yet</p>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
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
                            <span className="text-sm font-medium text-gray-400 w-4">
                              {index + 1}.
                            </span>
                            <span className="text-gray-900">{player.playerName}</span>
                          </div>
                          <span className="font-bold text-purple-600">{player.assists}</span>
                        </div>
                      ))}
                    {currentTeam.players.every((p) => p.assists === 0) && (
                      <p className="text-gray-500 text-sm">No assists yet</p>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="w-8 h-8 bg-cyan-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                            <span className="text-sm font-medium text-gray-400 w-4">
                              {index + 1}.
                            </span>
                            <span className="text-gray-900">{player.playerName}</span>
                          </div>
                          <span className="font-bold text-cyan-600">{player.cleanSheets}</span>
                        </div>
                      ))}
                    {currentTeam.players
                      .filter((p) => isDefensivePosition(p.position))
                      .every((p) => p.cleanSheets === 0) && (
                      <p className="text-gray-500 text-sm">No clean sheets yet</p>
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
