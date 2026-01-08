import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  analyticsApi,
  type TeamChemistry,
  type PlayerCombinationStats,
  type CorePlayer,
} from '../api/analytics';
import type { StatsPeriod } from '../api/stats';

const PERIOD_OPTIONS: { value: StatsPeriod; label: string }[] = [
  { value: 'all_time', label: 'All Time' },
  { value: 'this_season', label: 'This Season' },
  { value: 'this_year', label: 'This Year' },
  { value: 'this_month', label: 'This Month' },
];

function CombinationCard({ combination, type }: { combination: PlayerCombinationStats; type: 'pair' | 'trio' }) {
  const getChemistryColor = (score: number) => {
    if (score >= 70) return 'text-green-600 bg-green-100';
    if (score >= 50) return 'text-blue-600 bg-blue-100';
    if (score >= 30) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getWinRateColor = (rate: number) => {
    if (rate >= 60) return 'text-green-600';
    if (rate >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 hover:shadow-xl transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex flex-wrap gap-2 mb-2">
            {combination.players.map((player) => (
              <span
                key={player.id}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
              >
                {player.name}
                <span className="ml-1 text-gray-500">({player.position})</span>
              </span>
            ))}
          </div>
        </div>
        <div
          className={`px-3 py-1 rounded-full text-lg font-bold ${getChemistryColor(combination.chemistryScore)}`}
        >
          {combination.chemistryScore.toFixed(1)}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3 text-center text-sm">
        <div>
          <p className="text-gray-500">Matches</p>
          <p className="font-semibold text-gray-900">{combination.matchesTogether}</p>
        </div>
        <div>
          <p className="text-gray-500">Win Rate</p>
          <p className={`font-semibold ${getWinRateColor(combination.winRate)}`}>
            {combination.winRate}%
          </p>
        </div>
        <div>
          <p className="text-gray-500">W/D/L</p>
          <p className="font-semibold text-gray-900">
            <span className="text-green-600">{combination.wins}</span>/
            <span className="text-gray-600">{combination.draws}</span>/
            <span className="text-red-600">{combination.losses}</span>
          </p>
        </div>
        <div>
          <p className="text-gray-500">Goal Diff</p>
          <p
            className={`font-semibold ${
              combination.goalDifference > 0
                ? 'text-green-600'
                : combination.goalDifference < 0
                  ? 'text-red-600'
                  : 'text-gray-600'
            }`}
          >
            {combination.goalDifference > 0 ? '+' : ''}
            {combination.goalDifference}
          </p>
        </div>
      </div>

      {combination.averageEvaluationRating !== null && (
        <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center text-sm">
          <span className="text-gray-500">Avg Evaluation</span>
          <span className="font-semibold text-yellow-600">
            {combination.averageEvaluationRating.toFixed(1)} / 10
          </span>
        </div>
      )}
    </div>
  );
}

function CorePlayerCard({ player, rank }: { player: CorePlayer; rank: number }) {
  const getRankBadge = () => {
    if (rank === 1) return 'bg-yellow-400 text-yellow-900';
    if (rank === 2) return 'bg-gray-300 text-gray-700';
    if (rank === 3) return 'bg-orange-400 text-orange-900';
    return 'bg-gray-100 text-gray-600';
  };

  return (
    <div className="flex items-center gap-3 p-3 bg-white rounded-lg shadow">
      <span
        className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${getRankBadge()}`}
      >
        {rank}
      </span>
      <div className="flex-1">
        <p className="font-medium text-gray-900">{player.name}</p>
        <p className="text-xs text-gray-500">{player.position}</p>
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold text-indigo-600">
          {player.appearanceInWinningCombinations}x
        </p>
        <p className="text-xs text-gray-500">
          Avg: {player.averageChemistryScore.toFixed(1)}
        </p>
      </div>
    </div>
  );
}

export function TeamChemistryPage() {
  const navigate = useNavigate();
  const [teamChemistry, setTeamChemistry] = useState<TeamChemistry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState<StatsPeriod>('all_time');
  const [selectedGroup, setSelectedGroup] = useState<string>('');

  useEffect(() => {
    const loadChemistry = async () => {
      setIsLoading(true);
      setError('');
      try {
        const data = await analyticsApi.getMyTeamsChemistry(period);
        setTeamChemistry(data);
        if (data.length > 0 && !selectedGroup) {
          setSelectedGroup(data[0].groupId);
        }
      } catch {
        setError('Failed to load team chemistry data');
      } finally {
        setIsLoading(false);
      }
    };

    loadChemistry();
  }, [period]);

  const currentTeam = teamChemistry.find((t) => t.groupId === selectedGroup);

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">Team Chemistry</h1>
          <button
            onClick={() => navigate('/dashboard')}
            className="text-gray-600 hover:text-gray-900"
          >
            Back to Dashboard
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Filters */}
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

          {teamChemistry.length > 1 && (
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 bg-white shadow focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              {teamChemistry.map((team) => (
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
        ) : teamChemistry.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <p className="text-gray-500">No teams found</p>
          </div>
        ) : currentTeam ? (
          <div className="space-y-6">
            {/* Team Header */}
            <div className="bg-gradient-to-r from-teal-600 to-cyan-600 rounded-2xl shadow-lg p-6 text-white">
              <h2 className="text-2xl font-bold">{currentTeam.groupName}</h2>
              <p className="text-teal-200">Chemistry Analysis</p>
              <div className="mt-4 grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-3xl font-bold">{currentTeam.totalMatchesAnalyzed}</p>
                  <p className="text-sm text-teal-200">Matches Analyzed</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold">{currentTeam.bestPairs.length}</p>
                  <p className="text-sm text-teal-200">Strong Pairs</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold">{currentTeam.bestTrios.length}</p>
                  <p className="text-sm text-teal-200">Strong Trios</p>
                </div>
              </div>
            </div>

            {/* Info Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                Chemistry scores are calculated based on win rate (40%), goal difference (35%), and
                average evaluation ratings (25%). Minimum {currentTeam.minimumMatches} matches together required.
              </p>
            </div>

            {/* Core Players */}
            {currentTeam.corePlayers.length > 0 && (
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  Core Players
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Players who appear most frequently in high-chemistry combinations
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {currentTeam.corePlayers.slice(0, 6).map((player, index) => (
                    <CorePlayerCard key={player.id} player={player} rank={index + 1} />
                  ))}
                </div>
              </div>
            )}

            {/* Best Pairs */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                  </svg>
                </span>
                Best Player Pairs
              </h3>
              {currentTeam.bestPairs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentTeam.bestPairs.map((pair, index) => (
                    <CombinationCard
                      key={pair.players.map((p) => p.id).join('-')}
                      combination={pair}
                      type="pair"
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow p-6 text-center text-gray-500">
                  Not enough match data to determine best pairs (need at least{' '}
                  {currentTeam.minimumMatches} matches together)
                </div>
              )}
            </div>

            {/* Best Trios */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                  </svg>
                </span>
                Best Player Trios
              </h3>
              {currentTeam.bestTrios.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentTeam.bestTrios.map((trio, index) => (
                    <CombinationCard
                      key={trio.players.map((p) => p.id).join('-')}
                      combination={trio}
                      type="trio"
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow p-6 text-center text-gray-500">
                  Not enough match data to determine best trios (need at least{' '}
                  {currentTeam.minimumMatches} matches together)
                </div>
              )}
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
