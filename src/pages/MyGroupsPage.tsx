import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { groupsApi, type GroupInfo } from '../api/groups';
import { schedulesApi, type ScheduleItem } from '../api/schedules';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function MyGroupsPage() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState<GroupInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Schedule modal state
  const [selectedGroup, setSelectedGroup] = useState<GroupInfo | null>(null);
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleError, setScheduleError] = useState('');
  const [generateDates, setGenerateDates] = useState({
    fromDate: '',
    toDate: '',
    defaultTopic: '',
  });
  const [generateResult, setGenerateResult] = useState<{ created: number; skipped: number } | null>(null);

  useEffect(() => {
    const loadGroups = async () => {
      setIsLoading(true);
      setError('');
      try {
        const data = await groupsApi.getMy();
        setGroups(data);
      } catch {
        setError('Failed to load groups');
      } finally {
        setIsLoading(false);
      }
    };
    loadGroups();
  }, []);

  const openScheduleModal = async (group: GroupInfo) => {
    setSelectedGroup(group);
    setScheduleLoading(true);
    setScheduleError('');
    setGenerateResult(null);
    setGenerateDates({ fromDate: '', toDate: '', defaultTopic: '' });
    try {
      const schedule = await schedulesApi.getSchedule(group.id);
      setScheduleItems(schedule);
    } catch {
      setScheduleError('Failed to load schedule');
      setScheduleItems([]);
    } finally {
      setScheduleLoading(false);
    }
  };

  const closeModal = () => {
    setSelectedGroup(null);
    setScheduleError('');
    setGenerateResult(null);
  };

  const addScheduleItem = () => {
    const usedDays = new Set(scheduleItems.map((s) => s.dayOfWeek));
    let newDay = 1;
    while (usedDays.has(newDay) && newDay <= 6) newDay++;
    if (newDay > 6) newDay = 0;
    if (usedDays.has(newDay)) return;

    setScheduleItems((prev) => [
      ...prev,
      { dayOfWeek: newDay, startTime: '16:00', endTime: '17:30', location: '' },
    ]);
  };

  const removeScheduleItem = (index: number) => {
    setScheduleItems((prev) => prev.filter((_, i) => i !== index));
  };

  const updateScheduleItem = (index: number, field: keyof ScheduleItem, value: string | number) => {
    setScheduleItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const handleSaveSchedule = async () => {
    if (!selectedGroup) return;
    for (const item of scheduleItems) {
      if (!item.location.trim()) {
        setScheduleError('Location is required for all schedule items');
        return;
      }
      if (item.endTime <= item.startTime) {
        setScheduleError('End time must be after start time');
        return;
      }
    }
    try {
      const saved = await schedulesApi.updateSchedule(selectedGroup.id, scheduleItems);
      setScheduleItems(saved);
      setScheduleError('');
    } catch {
      setScheduleError('Failed to save schedule');
    }
  };

  const handleGenerateTrainings = async () => {
    if (!selectedGroup) return;
    if (!generateDates.fromDate || !generateDates.toDate) {
      setScheduleError('Please select date range');
      return;
    }
    if (generateDates.toDate < generateDates.fromDate) {
      setScheduleError('End date must be after start date');
      return;
    }
    try {
      const result = await schedulesApi.generateTrainings(selectedGroup.id, {
        fromDate: generateDates.fromDate,
        toDate: generateDates.toDate,
        defaultTopic: generateDates.defaultTopic || undefined,
      });
      setGenerateResult(result);
      setScheduleError('');
    } catch {
      setScheduleError('Failed to generate trainings');
    }
  };

  const handleDeleteGeneratedTrainings = async () => {
    if (!selectedGroup) return;
    try {
      const result = await schedulesApi.deleteFutureGenerated(selectedGroup.id);
      setGenerateResult({ created: 0, skipped: result.kept });
      setScheduleError('');
      alert(`Deleted ${result.deleted} trainings. ${result.kept} trainings with attendance were kept.`);
    } catch {
      setScheduleError('Failed to delete generated trainings');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">My Groups</h1>
          <button
            onClick={() => navigate('/dashboard')}
            className="text-gray-600 hover:text-gray-900"
          >
            Back to Dashboard
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        ) : groups.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <p className="text-gray-500">You are not assigned to any groups</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map((group) => (
              <div key={group.id} className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <span className="text-indigo-600 font-bold text-lg">
                        {group.yearOfBirth % 100}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{group.name}</h3>
                      <p className="text-sm text-gray-500">{group.players.length} players</p>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Head Coach:</span>
                      <span className="text-gray-900">
                        {group.headCoach
                          ? `${group.headCoach.firstName} ${group.headCoach.lastName}`
                          : '-'}
                      </span>
                    </div>
                    {group.assistants.length > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Assistants:</span>
                        <span className="text-gray-900">
                          {group.assistants.map((a) => a.firstName).join(', ')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                  <button
                    onClick={() => openScheduleModal(group)}
                    className="w-full flex items-center justify-center gap-2 py-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Training Schedule
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Schedule Modal */}
      {selectedGroup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Training Schedule - {selectedGroup.name}
            </h2>

            {scheduleLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              </div>
            ) : (
              <>
                {/* Schedule Items */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-700">Weekly Schedule</h3>
                    <button
                      onClick={addScheduleItem}
                      disabled={scheduleItems.length >= 7}
                      className="text-sm text-purple-600 hover:text-purple-700 disabled:text-gray-400"
                    >
                      + Add Day
                    </button>
                  </div>

                  {scheduleItems.length === 0 ? (
                    <p className="text-gray-500 text-sm py-4 text-center bg-gray-50 rounded-lg">
                      No schedule defined. Click "Add Day" to create one.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {scheduleItems
                        .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
                        .map((item, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                          >
                            <select
                              value={item.dayOfWeek}
                              onChange={(e) =>
                                updateScheduleItem(index, 'dayOfWeek', parseInt(e.target.value))
                              }
                              className="px-2 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                            >
                              {[0, 1, 2, 3, 4, 5, 6].map((day) => (
                                <option
                                  key={day}
                                  value={day}
                                  disabled={
                                    scheduleItems.some((s, i) => i !== index && s.dayOfWeek === day)
                                  }
                                >
                                  {DAY_NAMES[day]}
                                </option>
                              ))}
                            </select>
                            <input
                              type="time"
                              value={item.startTime}
                              onChange={(e) => updateScheduleItem(index, 'startTime', e.target.value)}
                              className="px-2 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                            />
                            <span className="text-gray-400">-</span>
                            <input
                              type="time"
                              value={item.endTime}
                              onChange={(e) => updateScheduleItem(index, 'endTime', e.target.value)}
                              className="px-2 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                            />
                            <input
                              type="text"
                              value={item.location}
                              onChange={(e) => updateScheduleItem(index, 'location', e.target.value)}
                              placeholder="Location"
                              className="flex-1 px-2 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                            />
                            <button
                              onClick={() => removeScheduleItem(index)}
                              className="p-1 text-red-500 hover:bg-red-50 rounded"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                    </div>
                  )}

                  <button
                    onClick={handleSaveSchedule}
                    className="w-full py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Save Schedule
                  </button>
                </div>

                {/* Generate Trainings Section */}
                {scheduleItems.length > 0 && (
                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Generate Trainings</h3>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">From</label>
                        <input
                          type="date"
                          value={generateDates.fromDate}
                          onChange={(e) =>
                            setGenerateDates((prev) => ({ ...prev, fromDate: e.target.value }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">To</label>
                        <input
                          type="date"
                          value={generateDates.toDate}
                          onChange={(e) =>
                            setGenerateDates((prev) => ({ ...prev, toDate: e.target.value }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="block text-xs text-gray-500 mb-1">Default Topic (optional)</label>
                      <input
                        type="text"
                        value={generateDates.defaultTopic}
                        onChange={(e) =>
                          setGenerateDates((prev) => ({ ...prev, defaultTopic: e.target.value }))
                        }
                        placeholder="e.g., Technical training"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    {generateResult && (
                      <div className="mb-3 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
                        Created {generateResult.created} trainings
                        {generateResult.skipped > 0 && `, skipped ${generateResult.skipped} (already exist)`}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={handleGenerateTrainings}
                        className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Generate Trainings
                      </button>
                      <button
                        onClick={handleDeleteGeneratedTrainings}
                        className="px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                        title="Delete future generated trainings without attendance"
                      >
                        Clear Future
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {scheduleError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {scheduleError}
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
