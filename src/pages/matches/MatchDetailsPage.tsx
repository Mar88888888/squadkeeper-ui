import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  matchesApi,
  type MatchDetails,
  type PlayerBrief,
  type Goal,
  type AddGoalRequest,
  type UpdateMatchResultRequest,
} from '../../api/matches';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types';
import {
  attendanceApi,
  type Attendance,
  type AttendanceRecord,
} from '../../api/attendance';
import {
  evaluationsApi,
  getEvaluationAverage,
  type Evaluation,
  type EvaluationRecord,
} from '../../api/evaluations';
import { PageHeader, PageContent } from '../../components/layout';
import { Card, CardContent, Modal, Button, Avatar } from '../../components/ui';

const EVAL_CATEGORIES = [
  { key: 'technical', label: 'Technical' },
  { key: 'tactical', label: 'Tactical' },
  { key: 'physical', label: 'Physical' },
  { key: 'psychological', label: 'Psychological' },
] as const;

type EvalCategory = (typeof EVAL_CATEGORIES)[number]['key'];

// Icons
const CalendarIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
  </svg>
);

const LocationIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
  </svg>
);

const UsersIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
  </svg>
);

const StarIcon = ({ filled = false }: { filled?: boolean }) => (
  <svg className="w-5 h-5" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
  </svg>
);

const BallIcon = () => (
  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10"/>
  </svg>
);

const CheckIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const XIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

// Avatar gradient colors
const avatarColors = [
  'from-amber-400 to-orange-500',
  'from-blue-400 to-indigo-500',
  'from-purple-400 to-violet-500',
  'from-green-400 to-teal-500',
  'from-red-400 to-rose-500',
  'from-pink-400 to-fuchsia-500',
  'from-cyan-400 to-sky-500',
];

function getPlayerColor(index: number): string {
  return avatarColors[index % avatarColors.length];
}

function getTeamInitials(name: string): string {
  return name.split(' ').map(word => word[0]).join('').slice(0, 2).toUpperCase();
}

