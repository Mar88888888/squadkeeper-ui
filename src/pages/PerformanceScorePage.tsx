import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  analyticsApi,
  type TeamPerformanceScore,
  type PerformanceScore,
} from '../api/analytics';
import type { StatsPeriod } from '../api/stats';

const PERIOD_OPTIONS: { value: StatsPeriod; label: string }[] = [
  { value: 'all_time', label: 'All Time' },
  { value: 'this_season', label: 'This Season' },
  { value: 'this_year', label: 'This Year' },
  { value: 'this_month', label: 'This Month' },
];

function ScoreBar({ score, maxScore, color }: { score: number; maxScore: number; color: string }) {
  const percentage = (score / maxScore) * 100;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-sm font-medium text-gray-600 w-12 text-right">
        {score.toFixed(1)}
      </span>
    </div>
  );
}

function PlayerScoreCard({
  player,
  rank,
  onClick,
}: {
  player: PerformanceScore;
  rank: number;
  onClick: () => void;
}) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRankBadge = () => {
    if (rank === 1) return 'bg-yellow-400 text-yellow-900';
    if (rank === 2) return 'bg-gray-300 text-gray-700';
    if (rank === 3) return 'bg-orange-400 text-orange-900';
    return 'bg-gray-100 text-gray-600';
  };

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl shadow-lg p-4 cursor-pointer hover:shadow-xl transition-shadow"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${getRankBadge()}`}
          >
            {rank}
          </span>
          <div>
            <h3 className="font-semibold text-gray-900">{player.playerName}</h3>
            <span className="text-xs text-gray-500">{player.position}</span>
          </div>
        </div>
        <div className="text-right">
          <span className={`text-2xl font-bold ${getScoreColor(player.performanceScore)}`}>
            {player.performanceScore.toFixed(1)}
          </span>
          <p className="text-xs text-gray-500">/ 100</p>
        </div>
      </div>

      <div className="space-y-2">
        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Evaluations</span>
            <span>{player.components.evaluationScore.toFixed(1)} / 35</span>
          </div>
          <ScoreBar score={player.components.evaluationScore} maxScore={35} color="bg-yellow-500" />
        </div>
        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Goals</span>
            <span>{player.components.goalContribution.toFixed(1)} / {player.maxWeights.goalMax}</span>
          </div>
          <ScoreBar score={player.components.goalContribution} maxScore={player.maxWeights.goalMax} color="bg-green-500" />
        </div>
        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Assists</span>
            <span>{player.components.assistContribution.toFixed(1)} / {player.maxWeights.assistMax}</span>
          </div>
          <ScoreBar score={player.components.assistContribution} maxScore={player.maxWeights.assistMax} color="bg-purple-500" />
        </div>
        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Clean Sheets</span>
            <span>{player.components.cleanSheetContribution.toFixed(1)} / {player.maxWeights.cleanSheetMax}</span>
          </div>
          <ScoreBar score={player.components.cleanSheetContribution} maxScore={player.maxWeights.cleanSheetMax} color="bg-cyan-500" />
        </div>
        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Win Rate</span>
            <span>{player.components.winRateContribution.toFixed(1)} / 10</span>
          </div>
          <ScoreBar score={player.components.winRateContribution} maxScore={10} color="bg-blue-500" />
        </div>
        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Participation</span>
            <span>{player.components.participationBonus.toFixed(1)} / 5</span>
          </div>
          <ScoreBar score={player.components.participationBonus} maxScore={5} color="bg-orange-500" />
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-5 gap-2 text-center text-xs">
        <div>
          <p className="font-semibold text-gray-900">{player.rawStats.matchesPlayed}</p>
          <p className="text-gray-500">Matches</p>
        </div>
        <div>
          <p className="font-semibold text-green-600">{player.rawStats.goals}</p>
          <p className="text-gray-500">Goals</p>
        </div>
        <div>
          <p className="font-semibold text-purple-600">{player.rawStats.assists}</p>
          <p className="text-gray-500">Assists</p>
        </div>
        <div>
          <p className="font-semibold text-blue-600">
            {Math.round(player.rawStats.winRate * 100)}%
          </p>
          <p className="text-gray-500">Win Rate</p>
        </div>
        <div>
          <p className="font-semibold text-yellow-600">
            {player.rawStats.averageEvaluationRating?.toFixed(1) || '-'}
          </p>
          <p className="text-gray-500">Avg Rating</p>
        </div>
      </div>
    </div>
  );
}

export function PerformanceScorePage() {
  const navigate = useNavigate();
  const [teamScores, setTeamScores] = useState<TeamPerformanceScore[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState<StatsPeriod>('all_time');
  const [selectedGroup, setSelectedGroup] = useState<string>('');

  useEffect(() => {
    const loadScores = async () => {
      setIsLoading(true);
      setError('');
      try {
        const data = await analyticsApi.getTeamPerformanceScores(period);
        setTeamScores(data);
        if (data.length > 0 && !selectedGroup) {
          setSelectedGroup(data[0].groupId);
        }
      } catch {
        setError('Failed to load performance scores');
      } finally {
        setIsLoading(false);
      }
    };

    loadScores();
  }, [period]);

  const currentTeam = teamScores.find((t) => t.groupId === selectedGroup);

  const getTeamAverageScore = () => {
    if (!currentTeam || currentTeam.players.length === 0) return 0;
    const sum = currentTeam.players.reduce((acc, p) => acc + p.performanceScore, 0);
    return (sum / currentTeam.players.length).toFixed(1);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">Performance Scores</h1>
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

          {teamScores.length > 1 && (
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 bg-white shadow focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              {teamScores.map((team) => (
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
        ) : teamScores.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <p className="text-gray-500">No teams found</p>
          </div>
        ) : currentTeam ? (
          <div className="space-y-6">
            {/* Team Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-lg p-6 text-white">
              <h2 className="text-2xl font-bold">{currentTeam.groupName}</h2>
              <p className="text-indigo-200">Performance Analysis</p>
              <div className="mt-4 grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-3xl font-bold">{currentTeam.players.length}</p>
                  <p className="text-sm text-indigo-200">Players</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold">{getTeamAverageScore()}</p>
                  <p className="text-sm text-indigo-200">Avg Score</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold">
                    {currentTeam.players.filter((p) => p.performanceScore >= 60).length}
                  </p>
                  <p className="text-sm text-indigo-200">Above 60</p>
                </div>
              </div>
            </div>

            {/* Score Legend */}
            <div className="bg-white rounded-xl shadow p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Score Breakdown</h3>
              <p className="text-xs text-gray-500 mb-3">Goals, Assists, and Clean Sheets weights vary by position (totaling 50%)</p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span className="text-gray-600">Evaluations (35%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-gray-600">Goals</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                  <span className="text-gray-600">Assists</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-cyan-500"></div>
                  <span className="text-gray-600">Clean Sheets</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-gray-600">Win Rate (10%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                  <span className="text-gray-600">Participation (5%)</span>
                </div>
              </div>
            </div>

            {/* Players Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentTeam.players.map((player, index) => (
                <PlayerScoreCard
                  key={player.playerId}
                  player={player}
                  rank={index + 1}
                  onClick={() => navigate(`/stats/player/${player.playerId}`)}
                />
              ))}
            </div>

            {currentTeam.players.length === 0 && (
              <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                <p className="text-gray-500">No players in this group</p>
              </div>
            )}
          </div>
        ) : null}
      </main>
    </div>
  );
}
