import { useState, useEffect } from 'react';
import { groupsApi, type GroupInfo } from '../../api/groups';
import { schedulesApi, type ScheduleItem, type PreviewResponse } from '../../api/schedules';
import { PageHeader } from '../../components/layout/PageHeader';
import { PageContent } from '../../components/layout/PageContent';
import { Card, Modal, Button, EmptyState } from '../../components/ui';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function getMaxDate(fromDate: string): string {
  if (!fromDate) return '';
  const date = new Date(fromDate);
  date.setFullYear(date.getFullYear() + 1);
  return date.toISOString().split('T')[0];
}

export function MyGroupsPage() {
  const [groups, setGroups] = useState<GroupInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedGroup, setSelectedGroup] = useState<GroupInfo | null>(null);
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleError, setScheduleError] = useState('');
  const [applyDates, setApplyDates] = useState({
    fromDate: '',
    toDate: '',
    defaultTopic: '',
  });
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [applyResult, setApplyResult] = useState<{ deleted: number; created: number } | null>(null);
  const [applying, setApplying] = useState(false);

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

  // Load preview when dates change
  useEffect(() => {
    const loadPreview = async () => {
      if (!selectedGroup || !applyDates.fromDate || !applyDates.toDate) {
        setPreview(null);
        return;
      }
      if (applyDates.toDate < applyDates.fromDate) {
        setPreview(null);
        return;
      }
      setPreviewLoading(true);
      try {
        const data = await schedulesApi.previewChanges(
          selectedGroup.id,
          applyDates.fromDate,
          applyDates.toDate
        );
        setPreview(data);
      } catch {
        setPreview(null);
      } finally {
        setPreviewLoading(false);
      }
    };
    loadPreview();
  }, [selectedGroup, applyDates.fromDate, applyDates.toDate]);

  const openScheduleModal = async (group: GroupInfo) => {
    setSelectedGroup(group);
    setScheduleLoading(true);
    setScheduleError('');
    setApplyResult(null);
    setApplyDates({ fromDate: '', toDate: '', defaultTopic: '' });
    setPreview(null);
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
    setApplyResult(null);
  };

  const addScheduleItem = () => {
    const usedDays = new Set(scheduleItems.map((s) => s.dayOfWeek));
    let newDay = 1;
    while (usedDays.has(newDay) && newDay <= 6) newDay++;
    if (newDay > 6) newDay = 0;
    if (usedDays.has(newDay)) return;

    setScheduleItems((prev) => [
      ...prev,
      { dayOfWeek: newDay, startTime: '16:00', durationMinutes: 90, location: '' },
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

  const validateAndShowConfirm = () => {
    setScheduleError('');

    if (scheduleItems.length === 0) {
      setScheduleError('At least one schedule day is required');
      return;
    }

    for (const item of scheduleItems) {
      if (!item.location.trim()) {
        setScheduleError('Location is required for all schedule items');
        return;
      }
    }

    if (!applyDates.fromDate || !applyDates.toDate) {
      setScheduleError('Please select date range');
      return;
    }

    if (applyDates.toDate < applyDates.fromDate) {
      setScheduleError('End date must be after start date');
      return;
    }

    setShowConfirmModal(true);
  };

  const handleApplySchedule = async () => {
    if (!selectedGroup) return;

    setApplying(true);
    setShowConfirmModal(false);

    try {
      // Strip any extra properties from schedule items
      const cleanItems = scheduleItems.map(({ dayOfWeek, startTime, durationMinutes, location }) => ({
        dayOfWeek,
        startTime,
        durationMinutes,
        location,
      }));

      const result = await schedulesApi.applySchedule(selectedGroup.id, {
        items: cleanItems,
        fromDate: applyDates.fromDate,
        toDate: applyDates.toDate,
        defaultTopic: applyDates.defaultTopic || undefined,
      });
      setApplyResult(result);
      setScheduleError('');
      setPreview(null);
    } catch (err) {
      console.error('Failed to apply schedule:', err);
      setScheduleError('Failed to apply schedule');
    } finally {
      setApplying(false);
    }
  };

  const NoGroupsIcon = () => (
    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  );

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <>
      <PageHeader
        title="My Groups"
        subtitle="Manage your assigned groups"
      />

      <PageContent>
        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        ) : groups.length === 0 ? (
          <Card>
            <EmptyState
              icon={<NoGroupsIcon />}
              title="No groups assigned"
              description="You are not assigned to any groups yet. Contact an administrator if you believe this is an error."
            />
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map((group) => (
              <Card key={group.id} className="overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-xl flex items-center justify-center">
                      <span className="text-green-600 dark:text-green-400 font-bold text-lg">
                        {group.yearOfBirth % 100}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{group.name}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{group.players.length} players</p>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Head Coach:</span>
                      <span className="text-gray-900 dark:text-white">
                        {group.headCoach
                          ? `${group.headCoach.firstName} ${group.headCoach.lastName}`
                          : '-'}
                      </span>
                    </div>
                    {group.assistants.length > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Assistants:</span>
                        <span className="text-gray-900 dark:text-white">
                          {group.assistants.map((a) => a.firstName).join(', ')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700">
                  <button
                    onClick={() => openScheduleModal(group)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-xl font-medium transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Training Schedule
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </PageContent>

      {/* Schedule Modal */}
      <Modal
        isOpen={!!selectedGroup}
        onClose={closeModal}
        title={`Training Schedule - ${selectedGroup?.name}`}
        size="lg"
      >
        {scheduleLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Weekly Schedule */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Weekly Schedule</h3>
                <button
                  onClick={addScheduleItem}
                  disabled={scheduleItems.length >= 7}
                  className="text-sm text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 disabled:text-gray-400 dark:disabled:text-gray-500 font-medium"
                >
                  + Add Day
                </button>
              </div>

              {scheduleItems.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-sm py-6 text-center bg-gray-50 dark:bg-gray-800 rounded-xl">
                  No schedule defined. Click "Add Day" to create one.
                </p>
              ) : (
                <div className="space-y-3">
                  {scheduleItems
                    .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
                    .map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl"
                      >
                        <select
                          value={item.dayOfWeek}
                          onChange={(e) =>
                            updateScheduleItem(index, 'dayOfWeek', parseInt(e.target.value))
                          }
                          className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 dark:bg-gray-700 dark:text-white"
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
                          className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                        />
                        <select
                          value={item.durationMinutes}
                          onChange={(e) => updateScheduleItem(index, 'durationMinutes', Number(e.target.value))}
                          className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                        >
                          <option value={60}>1h</option>
                          <option value={75}>1h 15m</option>
                          <option value={90}>1h 30m</option>
                          <option value={105}>1h 45m</option>
                          <option value={120}>2h</option>
                        </select>
                        <input
                          type="text"
                          value={item.location}
                          onChange={(e) => updateScheduleItem(index, 'location', e.target.value)}
                          placeholder="Location"
                          className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                        />
                        <button
                          onClick={() => removeScheduleItem(index)}
                          className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Date Range */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-4">Apply to Period</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">From</label>
                  <input
                    type="date"
                    value={applyDates.fromDate}
                    min={todayStr}
                    onChange={(e) =>
                      setApplyDates((prev) => ({ ...prev, fromDate: e.target.value }))
                    }
                    className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 dark:bg-gray-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">To</label>
                  <input
                    type="date"
                    value={applyDates.toDate}
                    min={applyDates.fromDate || todayStr}
                    max={getMaxDate(applyDates.fromDate)}
                    onChange={(e) =>
                      setApplyDates((prev) => ({ ...prev, toDate: e.target.value }))
                    }
                    className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 dark:bg-gray-800 dark:text-white"
                  />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Default Topic (optional)</label>
                <input
                  type="text"
                  value={applyDates.defaultTopic}
                  onChange={(e) =>
                    setApplyDates((prev) => ({ ...prev, defaultTopic: e.target.value }))
                  }
                  placeholder="e.g., Technical training"
                  className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 dark:bg-gray-800 dark:text-white"
                />
              </div>

              {/* Preview info */}
              {previewLoading && (
                <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl text-sm text-gray-500 dark:text-gray-400">
                  Loading preview...
                </div>
              )}
              {preview && !previewLoading && (
                <div className="mb-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 text-amber-700 dark:text-amber-400 rounded-xl text-sm">
                  {preview.total > 0 ? (
                    <>
                      This will delete <strong>{preview.total}</strong> existing training{preview.total !== 1 ? 's' : ''}
                      {preview.withAttendance > 0 && (
                        <> (<strong>{preview.withAttendance}</strong> with attendance data)</>
                      )}
                    </>
                  ) : (
                    'No existing trainings in this period'
                  )}
                </div>
              )}

              {applyResult && (
                <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 text-green-700 dark:text-green-400 rounded-xl text-sm">
                  Deleted {applyResult.deleted} trainings, created {applyResult.created} trainings
                </div>
              )}

              <Button
                onClick={validateAndShowConfirm}
                className="w-full"
                disabled={applying || scheduleItems.length === 0}
              >
                {applying ? 'Applying...' : 'Apply Schedule'}
              </Button>
            </div>

            {scheduleError && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl text-sm">
                {scheduleError}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Confirmation Modal */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Confirm Schedule Application"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">
            All trainings from <strong>{applyDates.fromDate}</strong> to <strong>{applyDates.toDate}</strong> will be deleted and replaced with the new schedule.
          </p>
          {preview && preview.total > 0 && (
            <p className="text-amber-600 dark:text-amber-400">
              This will remove {preview.total} training{preview.total !== 1 ? 's' : ''}
              {preview.withAttendance > 0 && (
                <> ({preview.withAttendance} with attendance data)</>
              )}.
            </p>
          )}
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setShowConfirmModal(false)}
              className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 font-medium transition-colors"
            >
              Cancel
            </button>
            <Button onClick={handleApplySchedule} className="flex-1">
              Confirm
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
