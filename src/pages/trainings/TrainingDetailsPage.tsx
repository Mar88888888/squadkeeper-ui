import { useState, useEffect } from 'react';
import {
  trainingsApi,
  getTrainingEndTime,
  type TrainingDetails,
  type PlayerBrief,
  type UpdateTrainingRequest,
} from '../../api/trainings';
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
import { AttendanceStatusLabels } from '../../constants/attendance.constants';
import { PageHeader, PageContent } from '../../components/layout';
import { Card, CardContent, Modal, Button, Avatar } from '../../components/ui';
import { useParams, useNavigate } from 'react-router-dom';

const EVAL_CATEGORIES = [
  { key: 'technical', label: 'Technical' },
  { key: 'tactical', label: 'Tactical' },
  { key: 'physical', label: 'Physical' },
  { key: 'psychological', label: 'Psychological' },
] as const;

type EvalCategory = (typeof EVAL_CATEGORIES)[number]['key'];

//Icons
const CalendarIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
    />
  </svg>
);

const ClockIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const LocationIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
    />
  </svg>
);

const StarIcon = ({ filled = false }: { filled?: boolean }) => (
  <svg
    className="w-5 h-5"
    fill={filled ? 'currentColor' : 'none'}
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
    />
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

function getAttendanceRowStyle(status: AttendanceStatus): string {
  switch (status) {
    case AttendanceStatus.ABSENT:
      return 'bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50';
    case AttendanceStatus.LATE:
      return 'bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/50';
    case AttendanceStatus.SICK:
      return 'bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/50';
    default:
      return 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700';
  }
}

function getSelectStyle(status: AttendanceStatus): string {
  switch (status) {
    case AttendanceStatus.ABSENT:
      return 'border-red-200 dark:border-red-800 text-red-600 dark:text-red-400';
    case AttendanceStatus.LATE:
      return 'border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400';
    case AttendanceStatus.SICK:
      return 'border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400';
    default:
      return 'border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white';
  }
}

const EditIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
    />
  </svg>
);

const TrashIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
    />
  </svg>
);

