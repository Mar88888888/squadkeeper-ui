import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { groupsApi, type GroupInfo } from '../api/groups';
import { usersApi, type CoachInfo, type PlayerInfo } from '../api/users';
import { schedulesApi, type ScheduleItem } from '../api/schedules';
import { ConfirmDialog } from '../components/ConfirmDialog';

type ModalType = 'create' | 'edit' | 'staff' | 'players' | 'schedule' | null;

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_NAMES_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const currentYear = new Date().getFullYear();
const minYearOfBirth = currentYear - 25;
const maxYearOfBirth = currentYear - 3;

export function GroupManagementPage() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState<GroupInfo[]>([]);
  const [coaches, setCoaches] = useState<CoachInfo[]>([]);
  const [allPlayers, setAllPlayers] = useState<PlayerInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const [modalType, setModalType] = useState<ModalType>(null);
  const [selectedGroup, setSelectedGroup] = useState<GroupInfo | null>(null);

  // Form state for create/edit
  const [formData, setFormData] = useState({
    name: '',
    yearOfBirth: new Date().getFullYear() - 10,
  });

  // Staff form state
  const [staffData, setStaffData] = useState({
    headCoachId: '' as string | null,
    assistantIds: [] as string[],
  });

  // Players selection state
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [playerSearchQuery, setPlayerSearchQuery] = useState('');

  // Delete dialog state
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    groupId: string;
    groupName: string;
  }>({ isOpen: false, groupId: '', groupName: '' });

  // Schedule state
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [generateDates, setGenerateDates] = useState({
    fromDate: '',
    toDate: '',
    defaultTopic: '',
  });
  const [generateResult, setGenerateResult] = useState<{ created: number; skipped: number } | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setError('');
    try {
      const [groupsData, coachesData, playersData] = await Promise.all([
        groupsApi.getAll(),
        usersApi.getCoaches(),
        usersApi.getPlayers(),
      ]);
      setGroups(groupsData);
      setCoaches(coachesData);
      setAllPlayers(playersData);
    } catch {
      setError('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredGroups = groups.filter((g) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      g.name.toLowerCase().includes(query) ||
      g.yearOfBirth.toString().includes(query)
    );
  });

  const openCreateModal = () => {
    setFormData({ name: '', yearOfBirth: currentYear - 10 });
    setModalType('create');
  };

  const openEditModal = (group: GroupInfo) => {
    setSelectedGroup(group);
    setFormData({ name: group.name, yearOfBirth: group.yearOfBirth });
    setModalType('edit');
  };

  const openStaffModal = (group: GroupInfo) => {
    setSelectedGroup(group);
    setStaffData({
      headCoachId: group.headCoach?.id || null,
      assistantIds: group.assistants.map((a) => a.id),
    });
    setModalType('staff');
  };

  const openPlayersModal = (group: GroupInfo) => {
    setSelectedGroup(group);
    setSelectedPlayerIds(group.players.map((p) => p.id));
    setPlayerSearchQuery('');
    setModalType('players');
  };

  const closeModal = () => {
    setModalType(null);
    setSelectedGroup(null);
    setError('');
    setGenerateResult(null);
  };

  const openScheduleModal = async (group: GroupInfo) => {
    setSelectedGroup(group);
    setScheduleLoading(true);
    setError('');
    setGenerateResult(null);
    setGenerateDates({ fromDate: '', toDate: '', defaultTopic: '' });
    setModalType('schedule');
    try {
      const schedule = await schedulesApi.getSchedule(group.id);
      setScheduleItems(schedule);
    } catch {
      setError('Failed to load schedule');
      setScheduleItems([]);
    } finally {
      setScheduleLoading(false);
    }
  };

  const addScheduleItem = () => {
    // Find first available day not already in schedule
    const usedDays = new Set(scheduleItems.map((s) => s.dayOfWeek));
    let newDay = 1; // Start with Monday
    while (usedDays.has(newDay) && newDay <= 6) newDay++;
    if (newDay > 6) newDay = 0; // Sunday as fallback
    if (usedDays.has(newDay)) return; // All days used

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
    // Validate
    for (const item of scheduleItems) {
      if (!item.location.trim()) {
        setError('Location is required for all schedule items');
        return;
      }
      if (item.endTime <= item.startTime) {
        setError('End time must be after start time');
        return;
      }
    }
    try {
      const saved = await schedulesApi.updateSchedule(selectedGroup.id, scheduleItems);
      setScheduleItems(saved);
      setError('');
    } catch {
      setError('Failed to save schedule');
    }
  };

  const handleGenerateTrainings = async () => {
    if (!selectedGroup) return;
    if (!generateDates.fromDate || !generateDates.toDate) {
      setError('Please select date range');
      return;
    }
    if (generateDates.toDate < generateDates.fromDate) {
      setError('End date must be after start date');
      return;
    }
    try {
      const result = await schedulesApi.generateTrainings(selectedGroup.id, {
        fromDate: generateDates.fromDate,
        toDate: generateDates.toDate,
        defaultTopic: generateDates.defaultTopic || undefined,
      });
      setGenerateResult(result);
      setError('');
    } catch {
      setError('Failed to generate trainings');
    }
  };

  const handleDeleteGeneratedTrainings = async () => {
    if (!selectedGroup) return;
    try {
      const result = await schedulesApi.deleteFutureGenerated(selectedGroup.id);
      setGenerateResult({ created: 0, skipped: result.kept });
      setError('');
      alert(`Deleted ${result.deleted} trainings. ${result.kept} trainings with attendance were kept.`);
    } catch {
      setError('Failed to delete generated trainings');
    }
  };

  const handleCreateGroup = async () => {
    if (!formData.name.trim()) {
      setError('Group name is required');
      return;
    }
    if (formData.yearOfBirth < minYearOfBirth || formData.yearOfBirth > maxYearOfBirth) {
      setError(`Year of birth must be between ${minYearOfBirth} and ${maxYearOfBirth}`);
      return;
    }
    try {
      const newGroup = await groupsApi.create({
        name: formData.name,
        yearOfBirth: formData.yearOfBirth,
      });
      setGroups((prev) => [...prev, newGroup]);
      closeModal();
    } catch {
      setError('Failed to create group');
    }
  };

  const handleUpdateGroup = async () => {
    if (!selectedGroup || !formData.name.trim()) {
      setError('Group name is required');
      return;
    }
    if (formData.yearOfBirth < minYearOfBirth || formData.yearOfBirth > maxYearOfBirth) {
      setError(`Year of birth must be between ${minYearOfBirth} and ${maxYearOfBirth}`);
      return;
    }
    try {
      const updated = await groupsApi.update(selectedGroup.id, {
        name: formData.name,
        yearOfBirth: formData.yearOfBirth,
      });
      setGroups((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
      closeModal();
    } catch {
      setError('Failed to update group');
    }
  };

  const handleUpdateStaff = async () => {
    if (!selectedGroup) return;
    try {
      const updated = await groupsApi.updateStaff(selectedGroup.id, {
        headCoachId: staffData.headCoachId,
        assistantIds: staffData.assistantIds,
      });
      setGroups((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
      closeModal();
    } catch {
      setError('Failed to update staff');
    }
  };

  const handleUpdatePlayers = async () => {
    if (!selectedGroup) return;
    try {
      const currentPlayerIds = selectedGroup.players.map((p) => p.id);
      const toAdd = selectedPlayerIds.filter((id) => !currentPlayerIds.includes(id));
      const toRemove = currentPlayerIds.filter((id) => !selectedPlayerIds.includes(id));

      let updated = selectedGroup;
      if (toRemove.length > 0) {
        updated = await groupsApi.removePlayers(selectedGroup.id, toRemove);
      }
      if (toAdd.length > 0) {
        updated = await groupsApi.addPlayers(selectedGroup.id, toAdd);
      }

      setGroups((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));

      // Refresh players list to update their group assignments
      const playersData = await usersApi.getPlayers();
      setAllPlayers(playersData);

      closeModal();
    } catch {
      setError('Failed to update players');
    }
  };

  const handleDeleteGroup = async () => {
    try {
      await groupsApi.delete(deleteDialog.groupId);
      setGroups((prev) => prev.filter((g) => g.id !== deleteDialog.groupId));
      setDeleteDialog({ isOpen: false, groupId: '', groupName: '' });
    } catch {
      setError('Failed to delete group');
      setDeleteDialog({ isOpen: false, groupId: '', groupName: '' });
    }
  };

  const toggleAssistant = (coachId: string) => {
    setStaffData((prev) => ({
      ...prev,
      assistantIds: prev.assistantIds.includes(coachId)
        ? prev.assistantIds.filter((id) => id !== coachId)
        : [...prev.assistantIds, coachId],
    }));
  };

  const togglePlayer = (playerId: string) => {
    setSelectedPlayerIds((prev) =>
      prev.includes(playerId)
        ? prev.filter((id) => id !== playerId)
        : [...prev, playerId]
    );
  };

  // Filter players for selection (can include players from other groups)
  const filteredPlayersForSelection = allPlayers.filter((p) => {
    if (!playerSearchQuery.trim()) return true;
    const query = playerSearchQuery.toLowerCase();
    return (
      p.firstName.toLowerCase().includes(query) ||
      p.lastName.toLowerCase().includes(query) ||
      `${p.firstName} ${p.lastName}`.toLowerCase().includes(query)
    );
  });

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">Group Management</h1>
          <div className="flex gap-3">
            <button
              onClick={openCreateModal}
              className="text-green-600 hover:text-green-700 font-medium"
            >
              + Create Group
            </button>
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
          {/* Search */}
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Search by name or year..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
          </div>

          {error && (
            <div className="m-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            </div>
          ) : filteredGroups.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              {groups.length === 0 ? 'No groups created yet' : 'No groups match your search'}
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredGroups.map((group) => (
                <div key={group.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                          <span className="text-indigo-600 font-bold text-lg">
                            {group.yearOfBirth % 100}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{group.name}</h3>
                          <p className="text-sm text-gray-500">Year of birth: {group.yearOfBirth}</p>
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        {/* Head Coach */}
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Head Coach</p>
                          {group.headCoach ? (
                            <p className="font-medium text-gray-900">
                              {group.headCoach.firstName} {group.headCoach.lastName}
                            </p>
                          ) : (
                            <p className="text-gray-400 italic">Not assigned</p>
                          )}
                        </div>

                        {/* Assistants */}
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Assistants</p>
                          {group.assistants.length > 0 ? (
                            <p className="font-medium text-gray-900">
                              {group.assistants.map((a) => a.firstName).join(', ')}
                            </p>
                          ) : (
                            <p className="text-gray-400 italic">None</p>
                          )}
                        </div>

                        {/* Players */}
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Players</p>
                          <p className="font-medium text-gray-900">{group.players.length} players</p>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => openEditModal(group)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Edit group"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => openStaffModal(group)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Manage coaches"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => openPlayersModal(group)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Manage players"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => openScheduleModal(group)}
                        className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        title="Training schedule"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setDeleteDialog({ isOpen: true, groupId: group.id, groupName: group.name })}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete group"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Create/Edit Modal */}
      {(modalType === 'create' || modalType === 'edit') && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {modalType === 'create' ? 'Create Group' : 'Edit Group'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Group Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="e.g., U-12 Main"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Year of Birth * <span className="text-gray-400 font-normal">({minYearOfBirth}-{maxYearOfBirth})</span>
                </label>
                <input
                  type="number"
                  value={formData.yearOfBirth}
                  onChange={(e) => setFormData((prev) => ({ ...prev, yearOfBirth: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  min={minYearOfBirth}
                  max={maxYearOfBirth}
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
                onClick={modalType === 'create' ? handleCreateGroup : handleUpdateGroup}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                {modalType === 'create' ? 'Create' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Staff Modal */}
      {modalType === 'staff' && selectedGroup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 p-6 max-h-[80vh] overflow-y-auto">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Manage Coaches - {selectedGroup.name}
            </h2>

            <div className="space-y-6">
              {/* Head Coach */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Head Coach
                </label>
                <select
                  value={staffData.headCoachId || ''}
                  onChange={(e) => setStaffData((prev) => ({ ...prev, headCoachId: e.target.value || null }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">-- Not assigned --</option>
                  {coaches.map((coach) => (
                    <option key={coach.id} value={coach.id}>
                      {coach.firstName} {coach.lastName} ({coach.licenseLevel})
                    </option>
                  ))}
                </select>
              </div>

              {/* Assistants */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assistant Coaches
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-2">
                  {coaches.filter((c) => c.id !== staffData.headCoachId).map((coach) => (
                    <label
                      key={coach.id}
                      className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={staffData.assistantIds.includes(coach.id)}
                        onChange={() => toggleAssistant(coach.id)}
                        className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                      />
                      <span className="text-gray-900">
                        {coach.firstName} {coach.lastName}
                      </span>
                      <span className="text-sm text-gray-500">({coach.licenseLevel})</span>
                    </label>
                  ))}
                  {coaches.filter((c) => c.id !== staffData.headCoachId).length === 0 && (
                    <p className="text-gray-500 text-sm p-2">No coaches available</p>
                  )}
                </div>
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
                onClick={handleUpdateStaff}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Players Modal */}
      {modalType === 'players' && selectedGroup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 p-6 max-h-[80vh] overflow-hidden flex flex-col">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Manage Players - {selectedGroup.name}
            </h2>

            {/* Search */}
            <div className="relative mb-4">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Search players..."
                value={playerSearchQuery}
                onChange={(e) => setPlayerSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div className="text-sm text-gray-500 mb-2">
              {selectedPlayerIds.length} players selected
            </div>

            {/* Players List */}
            <div className="flex-1 overflow-y-auto border border-gray-200 rounded-lg">
              {filteredPlayersForSelection.length === 0 ? (
                <p className="text-gray-500 text-sm p-4 text-center">No players found</p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {filteredPlayersForSelection.map((player) => {
                    const isSelected = selectedPlayerIds.includes(player.id);
                    const inOtherGroup = player.group && player.group.id !== selectedGroup.id;
                    return (
                      <label
                        key={player.id}
                        className={`flex items-center gap-3 p-3 cursor-pointer transition-colors ${
                          isSelected ? 'bg-green-50' : 'hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => togglePlayer(player.id)}
                          className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">
                              {player.firstName} {player.lastName}
                            </span>
                            {inOtherGroup && (
                              <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                                In: {player.group?.name}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">
                            {new Date(player.dateOfBirth).getFullYear()} | {player.position}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
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
                onClick={handleUpdatePlayers}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      {modalType === 'schedule' && selectedGroup && (
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

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {error}
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

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        title="Delete Group"
        message={`Are you sure you want to delete "${deleteDialog.groupName}"?\n\nPlayers in this group will be unassigned but not deleted.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleDeleteGroup}
        onCancel={() => setDeleteDialog({ isOpen: false, groupId: '', groupName: '' })}
      />
    </div>
  );
}