export function MatchDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const canEdit = user?.role === UserRole.ADMIN || user?.role === UserRole.COACH;

  const [match, setMatch] = useState<MatchDetails | null>(null);
  const [, setAttendance] = useState<Attendance[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Attendance records: playerId -> isPresent
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, boolean>>({});

  const [selectedPlayer, setSelectedPlayer] = useState<PlayerBrief | null>(null);
  const [selectedPlayerIndex, setSelectedPlayerIndex] = useState(0);
  const [evalRatings, setEvalRatings] = useState<Record<EvalCategory, number>>({
    technical: 5,
    tactical: 5,
    physical: 5,
    psychological: 5,
  });
  const [evalComment, setEvalComment] = useState('');

  const [isAddGoalModalOpen, setIsAddGoalModalOpen] = useState(false);
  const [goalForm, setGoalForm] = useState<AddGoalRequest>({
    scorerId: '',
    assistId: '',
    minute: undefined,
    isOwnGoal: false,
  });

  const [isScoreModalOpen, setIsScoreModalOpen] = useState(false);
  const [scoreForm, setScoreForm] = useState<UpdateMatchResultRequest>({
    homeGoals: 0,
    awayGoals: 0,
  });

  const loadData = async () => {
    if (!id) return;
    setIsLoading(true);
    setError('');
    try {
      const [matchData, attendanceData, evaluationsData] = await Promise.all([
        matchesApi.getOne(id),
        attendanceApi.getByMatch(id),
        evaluationsApi.getByMatch(id),
      ]);
      setMatch(matchData);
      setAttendance(attendanceData);
      setEvaluations(evaluationsData);
      setGoals(matchData.goals || []);

      const records: Record<string, boolean> = {};
      matchData.group.players.forEach((player) => {
        const existing = attendanceData.find((a) => a.player.id === player.id);
        records[player.id] = existing?.isPresent ?? true;
      });
      setAttendanceRecords(records);

      if (matchData.homeGoals !== null && matchData.awayGoals !== null) {
        setScoreForm({
          homeGoals: matchData.homeGoals,
          awayGoals: matchData.awayGoals,
        });
      }
    } catch {
      setError('Failed to load match details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleAttendanceToggle = (playerId: string) => {
    setAttendanceRecords((prev) => ({
      ...prev,
      [playerId]: !prev[playerId],
    }));
  };

  const markAllPresent = () => {
    if (!match) return;
    const records: Record<string, boolean> = {};
    match.group.players.forEach((player) => {
      records[player.id] = true;
    });
    setAttendanceRecords(records);
  };

  const saveAttendance = async () => {
    if (!id || !match) return;
    setIsSaving(true);
    setError('');
    try {
      const records: AttendanceRecord[] = match.group.players.map((player) => ({
        playerId: player.id,
        isPresent: attendanceRecords[player.id] ?? true,
      }));

      const result = await attendanceApi.markBatch({
        eventId: id,
        eventType: 'MATCH',
        records,
      });
      setAttendance(result);

      // Refresh evaluations (absent players' evaluations are deleted by backend)
      const evaluationsData = await evaluationsApi.getByMatch(id);
      setEvaluations(evaluationsData);
    } catch {
      setError('Failed to save attendance');
    } finally {
      setIsSaving(false);
    }
  };

  const saveEvaluations = async () => {
    if (!id || !selectedPlayer) return;
    setIsSaving(true);
    setError('');
    try {
      // First, ensure player's attendance is saved as present
      // (required by backend before evaluation can be saved)
      await attendanceApi.markBatch({
        eventId: id,
        eventType: 'MATCH',
        records: [{ playerId: selectedPlayer.id, isPresent: true }],
      });

      const record: EvaluationRecord = {
        playerId: selectedPlayer.id,
        technical: evalRatings.technical,
        tactical: evalRatings.tactical,
        physical: evalRatings.physical,
        psychological: evalRatings.psychological,
        comment: evalComment || undefined,
      };

      await evaluationsApi.createBatch({
        matchId: id,
        records: [record],
      });

      const evaluationsData = await evaluationsApi.getByMatch(id);
      setEvaluations(evaluationsData);
      setSelectedPlayer(null);
      setEvalComment('');
    } catch {
      setError('Failed to save evaluation');
    } finally {
      setIsSaving(false);
    }
  };

  const openEvaluationModal = (player: PlayerBrief, index: number) => {
    setSelectedPlayer(player);
    setSelectedPlayerIndex(index);
    const playerEval = evaluations.find((e) => e.player.id === player.id);
    if (playerEval) {
      setEvalRatings({
        technical: playerEval.technical ?? 5,
        tactical: playerEval.tactical ?? 5,
        physical: playerEval.physical ?? 5,
        psychological: playerEval.psychological ?? 5,
      });
      setEvalComment(playerEval.comment || '');
    } else {
      setEvalRatings({ technical: 5, tactical: 5, physical: 5, psychological: 5 });
      setEvalComment('');
    }
  };

  const getPlayerEvaluation = (playerId: string): Evaluation | undefined => {
    return evaluations.find((e) => e.player.id === playerId);
  };

  const isPlayerPresent = (playerId: string): boolean => {
    return attendanceRecords[playerId] ?? true;
  };

  const canEvaluate = (playerId: string): boolean => {
    if (user?.role !== UserRole.COACH && user?.role !== UserRole.ADMIN) return false;
    return isPlayerPresent(playerId);
  };

  const handleAddGoal = async () => {
    if (!id || !goalForm.scorerId) {
      setError('Please select a scorer');
      return;
    }
    setIsSaving(true);
    setError('');
    try {
      const newGoal = await matchesApi.addGoal(id, {
        ...goalForm,
        assistId: goalForm.assistId || undefined,
      });
      setGoals((prev) => [...prev, newGoal]);
      setIsAddGoalModalOpen(false);
      setGoalForm({ scorerId: '', assistId: '', minute: undefined, isOwnGoal: false });
    } catch {
      setError('Failed to add goal');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveGoal = async (goalId: string) => {
    if (!id) return;
    setIsSaving(true);
    setError('');
    try {
      await matchesApi.removeGoal(id, goalId);
      setGoals((prev) => prev.filter((g) => g.id !== goalId));
    } catch {
      setError('Failed to remove goal');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateScore = async () => {
    if (!id) return;
    setIsSaving(true);
    setError('');
    try {
      const updated = await matchesApi.updateResult(id, scoreForm);
      setMatch((prev) =>
        prev ? { ...prev, homeGoals: updated.homeGoals, awayGoals: updated.awayGoals } : null
      );
      setIsScoreModalOpen(false);
    } catch {
      setError('Failed to update score');
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const getMatchResult = (): 'win' | 'draw' | 'loss' | null => {
    if (!match || match.homeGoals === null || match.awayGoals === null) return null;
    const ourGoals = match.isHome ? match.homeGoals : match.awayGoals;
    const theirGoals = match.isHome ? match.awayGoals : match.homeGoals;
    if (ourGoals > theirGoals) return 'win';
    if (ourGoals < theirGoals) return 'loss';
    return 'draw';
  };

  const getAttendanceStats = () => {
    let present = 0;
    let absent = 0;
    Object.values(attendanceRecords).forEach((isPresent) => {
      if (isPresent) {
        present++;
      } else {
        absent++;
      }
    });
    return { present, absent };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500 dark:text-gray-400">Match not found</div>
      </div>
    );
  }

  const result = getMatchResult();
  const ourGoals = match.isHome ? match.homeGoals : match.awayGoals;
  const theirGoals = match.isHome ? match.awayGoals : match.homeGoals;
  const stats = getAttendanceStats();
  const totalPlayers = match.group.players.length;
  const attendancePercent = totalPlayers > 0 ? Math.round((stats.present / totalPlayers) * 100) : 0;

  const resultColors = {
    win: 'from-green-500 to-emerald-600',
    draw: 'from-amber-500 to-yellow-600',
    loss: 'from-red-500 to-rose-600',
  };

  const resultLabels = {
    win: 'Victory',
    draw: 'Draw',
    loss: 'Defeat',
  };

  return (
    <>
      <PageHeader
        title="Match Details"
        subtitle={match.group.name}
        backTo="/matches"
        actions={
          canEdit && (
            <Button onClick={saveAttendance} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          )
        }
      />

      <PageContent>
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* Match Header Card */}
        <div className={`bg-gradient-to-r ${result ? resultColors[result] : 'from-blue-600 to-indigo-700'} rounded-2xl p-8 text-white mb-8 relative overflow-hidden`}>
          <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute left-20 bottom-0 w-32 h-32 bg-white/10 rounded-full translate-y-1/2"></div>

          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="px-4 py-1.5 bg-white/20 text-white text-sm font-semibold rounded-full">
                  {match.group.name}
                </span>
                <span className={`px-4 py-1.5 text-sm font-semibold rounded-full ${
                  match.isHome ? 'bg-green-400/30' : 'bg-orange-400/30'
                }`}>
                  {match.isHome ? 'Home' : 'Away'}
                </span>
                {result && (
                  <span className="px-4 py-1.5 bg-white/30 text-white text-sm font-semibold rounded-full">
                    {resultLabels[result]}
                  </span>
                )}
              </div>
              <span className="text-white/80">{formatDate(match.startTime)}, {formatTime(match.startTime)}</span>
            </div>

            <div className="flex items-center justify-between">
              {/* Our Team */}
              <div className="flex items-center gap-6 flex-1">
                <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center shadow-xl">
                  <span className="text-2xl font-bold text-green-600">{getTeamInitials(match.group.name)}</span>
                </div>
                <div>
                  <p className="text-2xl font-bold">{match.group.name}</p>
                  <p className="text-white/70">{match.isHome ? 'Home team' : 'Away team'}</p>
                </div>
              </div>

              {/* Score */}
              <div className="px-12">
                {result ? (
                  <div className="flex items-center gap-6">
                    <span className="text-6xl font-bold">{ourGoals}</span>
                    <span className="text-4xl font-bold text-white/50">:</span>
                    <span className="text-6xl font-bold text-white/70">{theirGoals}</span>
                  </div>
                ) : (
                  <div className="text-4xl font-bold text-white/50">VS</div>
                )}
                {canEdit && (
                  <button
                    onClick={() => {
                      setScoreForm({
                        homeGoals: match.homeGoals ?? 0,
                        awayGoals: match.awayGoals ?? 0,
                      });
                      setIsScoreModalOpen(true);
                    }}
                    className="mt-4 px-4 py-2 bg-white/20 hover:bg-white/30 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    {result ? 'Edit Score' : 'Set Score'}
                  </button>
                )}
              </div>

              {/* Opponent */}
              <div className="flex items-center gap-6 flex-1 justify-end text-right">
                <div>
                  <p className="text-2xl font-bold">{match.opponent}</p>
                  <p className="text-white/70">{match.isHome ? 'Away team' : 'Home team'}</p>
                </div>
                <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center shadow-xl">
                  <span className="text-2xl font-bold text-amber-600">{getTeamInitials(match.opponent)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-8 mt-6 pt-6 border-t border-white/20">
              <span className="flex items-center gap-2 text-white/80">
                <LocationIcon />
                {match.location}
              </span>
              <span className="flex items-center gap-2 text-white/80">
                <UsersIcon />
                {totalPlayers} players
              </span>
              <span className="flex items-center gap-2 text-white/80">
                <CalendarIcon />
                {formatTime(match.startTime)}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Goals Section */}
            <Card>
              <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Match Events</h3>
                {canEdit && (
                  <button
                    onClick={() => setIsAddGoalModalOpen(true)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm font-medium rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
                    </svg>
                    Add Goal
                  </button>
                )}
              </div>
              <CardContent>
                {goals.length === 0 ? (
                  <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                    No goals recorded for this match
                  </div>
                ) : (
                  <div className="space-y-4">
                    {goals
                      .sort((a, b) => (a.minute || 0) - (b.minute || 0))
                      .map((goal) => (
                        <div
                          key={goal.id}
                          className={`flex items-center gap-4 p-4 rounded-xl border ${
                            goal.isOwnGoal
                              ? 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/50'
                              : 'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-900/50'
                          }`}
                        >
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                            goal.isOwnGoal ? 'bg-red-500' : 'bg-green-500'
                          }`}>
                            <BallIcon />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-gray-900 dark:text-white">
                                {goal.isOwnGoal ? 'Own Goal' : 'Goal!'}
                              </span>
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                {goal.scorer.firstName} {goal.scorer.lastName}
                              </span>
                            </div>
                            {goal.assist && (
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                Assist: {goal.assist.firstName} {goal.assist.lastName}
                              </p>
                            )}
                          </div>
                          {goal.minute && (
                            <span className={`text-lg font-bold ${
                              goal.isOwnGoal ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                            }`}>
                              {goal.minute}'
                            </span>
                          )}
                          {canEdit && (
                            <button
                              onClick={() => handleRemoveGoal(goal.id)}
                              className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                              </svg>
                            </button>
                          )}
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Attendance Section */}
            <Card>
              <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Squad</h3>
                  <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-semibold rounded-full">
                    {stats.present}/{totalPlayers} present
                  </span>
                </div>
                {canEdit && (
                  <button
                    onClick={markAllPresent}
                    className="text-sm text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-medium"
                  >
                    Mark all present
                  </button>
                )}
              </div>
              <CardContent>
                <div className="space-y-3">
                  {match.group.players.map((player, index) => {
                    const isPresent = attendanceRecords[player.id] ?? true;
                    const playerEval = getPlayerEvaluation(player.id);
                    const avgRating = playerEval ? getEvaluationAverage(playerEval) : null;
                    const playerCanEvaluate = canEvaluate(player.id);

                    return (
                      <div
                        key={player.id}
                        className={`flex items-center justify-between p-4 rounded-xl transition-colors ${
                          isPresent
                            ? 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
                            : 'bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <Avatar
                            name={`${player.firstName} ${player.lastName}`}
                            className={`bg-gradient-to-br ${!isPresent ? 'from-gray-300 to-gray-400' : getPlayerColor(index)}`}
                          />
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {player.firstName} {player.lastName}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{player.position}</p>
                          </div>
                          {avgRating !== null && (
                            <span className="px-2 py-1 text-sm font-bold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                              {avgRating}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          {canEdit ? (
                            <button
                              onClick={() => handleAttendanceToggle(player.id)}
                              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                                isPresent
                                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
                                  : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50'
                              }`}
                            >
                              {isPresent ? <CheckIcon /> : <XIcon />}
                              {isPresent ? 'Present' : 'Absent'}
                            </button>
                          ) : (
                            <span
                              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm ${
                                isPresent
                                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                  : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                              }`}
                            >
                              {isPresent ? <CheckIcon /> : <XIcon />}
                              {isPresent ? 'Present' : 'Absent'}
                            </span>
                          )}
                          {canEdit && (
                            <button
                              onClick={() => playerCanEvaluate && openEvaluationModal(player, index)}
                              className={`p-2 rounded-lg transition-colors ${
                                playerCanEvaluate
                                  ? 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/30'
                                  : 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                              }`}
                              title={playerCanEvaluate ? 'Rate player' : 'Player must be present to rate'}
                              disabled={!playerCanEvaluate}
                            >
                              <StarIcon filled={avgRating !== null} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Match Summary */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Match Summary</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Goals scored</span>
                  <span className="text-lg font-bold text-green-600 dark:text-green-400">{ourGoals ?? 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-xl">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Goals conceded</span>
                  <span className="text-lg font-bold text-red-600 dark:text-red-400">{theirGoals ?? 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Total goals recorded</span>
                  <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{goals.length}</span>
                </div>
              </div>
            </Card>

            {/* Attendance Stats */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Attendance</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Attendance rate</span>
                  <span className="text-lg font-bold text-green-600 dark:text-green-400">{attendancePercent}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${attendancePercent}%` }}
                  ></div>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
                    <p className="text-xl font-bold text-green-600 dark:text-green-400">{stats.present}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Present</p>
                  </div>
                  <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-xl">
                    <p className="text-xl font-bold text-red-600 dark:text-red-400">{stats.absent}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Absent</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Top Players (those with evaluations) */}
            {evaluations.length > 0 && (
              <Card>
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Top Players</h3>
                </div>
                <CardContent className="space-y-3">
                  {evaluations
                    .slice()
                    .sort((a, b) => (getEvaluationAverage(b) ?? 0) - (getEvaluationAverage(a) ?? 0))
                    .slice(0, 3)
                    .map((evaluation, index) => {
                      const avg = getEvaluationAverage(evaluation);
                      const playerIndex = match.group.players.findIndex(p => p.id === evaluation.player.id);
                      return (
                        <div
                          key={evaluation.id}
                          className={`flex items-center gap-4 p-3 rounded-xl ${
                            index === 0
                              ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/50'
                              : 'bg-gray-50 dark:bg-gray-800'
                          }`}
                        >
                          <Avatar
                            name={`${evaluation.player.firstName} ${evaluation.player.lastName}`}
                            className={`bg-gradient-to-br ${getPlayerColor(playerIndex >= 0 ? playerIndex : index)}`}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 dark:text-white truncate">
                              {evaluation.player.firstName} {evaluation.player.lastName}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                              {evaluation.player.position}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            <StarIcon filled />
                            <span className="font-bold text-amber-600 dark:text-amber-400">{avg}</span>
                          </div>
                        </div>
                      );
                    })}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </PageContent>

      {/* Evaluation Modal */}
      <Modal
        isOpen={!!selectedPlayer}
        onClose={() => setSelectedPlayer(null)}
        title="Player Evaluation"
      >
        {selectedPlayer && (
          <div>
            <div className="flex items-center gap-4 mb-6">
              <Avatar
                name={`${selectedPlayer.firstName} ${selectedPlayer.lastName}`}
                size="lg"
                className={`bg-gradient-to-br ${getPlayerColor(selectedPlayerIndex)}`}
              />
              <div>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {selectedPlayer.firstName} {selectedPlayer.lastName}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Match evaluation</p>
              </div>
            </div>

            <div className="space-y-5">
              {EVAL_CATEGORIES.map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    {label}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={evalRatings[key]}
                      onChange={(e) =>
                        setEvalRatings((prev) => ({
                          ...prev,
                          [key]: parseInt(e.target.value),
                        }))
                      }
                      className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                    />
                    <span className="w-8 text-center font-bold text-amber-600 dark:text-amber-400">
                      {evalRatings[key]}
                    </span>
                  </div>
                </div>
              ))}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Comment
                </label>
                <textarea
                  value={evalComment}
                  onChange={(e) => setEvalComment(e.target.value)}
                  rows={3}
                  placeholder="Add a comment about the player..."
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <Button variant="secondary" onClick={() => setSelectedPlayer(null)} className="flex-1">
                Cancel
              </Button>
              <button
                onClick={saveEvaluations}
                disabled={isSaving}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold rounded-xl shadow-lg shadow-amber-500/30 transition-all disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Evaluation'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Add Goal Modal */}
      <Modal
        isOpen={isAddGoalModalOpen}
        onClose={() => setIsAddGoalModalOpen(false)}
        title="Add Goal"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Scorer *
            </label>
            <select
              value={goalForm.scorerId}
              onChange={(e) => setGoalForm((prev) => ({ ...prev, scorerId: e.target.value }))}
              className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="">Select player</option>
              {match.group.players.map((player) => (
                <option key={player.id} value={player.id}>
                  {player.firstName} {player.lastName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Assist <span className="text-gray-400 dark:text-gray-500 font-normal">(optional)</span>
            </label>
            <select
              value={goalForm.assistId || ''}
              onChange={(e) => setGoalForm((prev) => ({ ...prev, assistId: e.target.value }))}
              className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="">No assist</option>
              {match.group.players
                .filter((p) => p.id !== goalForm.scorerId)
                .map((player) => (
                  <option key={player.id} value={player.id}>
                    {player.firstName} {player.lastName}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Minute <span className="text-gray-400 dark:text-gray-500 font-normal">(optional)</span>
            </label>
            <input
              type="number"
              min="1"
              max="120"
              value={goalForm.minute || ''}
              onChange={(e) =>
                setGoalForm((prev) => ({
                  ...prev,
                  minute: e.target.value ? parseInt(e.target.value) : undefined,
                }))
              }
              className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              placeholder="e.g., 45"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isOwnGoal"
              checked={goalForm.isOwnGoal}
              onChange={(e) => setGoalForm((prev) => ({ ...prev, isOwnGoal: e.target.checked }))}
              className="w-4 h-4 text-green-600 border-gray-300 dark:border-gray-600 rounded focus:ring-green-500"
            />
            <label htmlFor="isOwnGoal" className="text-sm text-gray-700 dark:text-gray-300">
              Own goal
            </label>
          </div>

          <div className="flex items-center gap-3 pt-4">
            <Button variant="secondary" onClick={() => setIsAddGoalModalOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleAddGoal} disabled={isSaving} className="flex-1">
              {isSaving ? 'Adding...' : 'Add Goal'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Score Modal */}
      <Modal
        isOpen={isScoreModalOpen}
        onClose={() => setIsScoreModalOpen(false)}
        title={match.homeGoals !== null ? 'Edit Score' : 'Set Score'}
        size="sm"
      >
        <div className="flex items-center justify-center gap-6 py-4">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {match.isHome ? match.group.name : match.opponent}
            </p>
            <input
              type="number"
              min="0"
              max="99"
              value={scoreForm.homeGoals}
              onChange={(e) =>
                setScoreForm((prev) => ({
                  ...prev,
                  homeGoals: parseInt(e.target.value) || 0,
                }))
              }
              className="w-20 h-20 text-4xl font-bold text-center border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>
          <span className="text-3xl font-bold text-gray-300 dark:text-gray-600">:</span>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {match.isHome ? match.opponent : match.group.name}
            </p>
            <input
              type="number"
              min="0"
              max="99"
              value={scoreForm.awayGoals}
              onChange={(e) =>
                setScoreForm((prev) => ({
                  ...prev,
                  awayGoals: parseInt(e.target.value) || 0,
                }))
              }
              className="w-20 h-20 text-4xl font-bold text-center border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 mt-4">
          <Button variant="secondary" onClick={() => setIsScoreModalOpen(false)} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleUpdateScore} disabled={isSaving} className="flex-1">
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </Modal>
    </>
  );
}
