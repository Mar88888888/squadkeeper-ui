import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { trainingsApi, type TrainingDetails, type PlayerBrief } from '../api/trainings';
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
  EvaluationType,
  EvaluationTypeLabels,
  type Evaluation,
  type EvaluationRecord,
} from '../api/evaluations';

const AttendanceStatusLabels: Record<AttendanceStatus, string> = {
  [AttendanceStatus.PRESENT]: 'Present',
  [AttendanceStatus.ABSENT]: 'Absent',
  [AttendanceStatus.SICK]: 'Sick',
  [AttendanceStatus.LATE]: 'Late',
  [AttendanceStatus.EXCUSED]: 'Excused',
};

const AttendanceStatusColors: Record<AttendanceStatus, string> = {
  [AttendanceStatus.PRESENT]: 'bg-green-100 text-green-800',
  [AttendanceStatus.ABSENT]: 'bg-red-100 text-red-800',
  [AttendanceStatus.SICK]: 'bg-yellow-100 text-yellow-800',
  [AttendanceStatus.LATE]: 'bg-orange-100 text-orange-800',
  [AttendanceStatus.EXCUSED]: 'bg-blue-100 text-blue-800',
};

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

  // Attendance state
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, AttendanceStatus>>({});

  // Evaluation state
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerBrief | null>(null);
  const [evalRatings, setEvalRatings] = useState<Record<EvaluationType, number>>({
    [EvaluationType.TECHNICAL]: 5,
    [EvaluationType.TACTICAL]: 5,
    [EvaluationType.PHYSICAL]: 5,
    [EvaluationType.PSYCHOLOGICAL]: 5,
  });

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

      // Initialize attendance records from existing data
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
      const records: EvaluationRecord[] = Object.entries(evalRatings).map(([type, rating]) => ({
        playerId: selectedPlayer.id,
        type: type as EvaluationType,
        rating,
      }));

      await evaluationsApi.createBatch({
        trainingId: id,
        records,
      });

      // Reload evaluations
      const evaluationsData = await evaluationsApi.getByTraining(id);
      setEvaluations(evaluationsData);
      setSelectedPlayer(null);
    } catch {
      setError('Failed to save evaluations');
    } finally {
      setIsSaving(false);
    }
  };

  const openEvaluationModal = (player: PlayerBrief) => {
    setSelectedPlayer(player);
    // Load existing evaluations for this player
    const playerEvals = evaluations.filter((e) => e.player.id === player.id);
    const ratings: Record<EvaluationType, number> = {
      [EvaluationType.TECHNICAL]: 5,
      [EvaluationType.TACTICAL]: 5,
      [EvaluationType.PHYSICAL]: 5,
      [EvaluationType.PSYCHOLOGICAL]: 5,
    };
    playerEvals.forEach((e) => {
      ratings[e.type] = e.rating;
    });
    setEvalRatings(ratings);
  };

  const getPlayerEvaluations = (playerId: string) => {
    return evaluations.filter((e) => e.player.id === playerId);
  };

  const getPlayerAttendance = (playerId: string): AttendanceStatus | null => {
    const record = attendance.find((a) => a.player.id === playerId);
    return record?.status || null;
  };

  const canEvaluate = (playerId: string): boolean => {
    const status = getPlayerAttendance(playerId);
    return status === AttendanceStatus.PRESENT || status === AttendanceStatus.LATE;
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
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!training) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-500">Training not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{training.group.name}</h1>
              <p className="text-sm text-gray-600 mt-1">{formatDateTime(training.startTime)}</p>
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
                  {training.location}
                </span>
                {training.topic && <span>| {training.topic}</span>}
              </div>
            </div>
            <button
              onClick={() => navigate('/trainings')}
              className="text-gray-600 hover:text-gray-900"
            >
              Back to Trainings
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Tabs */}
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
            </nav>
          </div>

          {/* Attendance Tab */}
          {activeTab === 'attendance' && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  {isReadOnly ? 'Attendance' : `Players (${training.group.players.length})`}
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
                {training.group.players.map((player) => {
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

          {/* Evaluations Tab */}
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
                {training.group.players.map((player) => {
                  const playerEvals = getPlayerEvaluations(player.id);
                  const playerCanEvaluate = canEvaluate(player.id);
                  const playerStatus = getPlayerAttendance(player.id);

                  // For read-only mode, show all players with their evaluations
                  if (isReadOnly) {
                    return (
                      <div key={player.id} className="p-4 rounded-lg bg-gray-50">
                        <div className="flex items-center gap-3 mb-3">
                          <div>
                            <p className="font-medium text-gray-900">
                              {player.firstName} {player.lastName}
                            </p>
                            <p className="text-sm text-gray-500">{player.position}</p>
                          </div>
                        </div>
                        {playerEvals.length > 0 ? (
                          <div className="grid grid-cols-4 gap-2">
                            {Object.values(EvaluationType).map((type) => {
                              const eval_ = playerEvals.find((e) => e.type === type);
                              return (
                                <div
                                  key={type}
                                  className="text-center p-2 bg-white rounded-lg"
                                >
                                  <p className="text-xs text-gray-500">
                                    {EvaluationTypeLabels[type]}
                                  </p>
                                  <p className="text-lg font-bold text-gray-900">
                                    {eval_?.rating || '-'}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-400">No evaluations yet</p>
                        )}
                      </div>
                    );
                  }

                  // Edit mode for coaches/admins
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
                        {playerCanEvaluate ? (
                          <button
                            onClick={() => openEvaluationModal(player)}
                            className="px-3 py-1 text-sm text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          >
                            {playerEvals.length > 0 ? 'Edit' : 'Add'} Evaluation
                          </button>
                        ) : (
                          <span className="text-sm text-gray-400">
                            {playerStatus ? 'Not present' : 'Mark attendance first'}
                          </span>
                        )}
                      </div>

                      {playerEvals.length > 0 && playerCanEvaluate && (
                        <div className="mt-3 grid grid-cols-4 gap-2">
                          {Object.values(EvaluationType).map((type) => {
                            const eval_ = playerEvals.find((e) => e.type === type);
                            return (
                              <div
                                key={type}
                                className="text-center p-2 bg-white rounded-lg"
                              >
                                <p className="text-xs text-gray-500">
                                  {EvaluationTypeLabels[type]}
                                </p>
                                <p className="text-lg font-bold text-gray-900">
                                  {eval_?.rating || '-'}
                                </p>
                              </div>
                            );
                          })}
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

      {/* Evaluation Modal */}
      {selectedPlayer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Evaluate {selectedPlayer.firstName} {selectedPlayer.lastName}
            </h2>
            <p className="text-sm text-gray-500 mb-6">Rate from 1 to 10</p>

            <div className="space-y-4">
              {Object.values(EvaluationType).map((type) => (
                <div key={type}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {EvaluationTypeLabels[type]}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={evalRatings[type]}
                      onChange={(e) =>
                        setEvalRatings((prev) => ({
                          ...prev,
                          [type]: parseInt(e.target.value),
                        }))
                      }
                      className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
                    />
                    <span className="w-8 text-center font-bold text-gray-900">
                      {evalRatings[type]}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setSelectedPlayer(null)}
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
    </div>
  );
}
