import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  matchesApi,
  type MatchDetails,
  type PlayerBrief,
  type Goal,
  type AddGoalRequest,
  type UpdateMatchResultRequest,
} from '../api/matches';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';
import {
  attendanceApi,
  AttendanceStatus,
  type Attendance,
  type AttendanceRecord,
} from '../api/attendance';
import {
  evaluationsApi,
  getEvaluationAverage,
  type Evaluation,
  type EvaluationRecord,
} from '../api/evaluations';

const EVALUATION_CATEGORIES = ['technical', 'tactical', 'physical', 'psychological'] as const;
type EvaluationCategory = (typeof EVALUATION_CATEGORIES)[number];

const EvaluationCategoryLabels: Record<EvaluationCategory, string> = {
  technical: 'Technical',
  tactical: 'Tactical',
  physical: 'Physical',
  psychological: 'Psychological',
};

const AttendanceStatusLabels: Record<AttendanceStatus, string> = {
  [AttendanceStatus.PRESENT]: 'Present',
  [AttendanceStatus.ABSENT]: 'Absent',
  [AttendanceStatus.SICK]: 'Sick',
  [AttendanceStatus.LATE]: 'Late',
  [AttendanceStatus.BENCHED]: 'Benched',
};

const AttendanceStatusColors: Record<AttendanceStatus, string> = {
  [AttendanceStatus.PRESENT]: 'bg-green-100 text-green-800',
  [AttendanceStatus.ABSENT]: 'bg-red-100 text-red-800',
  [AttendanceStatus.SICK]: 'bg-yellow-100 text-yellow-800',
  [AttendanceStatus.LATE]: 'bg-orange-100 text-orange-800',
  [AttendanceStatus.BENCHED]: 'bg-gray-100 text-gray-800',
};

type Tab = 'attendance' | 'evaluations' | 'goals';

