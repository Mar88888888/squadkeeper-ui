import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { trainingsApi, type TrainingDetails, type PlayerBrief } from '../../api/trainings';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types';
import {
  attendanceApi,
  AttendanceStatus,
  type Attendance,
  type AttendanceRecord,
} from '../../api/attendance';
import {
  evaluationsApi,
  getEvaluationAverage,
  type Evaluation,
  type EvaluationRecord,
} from '../../api/evaluations';
import {
  AttendanceStatusLabels,
  AttendanceStatusColors,
} from '../../constants/attendance.constants';

const EVAL_CATEGORIES = [
  { key: 'technical', label: 'Technical' },
  { key: 'tactical', label: 'Tactical' },
  { key: 'physical', label: 'Physical' },
  { key: 'psychological', label: 'Psychological' },
] as const;

type EvalCategory = typeof EVAL_CATEGORIES[number]['key'];
type Tab = 'attendance' | 'evaluations';

export function TrainingDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const canEdit = user?.role === UserRole.ADMIN || user?.role === UserRole.COACH;
  const isReadOnly = !canEdit;

  const [training, setTraining] = useState<TrainingDetails | null>(null);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('attendance');
  const [isSaving, setIsSaving] = useState(false);

  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, AttendanceStatus>>({});

  const [selectedPlayer, setSelectedPlayer] = useState<PlayerBrief | null>(null);
  const [evalRatings, setEvalRatings] = useState<Record<EvalCategory, number>>({
    technical: 5,
    tactical: 5,
    physical: 5,
    psychological: 5,
  });
  const [evalComment, setEvalComment] = useState('');

  const loadData = async () => {
    if (!id) return;
    setIsLoading(true);
    setError('');
    try {
      const [trainingData, attendanceData, evaluationsData] = await Promise.all([
        trainingsApi.getOne(id),
        attendanceApi.getByTraining(id),
        evaluationsApi.getByTraining(id),
      ]);
      setTraining(trainingData);
      setAttendance(attendanceData);
      setEvaluations(evaluationsData);

      const records: Record<string, AttendanceStatus> = {};
      trainingData.group.players.forEach((player) => {
        const existing = attendanceData.find((a) => a.player.id === player.id);
        records[player.id] = existing?.status || AttendanceStatus.PRESENT;
      });
      setAttendanceRecords(records);
    } catch {
      setError('Failed to load training details');
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
    if (!id || !training) return;
    setIsSaving(true);
    setError('');
    try {
      const records: AttendanceRecord[] = training.group.players.map((player) => ({
        playerId: player.id,
        status: attendanceRecords[player.id] || AttendanceStatus.PRESENT,
      }));

      const result = await attendanceApi.markBatch({
        eventId: id,
        eventType: 'TRAINING',
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
        trainingId: id,
        records: [record],
      });

      const evaluationsData = await evaluationsApi.getByTraining(id);
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

  const isPlayerPresent = (playerId: string): boolean => {
    const status = getPlayerAttendance(playerId);
    return status === AttendanceStatus.PRESENT || status === AttendanceStatus.LATE;
  };

  const canEvaluate = (playerId: string): boolean => {
    if (user?.role !== UserRole.COACH) return false;
    return isPlayerPresent(playerId);
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!training) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400">Training not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950">
      <header className="bg-white dark:bg-gray-900 shadow border-t-4 border-green-500">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">{training.group.name}</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{formatDateTime(training.startTime)}</p>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                  </svg>
                  {training.location}
                </span>
                {training.topic && <span>| {training.topic}</span>}
              </div>
            </div>
            <button
              onClick={() => navigate('/trainings')}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
            >
              Back to Trainings
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-gray-700 text-red-700 dark:text-red-400 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('attendance')}
                className={`px-6 py-4 text-sm font-medium transition-all duration-200 ${
                  activeTab === 'attendance'
                    ? 'text-green-600 border-b-2 border-green-600'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 border-b-2 border-transparent'
                }`}
              >
                Attendance
              </button>
              <button
                onClick={() => setActiveTab('evaluations')}
                className={`px-6 py-4 text-sm font-medium transition-all duration-200 ${
                  activeTab === 'evaluations'
                    ? 'text-green-600 border-b-2 border-green-600'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 border-b-2 border-transparent'
                }`}
              >
                Evaluations
              </button>
            </nav>
          </div>

          {activeTab === 'attendance' && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold tracking-tight text-gray-900 dark:text-gray-100">
                  {isReadOnly ? 'Attendance' : `Players (${training.group.players.length})`}
                </h2>
                {canEdit && (
                  <button
                    onClick={saveAttendance}
                    disabled={isSaving}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 active:scale-95 disabled:opacity-50 transition-all"
                  >
                    {isSaving ? 'Saving...' : 'Save Attendance'}
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {training.group.players.map((player) => {
                  const playerStatus = attendanceRecords[player.id] || getPlayerAttendance(player.id);
                  return (
                    <div
                      key={player.id}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {player.firstName} {player.lastName}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{player.position}</p>
                      </div>
                      {isReadOnly ? (
                        <span
                          className={`px-3 py-2 rounded-lg font-medium ${
                            playerStatus ? AttendanceStatusColors[playerStatus] : 'bg-gray-100 dark:bg-gray-950 text-gray-600 dark:text-gray-400'
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
                <h2 className="text-lg font-semibold tracking-tight text-gray-900 dark:text-gray-100">
                  {isReadOnly ? 'Evaluations' : 'Player Evaluations'}
                </h2>
                {user?.role === UserRole.COACH && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Only present players can be evaluated
                  </p>
                )}
              </div>

              <div className="space-y-3">
                {training.group.players.map((player) => {
                  const playerEval = getPlayerEvaluation(player.id);
                  const playerCanEvaluate = canEvaluate(player.id);
                  const playerStatus = getPlayerAttendance(player.id);
                  const avgRating = playerEval ? getEvaluationAverage(playerEval) : null;

                  if (isReadOnly) {
                    return (
                      <div key={player.id} className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                              {player.firstName} {player.lastName}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{player.position}</p>
                          </div>
                          {avgRating !== null && (
                            <div className="text-center px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                              <p className="text-lg font-bold text-yellow-700 dark:text-yellow-400">{avgRating}</p>
                              <p className="text-xs text-yellow-600 dark:text-yellow-400">Avg</p>
                            </div>
                          )}
                        </div>
                        {playerEval ? (
                          <>
                            <div className="grid grid-cols-4 gap-2">
                              {EVAL_CATEGORIES.map(({ key, label }) => (
                                <div key={key} className="text-center p-2 bg-white dark:bg-gray-900 rounded-lg">
                                  <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">{label}</p>
                                  <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                    {playerEval[key] ?? '-'}
                                  </p>
                                </div>
                              ))}
                            </div>
                            {playerEval.comment && (
                              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 italic">
                                "{playerEval.comment}"
                              </p>
                            )}
                          </>
                        ) : (
                          <p className="text-sm text-gray-400 dark:text-gray-500">No evaluation yet</p>
                        )}
                      </div>
                    );
                  }

                  const playerPresent = isPlayerPresent(player.id);

                  return (
                    <div
                      key={player.id}
                      className={`p-4 rounded-lg ${playerPresent ? 'bg-gray-50 dark:bg-gray-800' : 'bg-gray-100 dark:bg-gray-950 opacity-60'}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                              {player.firstName} {player.lastName}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{player.position}</p>
                          </div>
                          {playerStatus && (
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${AttendanceStatusColors[playerStatus]}`}>
                              {AttendanceStatusLabels[playerStatus]}
                            </span>
                          )}
                          {avgRating !== null && (
                            <span className="px-2 py-1 text-sm font-bold text-yellow-700 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                              Avg: {avgRating}
                            </span>
                          )}
                        </div>
                        {playerCanEvaluate ? (
                          <button
                            onClick={() => openEvaluationModal(player)}
                            className="px-3 py-1 text-sm text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                          >
                            {playerEval ? 'Edit' : 'Add'} Evaluation
                          </button>
                        ) : !playerPresent && user?.role === UserRole.COACH ? (
                          <span className="text-sm text-gray-400 dark:text-gray-500">
                            {playerStatus ? 'Not present' : 'Mark attendance first'}
                          </span>
                        ) : null}
                      </div>

                      {playerEval && playerPresent && (
                        <div className="mt-3 grid grid-cols-4 gap-2">
                          {EVAL_CATEGORIES.map(({ key, label }) => (
                            <div key={key} className="text-center p-2 bg-white dark:bg-gray-900 rounded-lg">
                              <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">{label}</p>
                              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                {playerEval[key] ?? '-'}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>

      {selectedPlayer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <h2 className="text-lg font-semibold tracking-tight text-gray-900 dark:text-gray-100 mb-2">
              Evaluate {selectedPlayer.firstName} {selectedPlayer.lastName}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Rate from 1 to 10</p>

            <div className="space-y-4">
              {EVAL_CATEGORIES.map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                      className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-green-600"
                    />
                    <span className="w-8 text-center font-bold text-gray-900 dark:text-gray-100">
                      {evalRatings[key]}
                    </span>
                  </div>
                </div>
              ))}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Comment (optional)
                </label>
                <textarea
                  value={evalComment}
                  onChange={(e) => setEvalComment(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-800 dark:text-gray-100"
                  placeholder="Add a comment..."
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setSelectedPlayer(null)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveEvaluations}
                disabled={isSaving}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 active:scale-95 disabled:opacity-50 transition-all"
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
