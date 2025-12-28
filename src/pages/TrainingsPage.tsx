import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { trainingsApi, type Training, type CreateTrainingRequest } from '../api/trainings';
import { groupsApi, type GroupInfo } from '../api/groups';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';

export function TrainingsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [groups, setGroups] = useState<GroupInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterGroupId, setFilterGroupId] = useState<string>('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<CreateTrainingRequest>({
    groupId: '',
    startTime: '',
    endTime: '',
    location: '',
    topic: '',
  });

  const canCreate = user?.role === UserRole.ADMIN || user?.role === UserRole.COACH;

  const loadData = async () => {
    setIsLoading(true);
    setError('');
    try {
      const isAdmin = user?.role === UserRole.ADMIN;
      const [trainingsData, groupsData] = await Promise.all([
        isAdmin ? trainingsApi.getAll() : trainingsApi.getMy(),
        isAdmin ? groupsApi.getAll() : groupsApi.getMy(),
      ]);
      setTrainings(trainingsData);
      setGroups(groupsData);
    } catch {
      setError('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const filteredTrainings = filterGroupId
    ? trainings.filter((t) => t.group.id === filterGroupId)
    : trainings;

  const sortedTrainings = [...filteredTrainings].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  const openCreateModal = () => {
    const now = new Date();
    const startTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    startTime.setMinutes(0, 0, 0);
    const endTime = new Date(startTime.getTime() + 90 * 60 * 1000);

    setFormData({
      groupId: groups[0]?.id || '',
      startTime: formatDateTimeLocal(startTime),
      endTime: formatDateTimeLocal(endTime),
      location: '',
      topic: '',
    });
    setIsModalOpen(true);
    setError('');
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setError('');
  };

  const handleCreate = async () => {
    if (!formData.groupId) {
      setError('Please select a group');
      return;
    }
    if (!formData.startTime || !formData.endTime) {
      setError('Please set start and end time');
      return;
    }
    if (!formData.location.trim()) {
      setError('Please enter a location');
      return;
    }

    const start = new Date(formData.startTime);
    const end = new Date(formData.endTime);
    if (end <= start) {
      setError('End time must be after start time');
      return;
    }

    try {
      const newTraining = await trainingsApi.create({
        ...formData,
        startTime: new Date(formData.startTime).toISOString(),
        endTime: new Date(formData.endTime).toISOString(),
      });
      setTrainings((prev) => [...prev, newTraining]);
      closeModal();
    } catch {
      setError('Failed to create training');
    }
  };

  const formatDateTimeLocal = (date: Date) => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('uk-UA', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('uk-UA', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isUpcoming = (dateStr: string) => new Date(dateStr) > new Date();

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">Trainings</h1>
          <div className="flex gap-3">
            {canCreate && (
              <button
                onClick={openCreateModal}
                className="text-green-600 hover:text-green-700 font-medium"
              >
                + Schedule Training
              </button>
            )}
            <button
              onClick={() => navigate('/dashboard')}
              className="text-gray-600 hover:text-gray-900"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Filter */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700">Filter by group:</label>
              <select
                value={filterGroupId}
                onChange={(e) => setFilterGroupId(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="">All groups</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && !isModalOpen && (
            <div className="m-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            </div>
          ) : sortedTrainings.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              {trainings.length === 0
                ? 'No trainings scheduled yet'
                : 'No trainings for selected group'}
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {sortedTrainings.map((training) => (
                  <button
                    key={training.id}
                    onClick={() => navigate(`/trainings/${training.id}`)}
                    className={`w-full text-left p-4 hover:bg-gray-50 cursor-pointer ${
                      !isUpcoming(training.startTime) ? 'opacity-60' : ''
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 bg-green-100 rounded-lg flex flex-col items-center justify-center">
                        <span className="text-xs text-green-600 uppercase">
                          {new Date(training.startTime).toLocaleDateString('uk-UA', {
                            weekday: 'short',
                          })}
                        </span>
                        <span className="text-xl font-bold text-green-700">
                          {new Date(training.startTime).getDate()}
                        </span>
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-700 rounded-full">
                            {training.group.name}
                          </span>
                          {isUpcoming(training.startTime) ? (
                            <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                              Upcoming
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                              Past
                            </span>
                          )}
                        </div>

                        <p className="mt-1 text-sm text-gray-900">
                          <span className="font-medium">
                            {formatTime(training.startTime)} - {formatTime(training.endTime)}
                          </span>
                          <span className="text-gray-500 ml-2">
                            {formatDateTime(training.startTime).split(',')[0]}
                          </span>
                        </p>

                        <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <svg
                              className="w-4 h-4"
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
                            <span>{training.location}</span>
                          </div>
                          {training.topic && (
                            <div className="flex items-center gap-1">
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                                />
                              </svg>
                              <span>{training.topic}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="text-gray-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </button>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Schedule Training</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Group *</label>
                <select
                  value={formData.groupId}
                  onChange={(e) => setFormData((prev) => ({ ...prev, groupId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">Select group</option>
                  {groups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Time *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.startTime}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, startTime: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Time *</label>
                  <input
                    type="datetime-local"
                    value={formData.endTime}
                    onChange={(e) => setFormData((prev) => ({ ...prev, endTime: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="e.g., Main Field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Topic <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={formData.topic}
                  onChange={(e) => setFormData((prev) => ({ ...prev, topic: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="e.g., Passing drills"
                />
              </div>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