function formatDateTimeLocal(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function TrainingDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const canEdit =
    user?.role === UserRole.ADMIN || user?.role === UserRole.COACH;

  const [training, setTraining] = useState<TrainingDetails | null>(null);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    startTime: '',
    durationMinutes: 90,
    location: '',
    topic: '',
  });

  // Delete confirmation state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [attendanceRecords, setAttendanceRecords] = useState<
    Record<string, AttendanceStatus>
  >({});

  const [selectedPlayer, setSelectedPlayer] = useState<PlayerBrief | null>(
    null,
  );
  const [selectedPlayerIndex, setSelectedPlayerIndex] = useState(0);
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
      const [trainingData, attendanceData, evaluationsData] = await Promise.all(
        [
          trainingsApi.getOne(id),
          attendanceApi.getByTraining(id),
          evaluationsApi.getByTraining(id),
        ],
      );
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

  const handleAttendanceChange = (
    playerId: string,
    status: AttendanceStatus,
  ) => {
    setAttendanceRecords((prev) => ({ ...prev, [playerId]: status }));
  };

  const markAllPresent = () => {
    if (!training) return;
    const records: Record<string, AttendanceStatus> = {};
    training.group.players.forEach((player) => {
      records[player.id] = AttendanceStatus.PRESENT;
    });
    setAttendanceRecords(records);
  };

  const saveAttendance = async () => {
    if (!id || !training) return;
    setIsSaving(true);
    setError('');
    try {
      const records: AttendanceRecord[] = training.group.players.map(
        (player) => ({
          playerId: player.id,
          status: attendanceRecords[player.id] || AttendanceStatus.PRESENT,
        }),
      );

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
    const status = attendanceRecords[playerId] || getPlayerAttendance(playerId);
    return (
      status === AttendanceStatus.PRESENT || status === AttendanceStatus.LATE
    );
  };

  const canEvaluate = (playerId: string): boolean => {
    if (user?.role !== UserRole.COACH && user?.role !== UserRole.ADMIN)
      return false;
    return isPlayerPresent(playerId);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTimeRange = (training: {
    startTime: string;
    durationMinutes: number;
  }) => {
    const start = new Date(training.startTime).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const end = getTrainingEndTime(training).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    return `${start} - ${end}`;
  };

  const openEditModal = () => {
    if (!training) return;
    setEditForm({
      startTime: formatDateTimeLocal(new Date(training.startTime)),
      durationMinutes: training.durationMinutes,
      location: training.location,
      topic: training.topic || '',
    });
    setIsEditModalOpen(true);
    setError('');
  };

  const handleUpdate = async () => {
    if (!id || !training) return;
    setIsSaving(true);
    setError('');
    try {
      const updateData: UpdateTrainingRequest = {
        startTime: new Date(editForm.startTime).toISOString(),
        durationMinutes: editForm.durationMinutes,
        location: editForm.location,
        topic: editForm.topic || undefined,
      };
      await trainingsApi.update(id, updateData);
      setIsEditModalOpen(false);
      loadData();
    } catch {
      setError('Failed to update training');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    setIsDeleting(true);
    setError('');
    try {
      await trainingsApi.delete(id);
      navigate('/trainings');
    } catch {
      setError('Failed to delete training');
      setIsDeleting(false);
    }
  };

  // Calculate attendance stats
  const getAttendanceStats = () => {
    const stats = { present: 0, absent: 0, late: 0, excused: 0 };
    Object.values(attendanceRecords).forEach((status) => {
      switch (status) {
        case AttendanceStatus.PRESENT:
          stats.present++;
          break;
        case AttendanceStatus.ABSENT:
          stats.absent++;
          break;
        case AttendanceStatus.LATE:
          stats.late++;
          break;
        case AttendanceStatus.SICK:
          stats.excused++;
          break;
      }
    });
    return stats;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!training) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500 dark:text-gray-400">
          Training not found
        </div>
      </div>
    );
  }

  const stats = getAttendanceStats();
  const totalPlayers = training.group.players.length;
  const attendancePercent =
    totalPlayers > 0
      ? Math.round(((stats.present + stats.late) / totalPlayers) * 100)
      : 0;

  return (
    <>
      <PageHeader
        title={training.topic || 'Training Session'}
        subtitle={training.group.name}
        actions={
          canEdit && (
            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={openEditModal}>
                <EditIcon />
              </Button>
              <Button
                variant="danger"
                onClick={() => setIsDeleteModalOpen(true)}
              >
                <TrashIcon />
              </Button>
              <Button onClick={saveAttendance} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          )
        }
      />

      <PageContent>
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* Training Info Card */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-6 text-white mb-8 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute right-20 bottom-0 w-32 h-32 bg-white/10 rounded-full translate-y-1/2"></div>
          <div className="relative">
            <div className="flex items-start justify-between">
              <div>
                {training.topic && (
                  <span className="px-3 py-1 bg-white/20 text-white text-xs font-semibold rounded-full">
                    {training.topic}
                  </span>
                )}
                <h2 className="text-2xl font-bold mt-3">
                  {training.group.name}
                </h2>
                <p className="text-green-100 mt-1">{training.location}</p>
              </div>
              <span className="px-4 py-2 bg-white/20 text-white text-sm font-semibold rounded-xl">
                {new Date(training.startTime) > new Date()
                  ? 'Planned'
                  : 'Completed'}
              </span>
            </div>
            <div className="flex items-center gap-8 mt-6 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-green-200">
                  <CalendarIcon />
                </span>
                <span className="font-medium">
                  {formatDate(training.startTime)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-200">
                  <ClockIcon />
                </span>
                <span className="font-medium">{formatTimeRange(training)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-200">
                  <LocationIcon />
                </span>
                <span className="font-medium">{training.location}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Attendance */}
          <div className="lg:col-span-2 space-y-6">
            {/* Attendance Section */}
            <Card>
              <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Attendance
                  </h3>
                  <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-semibold rounded-full">
                    {stats.present + stats.late}/{totalPlayers} present
                  </span>
                </div>
                {canEdit && (
                  <button
                    onClick={markAllPresent}
                    className="text-sm text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-medium"
                  >
                    Mark all
                  </button>
                )}
              </div>
              <CardContent>
                <div className="space-y-3">
                  {training.group.players.map((player, index) => {
                    const currentStatus =
                      attendanceRecords[player.id] || AttendanceStatus.PRESENT;
                    const playerEval = getPlayerEvaluation(player.id);
                    const avgRating = playerEval
                      ? getEvaluationAverage(playerEval)
                      : null;
                    const playerCanEvaluate = canEvaluate(player.id);

                    return (
                      <div
                        key={player.id}
                        className={`flex items-center justify-between p-4 rounded-xl transition-colors ${getAttendanceRowStyle(currentStatus)}`}
                      >
                        <div className="flex items-center gap-4">
                          <Avatar
                            className={`bg-gradient-to-br ${currentStatus === AttendanceStatus.ABSENT ? 'from-gray-300 to-gray-400' : getPlayerColor(index)}`}
                          />
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {player.firstName} {player.lastName}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {player.position}
                            </p>
                          </div>
                          {avgRating !== null && (
                            <span className="px-2 py-1 text-sm font-bold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                              {avgRating}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          {canEdit ? (
                            <select
                              value={currentStatus}
                              onChange={(e) =>
                                handleAttendanceChange(
                                  player.id,
                                  e.target.value as AttendanceStatus,
                                )
                              }
                              className={`px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 bg-white dark:bg-gray-800 ${getSelectStyle(currentStatus)}`}
                            >
                              {Object.values(AttendanceStatus).map((status) => (
                                <option key={status} value={status}>
                                  {AttendanceStatusLabels[status]}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span
                              className={`px-3 py-2 rounded-lg font-medium text-sm ${getSelectStyle(currentStatus)} bg-white dark:bg-gray-800`}
                            >
                              {AttendanceStatusLabels[currentStatus]}
                            </span>
                          )}
                          {canEdit && (
                            <button
                              onClick={() =>
                                playerCanEvaluate &&
                                openEvaluationModal(player, index)
                              }
                              className={`p-2 rounded-lg transition-colors ${
                                playerCanEvaluate
                                  ? 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/30'
                                  : 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                              }`}
                              title={
                                playerCanEvaluate
                                  ? 'Rate player'
                                  : 'Player must be present to rate'
                              }
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

            {/* Evaluations Summary (Read-only for players/parents) */}
            {!canEdit && evaluations.length > 0 && (
              <Card>
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Evaluations
                  </h3>
                </div>
                <CardContent>
                  <div className="space-y-4">
                    {training.group.players.map((player) => {
                      const playerEval = getPlayerEvaluation(player.id);
                      if (!playerEval) return null;
                      const avgRating = getEvaluationAverage(playerEval);

                      return (
                        <div
                          key={player.id}
                          className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <p className="font-semibold text-gray-900 dark:text-white">
                                {player.firstName} {player.lastName}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {player.position}
                              </p>
                            </div>
                            {avgRating !== null && (
                              <div className="text-center px-3 py-1 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                                <p className="text-lg font-bold text-amber-700 dark:text-amber-400">
                                  {avgRating}
                                </p>
                                <p className="text-xs text-amber-600 dark:text-amber-500">
                                  Avg
                                </p>
                              </div>
                            )}
                          </div>
                          <div className="grid grid-cols-4 gap-2">
                            {EVAL_CATEGORIES.map(({ key, label }) => (
                              <div
                                key={key}
                                className="text-center p-2 bg-white dark:bg-gray-900 rounded-lg"
                              >
                                <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
                                  {label}
                                </p>
                                <p className="text-lg font-bold text-gray-900 dark:text-white">
                                  {playerEval[key] ?? '-'}
                                </p>
                              </div>
                            ))}
                          </div>
                          {playerEval.comment && (
                            <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 italic">
                              "{playerEval.comment}"
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Stats */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Statistics
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Attendance
                  </span>
                  <span className="text-lg font-bold text-green-600 dark:text-green-400">
                    {attendancePercent}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${attendancePercent}%` }}
                  ></div>
                </div>

                <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {stats.present}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Present
                      </p>
                    </div>
                    <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-xl">
                      <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                        {stats.absent}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Absent
                      </p>
                    </div>
                    <div className="text-center p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                      <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                        {stats.late}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Late
                      </p>
                    </div>
                    <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {stats.excused}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Excused
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Group Info */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Group Info
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Group
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {training.group.name}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Players
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {totalPlayers}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Evaluations
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {evaluations.length}
                  </span>
                </div>
              </div>
            </Card>
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
                size="lg"
                className={`bg-gradient-to-br ${getPlayerColor(selectedPlayerIndex)}`}
              />
              <div>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {selectedPlayer.firstName} {selectedPlayer.lastName}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Training evaluation
                </p>
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
              <Button
                variant="secondary"
                onClick={() => setSelectedPlayer(null)}
                className="flex-1"
              >
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

      {/* Edit Training Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Training"
      >
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Topic (optional)
            </label>
            <input
              type="text"
              value={editForm.topic}
              onChange={(e) =>
                setEditForm((prev) => ({ ...prev, topic: e.target.value }))
              }
              placeholder="e.g., Ball control & passing drills"
              className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date & Time
              </label>
              <input
                type="datetime-local"
                value={editForm.startTime}
                min={formatDateTimeLocal(new Date())}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    startTime: e.target.value,
                  }))
                }
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 dark:bg-gray-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Duration
              </label>
              <select
                value={editForm.durationMinutes}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    durationMinutes: Number(e.target.value),
                  }))
                }
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 dark:bg-gray-800 dark:text-white"
              >
                <option value={60}>1 hour</option>
                <option value={90}>1.5 hours</option>
                <option value={120}>2 hours</option>
                <option value={150}>2.5 hours</option>
                <option value={180}>3 hours</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Location
            </label>
            <select
              value={editForm.location}
              onChange={(e) =>
                setEditForm((prev) => ({ ...prev, location: e.target.value }))
              }
              className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 dark:bg-gray-800 dark:text-white"
            >
              <option value="Main Field">Main Field</option>
              <option value="Training Field 2">Training Field 2</option>
              <option value="Gym">Gym</option>
              <option value="Indoor Arena">Indoor Arena</option>
            </select>
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl text-sm">
              {error}
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={() => setIsEditModalOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={isSaving}
              className="flex-1"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Training"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Are you sure you want to delete this training? This action cannot be
            undone.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            All attendance records and evaluations for this training will also
            be deleted.
          </p>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl text-sm">
              {error}
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={() => setIsDeleteModalOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex-1"
            >
              {isDeleting ? 'Deleting...' : 'Delete Training'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