export function MatchDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const canEdit = user?.role === UserRole.ADMIN || user?.role === UserRole.COACH;
  const isReadOnly = !canEdit;

  const [match, setMatch] = useState<MatchDetails | null>(null);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('attendance');
  const [isSaving, setIsSaving] = useState(false);

  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, AttendanceStatus>>({});

  const [selectedPlayer, setSelectedPlayer] = useState<PlayerBrief | null>(null);
  const [evalRatings, setEvalRatings] = useState<Record<EvaluationCategory, number>>({
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

      const records: Record<string, AttendanceStatus> = {};
      matchData.group.players.forEach((player) => {
        const existing = attendanceData.find((a) => a.player.id === player.id);
        records[player.id] = existing?.status || AttendanceStatus.PRESENT;
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

  const handleAttendanceChange = (playerId: string, status: AttendanceStatus) => {
    setAttendanceRecords((prev) => ({ ...prev, [playerId]: status }));
  };

  const saveAttendance = async () => {
    if (!id || !match) return;
    setIsSaving(true);
    setError('');
    try {
      const records: AttendanceRecord[] = match.group.players.map((player) => ({
        playerId: player.id,
        status: attendanceRecords[player.id] || AttendanceStatus.PRESENT,
      }));

      const result = await attendanceApi.markBatch({
        eventId: id,
        eventType: 'MATCH',
        records,
      });
      setAttendance(result);
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
      setError('Failed to save evaluations');
    } finally {
      setIsSaving(false);
    }
  };

  const openEvaluationModal = (player: PlayerBrief) => {
    setSelectedPlayer(player);
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
      setEvalRatings({
        technical: 5,
        tactical: 5,
        physical: 5,
        psychological: 5,
      });
      setEvalComment('');
    }
  };

  const getPlayerEvaluation = (playerId: string): Evaluation | undefined => {
    return evaluations.find((e) => e.player.id === playerId);
  };

  const getPlayerAttendance = (playerId: string): AttendanceStatus | null => {
    const record = attendance.find((a) => a.player.id === playerId);
    return record?.status || null;
  };

  const canEvaluate = (playerId: string): boolean => {
    const status = getPlayerAttendance(playerId);
    return status === AttendanceStatus.PRESENT || status === AttendanceStatus.LATE;
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
        prev
          ? { ...prev, homeGoals: updated.homeGoals, awayGoals: updated.awayGoals }
          : null
      );
      setIsScoreModalOpen(false);
    } catch {
      setError('Failed to update score');
    } finally {
      setIsSaving(false);
    }
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatScore = () => {
    if (!match || match.homeGoals === null || match.awayGoals === null) {
      return null;
    }
    return match.isHome
      ? `${match.homeGoals} - ${match.awayGoals}`
      : `${match.awayGoals} - ${match.homeGoals}`;
  };

  const getMatchResult = (): 'win' | 'draw' | 'loss' | null => {
    if (!match || match.homeGoals === null || match.awayGoals === null) return null;
    const ourGoals = match.isHome ? match.homeGoals : match.awayGoals;
    const theirGoals = match.isHome ? match.awayGoals : match.homeGoals;
    if (ourGoals > theirGoals) return 'win';
    if (ourGoals < theirGoals) return 'loss';
    return 'draw';
  };

  const resultColors = {
    win: 'bg-green-100 text-green-700',
    draw: 'bg-yellow-100 text-yellow-700',
    loss: 'bg-red-100 text-red-700',
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-500">Match not found</div>
      </div>
    );
  }

  const score = formatScore();
  const result = getMatchResult();

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-gray-900">
                  vs {match.opponent}
                </h1>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                    match.isHome
                      ? 'bg-green-100 text-green-700'
                      : 'bg-orange-100 text-orange-700'
                  }`}
                >
                  {match.isHome ? 'Home' : 'Away'}
                </span>
                {result && (
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${resultColors[result]}`}
                  >
                    {result.charAt(0).toUpperCase() + result.slice(1)}
                  </span>
                )}
              </div>
              {score && (
                <p className="text-2xl font-bold text-gray-800 mt-1">{score}</p>
              )}
              <p className="text-sm text-gray-500 mt-1">{match.group.name}</p>
              <p className="text-sm text-gray-600 mt-1">{formatDateTime(match.startTime)}</p>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                  </svg>
                  {match.location}
                </span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <button
                onClick={() => navigate('/matches')}
                className="text-gray-600 hover:text-gray-900"
              >
                Back to Matches
              </button>
              {canEdit && (
                <button
                  onClick={() => {
                    setScoreForm({
                      homeGoals: match.homeGoals ?? 0,
                      awayGoals: match.awayGoals ?? 0,
                    });
                    setIsScoreModalOpen(true);
                  }}
                  className="text-sm px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {score ? 'Edit Score' : 'Set Score'}
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('attendance')}
                className={`px-6 py-4 text-sm font-medium ${
                  activeTab === 'attendance'
                    ? 'text-green-600 border-b-2 border-green-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Attendance
              </button>
              <button
                onClick={() => setActiveTab('evaluations')}
                className={`px-6 py-4 text-sm font-medium ${
                  activeTab === 'evaluations'
                    ? 'text-green-600 border-b-2 border-green-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Evaluations
              </button>
              <button
                onClick={() => setActiveTab('goals')}
                className={`px-6 py-4 text-sm font-medium ${
                  activeTab === 'goals'
                    ? 'text-green-600 border-b-2 border-green-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Goals ({goals.length})
              </button>
            </nav>
          </div>

          {activeTab === 'attendance' && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  {isReadOnly ? 'Attendance' : `Players (${match.group.players.length})`}
                </h2>
                {canEdit && (
                  <button
                    onClick={saveAttendance}
                    disabled={isSaving}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    {isSaving ? 'Saving...' : 'Save Attendance'}
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {match.group.players.map((player) => {
                  const playerStatus = attendanceRecords[player.id] || getPlayerAttendance(player.id);
                  return (
                    <div
                      key={player.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-gray-900">
                          {player.firstName} {player.lastName}
                        </p>
                        <p className="text-sm text-gray-500">{player.position}</p>
                      </div>
                      {isReadOnly ? (
                        <span
                          className={`px-3 py-2 rounded-lg font-medium ${
                            playerStatus ? AttendanceStatusColors[playerStatus] : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {playerStatus ? AttendanceStatusLabels[playerStatus] : 'Not marked'}
                        </span>
                      ) : (
                        <select
                          value={attendanceRecords[player.id] || AttendanceStatus.PRESENT}
                          onChange={(e) =>
                            handleAttendanceChange(player.id, e.target.value as AttendanceStatus)
                          }
                          className={`px-3 py-2 rounded-lg border-0 font-medium ${
                            AttendanceStatusColors[
                              attendanceRecords[player.id] || AttendanceStatus.PRESENT
                            ]
                          }`}
                        >
                          {Object.values(AttendanceStatus).map((status) => (
                            <option key={status} value={status}>
                              {AttendanceStatusLabels[status]}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'evaluations' && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  {isReadOnly ? 'Evaluations' : 'Player Evaluations'}
                </h2>
                {canEdit && (
                  <p className="text-sm text-gray-500">
                    Only present players can be evaluated
                  </p>
                )}
              </div>

              <div className="space-y-3">
                {match.group.players.map((player) => {
                  const playerEval = getPlayerEvaluation(player.id);
                  const playerCanEvaluate = canEvaluate(player.id);
                  const playerStatus = getPlayerAttendance(player.id);
                  const avgRating = playerEval ? getEvaluationAverage(playerEval) : null;

                  if (isReadOnly) {
                    return (
                      <div key={player.id} className="p-4 rounded-lg bg-gray-50">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="font-medium text-gray-900">
                              {player.firstName} {player.lastName}
                            </p>
                            <p className="text-sm text-gray-500">{player.position}</p>
                          </div>
                          {avgRating !== null && (
                            <div className="text-right">
                              <p className="text-xs text-gray-500">Average</p>
                              <p className="text-xl font-bold text-green-600">{avgRating}</p>
                            </div>
                          )}
                        </div>
                        {playerEval ? (
                          <>
                            <div className="grid grid-cols-4 gap-2">
                              {EVALUATION_CATEGORIES.map((category) => (
                                <div
                                  key={category}
                                  className="text-center p-2 bg-white rounded-lg"
                                >
                                  <p className="text-xs text-gray-500">
                                    {EvaluationCategoryLabels[category]}
                                  </p>
                                  <p className="text-lg font-bold text-gray-900">
                                    {playerEval[category] ?? '-'}
                                  </p>
                                </div>
                              ))}
                            </div>
                            {playerEval.comment && (
                              <p className="mt-2 text-sm text-gray-600 italic">
                                "{playerEval.comment}"
                              </p>
                            )}
                          </>
                        ) : (
                          <p className="text-sm text-gray-400">No evaluations yet</p>
                        )}
                      </div>
                    );
                  }

                  return (
                    <div
                      key={player.id}
                      className={`p-4 rounded-lg ${playerCanEvaluate ? 'bg-gray-50' : 'bg-gray-100 opacity-60'}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="font-medium text-gray-900">
                              {player.firstName} {player.lastName}
                            </p>
                            <p className="text-sm text-gray-500">{player.position}</p>
                          </div>
                          {playerStatus && !playerCanEvaluate && (
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${AttendanceStatusColors[playerStatus]}`}>
                              {AttendanceStatusLabels[playerStatus]}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          {avgRating !== null && (
                            <span className="text-lg font-bold text-green-600">{avgRating}</span>
                          )}
                          {playerCanEvaluate ? (
                            <button
                              onClick={() => openEvaluationModal(player)}
                              className="px-3 py-1 text-sm text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            >
                              {playerEval ? 'Edit' : 'Add'} Evaluation
                            </button>
                          ) : (
                            <span className="text-sm text-gray-400">
                              {playerStatus ? 'Not present' : 'Mark attendance first'}
                            </span>
                          )}
                        </div>
                      </div>

                      {playerEval && playerCanEvaluate && (
                        <>
                          <div className="mt-3 grid grid-cols-4 gap-2">
                            {EVALUATION_CATEGORIES.map((category) => (
                              <div
                                key={category}
                                className="text-center p-2 bg-white rounded-lg"
                              >
                                <p className="text-xs text-gray-500">
                                  {EvaluationCategoryLabels[category]}
                                </p>
                                <p className="text-lg font-bold text-gray-900">
                                  {playerEval[category] ?? '-'}
                                </p>
                              </div>
                            ))}
                          </div>
                          {playerEval.comment && (
                            <p className="mt-2 text-sm text-gray-600 italic">
                              "{playerEval.comment}"
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'goals' && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Goals</h2>
                {canEdit && (
                  <button
                    onClick={() => setIsAddGoalModalOpen(true)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    + Add Goal
                  </button>
                )}
              </div>

              {goals.length === 0 ? (
                <div className="py-12 text-center text-gray-500">
                  No goals recorded for this match
                </div>
              ) : (
                <div className="space-y-3">
                  {goals
                    .sort((a, b) => (a.minute || 0) - (b.minute || 0))
                    .map((goal) => (
                      <div
                        key={goal.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-4">
                          {goal.minute && (
                            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                              <span className="text-lg font-bold text-green-700">
                                {goal.minute}'
                              </span>
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-gray-900">
                                {goal.scorer.firstName} {goal.scorer.lastName}
                              </p>
                              {goal.isOwnGoal && (
                                <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded-full">
                                  OG
                                </span>
                              )}
                            </div>
                            {goal.assist && (
                              <p className="text-sm text-gray-500">
                                Assist: {goal.assist.firstName} {goal.assist.lastName}
                              </p>
                            )}
                          </div>
                        </div>
                        {canEdit && (
                          <button
                            onClick={() => handleRemoveGoal(goal.id)}
                            className="text-red-600 hover:text-red-700 text-sm"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {selectedPlayer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Evaluate {selectedPlayer.firstName} {selectedPlayer.lastName}
            </h2>
            <p className="text-sm text-gray-500 mb-6">Rate from 1 to 10</p>

            <div className="space-y-4">
              {EVALUATION_CATEGORIES.map((category) => (
                <div key={category}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {EvaluationCategoryLabels[category]}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={evalRatings[category]}
                      onChange={(e) =>
                        setEvalRatings((prev) => ({
                          ...prev,
                          [category]: parseInt(e.target.value),
                        }))
                      }
                      className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
                    />
                    <span className="w-8 text-center font-bold text-gray-900">
                      {evalRatings[category]}
                    </span>
                  </div>
                </div>
              ))}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comment (optional)
                </label>
                <textarea
                  value={evalComment}
                  onChange={(e) => setEvalComment(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  rows={3}
                  placeholder="Add a comment about this player's performance..."
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setSelectedPlayer(null);
                  setEvalComment('');
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveEvaluations}
                disabled={isSaving}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isAddGoalModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Add Goal</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Scorer *
                </label>
                <select
                  value={goalForm.scorerId}
                  onChange={(e) =>
                    setGoalForm((prev) => ({ ...prev, scorerId: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assist <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <select
                  value={goalForm.assistId || ''}
                  onChange={(e) =>
                    setGoalForm((prev) => ({ ...prev, assistId: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Minute <span className="text-gray-400 font-normal">(optional)</span>
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="e.g., 45"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isOwnGoal"
                  checked={goalForm.isOwnGoal}
                  onChange={(e) =>
                    setGoalForm((prev) => ({ ...prev, isOwnGoal: e.target.checked }))
                  }
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <label htmlFor="isOwnGoal" className="text-sm text-gray-700">
                  Own goal
                </label>
              </div>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsAddGoalModalOpen(false);
                  setError('');
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddGoal}
                disabled={isSaving}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {isSaving ? 'Adding...' : 'Add Goal'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isScoreModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full mx-4 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {match.homeGoals !== null ? 'Edit Score' : 'Set Score'}
            </h2>

            <div className="flex items-center justify-center gap-4">
              <div className="text-center">
                <p className="text-sm font-medium text-gray-700 mb-2">
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
                  className="w-20 h-16 text-3xl font-bold text-center border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <span className="text-2xl font-bold text-gray-400">-</span>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-700 mb-2">
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
                  className="w-20 h-16 text-3xl font-bold text-center border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setIsScoreModalOpen(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateScore}
                disabled={isSaving}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
