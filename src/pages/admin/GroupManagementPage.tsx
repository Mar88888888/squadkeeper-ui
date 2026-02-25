import { useState, useEffect } from 'react';
import { groupsApi, type GroupInfo } from '../../api/groups';
import { usersApi, type CoachInfo, type PlayerInfo } from '../../api/users';
import { schedulesApi, type ScheduleItem, type PreviewResponse } from '../../api/schedules';
import { PageHeader, PageContent } from '../../components/layout';
import { Card, Modal, Button, Avatar, EmptyState, getInitials } from '../../components/ui';

type ModalType = 'create' | 'edit' | 'staff' | 'players' | 'schedule' | null;

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const currentYear = new Date().getFullYear();
const minYearOfBirth = currentYear - 25;
const maxYearOfBirth = currentYear - 3;

// Icon components
const SearchIcon = () => (
  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const GroupIcon = () => (
  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const ChevronIcon = ({ expanded }: { expanded: boolean }) => (
  <svg className={`w-5 h-5 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const CoachIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const groupColors = [
  { bg: 'from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30', icon: 'text-green-600 dark:text-green-400' },
  { bg: 'from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30', icon: 'text-blue-600 dark:text-blue-400' },
  { bg: 'from-purple-100 to-violet-100 dark:from-purple-900/30 dark:to-violet-900/30', icon: 'text-purple-600 dark:text-purple-400' },
  { bg: 'from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30', icon: 'text-amber-600 dark:text-amber-400' },
  { bg: 'from-red-100 to-rose-100 dark:from-red-900/30 dark:to-rose-900/30', icon: 'text-red-600 dark:text-red-400' },
  { bg: 'from-teal-100 to-cyan-100 dark:from-teal-900/30 dark:to-cyan-900/30', icon: 'text-teal-600 dark:text-teal-400' },
];

function getGroupColor(index: number) {
  return groupColors[index % groupColors.length];
}

function getAgeCategory(yearOfBirth: number): string {
  const age = currentYear - yearOfBirth;
  return `U-${age}`;
}

const positionColors: Record<string, string> = {
  GK: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  CB: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  RB: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  LB: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  CDM: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  CM: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  CAM: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  LM: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  RM: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  LW: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
  RW: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
  ST: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
  CF: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
};

function getPositionColor(position: string): string {
  return positionColors[position] || 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400';
}

export function GroupManagementPage() {
  const [groups, setGroups] = useState<GroupInfo[]>([]);
  const [coaches, setCoaches] = useState<CoachInfo[]>([]);
  const [allPlayers, setAllPlayers] = useState<PlayerInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const [modalType, setModalType] = useState<ModalType>(null);
  const [selectedGroup, setSelectedGroup] = useState<GroupInfo | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    yearOfBirth: currentYear - 10,
  });

  const [staffData, setStaffData] = useState({
    headCoachId: '' as string | null,
    assistantIds: [] as string[],
  });

  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [playerSearchQuery, setPlayerSearchQuery] = useState('');

  const [deleteConfirm, setDeleteConfirm] = useState<{ groupId: string; groupName: string } | null>(null);

  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);
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
    if (modalType === 'schedule') {
      loadPreview();
    }
  }, [selectedGroup, applyDates.fromDate, applyDates.toDate, modalType]);

  const filteredGroups = groups.filter((g) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      g.name.toLowerCase().includes(query) ||
      g.yearOfBirth.toString().includes(query)
    );
  });

  const toggleGroupExpand = (groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  const openCreateModal = () => {
    setFormData({ name: '', yearOfBirth: currentYear - 10 });
    setModalType('create');
    setError('');
  };

  const openEditModal = (group: GroupInfo) => {
    setSelectedGroup(group);
    setFormData({ name: group.name, yearOfBirth: group.yearOfBirth });
    setModalType('edit');
    setError('');
  };

  const openStaffModal = (group: GroupInfo) => {
    setSelectedGroup(group);
    setStaffData({
      headCoachId: group.headCoach?.id || null,
      assistantIds: group.assistants.map((a) => a.id),
    });
    setModalType('staff');
    setError('');
  };

  const openPlayersModal = (group: GroupInfo) => {
    setSelectedGroup(group);
    setSelectedPlayerIds(group.players.map((p) => p.id));
    setPlayerSearchQuery('');
    setModalType('players');
    setError('');
  };

  const closeModal = () => {
    setModalType(null);
    setSelectedGroup(null);
    setError('');
    setApplyResult(null);
    setShowConfirmModal(false);
  };

  const openScheduleModal = async (group: GroupInfo) => {
    setSelectedGroup(group);
    setScheduleLoading(true);
    setError('');
    setApplyResult(null);
    setApplyDates({ fromDate: '', toDate: '', defaultTopic: '' });
    setPreview(null);
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
    setError('');

    if (scheduleItems.length === 0) {
      setError('At least one schedule day is required');
      return;
    }

    for (const item of scheduleItems) {
      if (!item.location.trim()) {
        setError('Location is required for all schedule items');
        return;
      }
    }

    if (!applyDates.fromDate || !applyDates.toDate) {
      setError('Please select date range');
      return;
    }

    if (applyDates.toDate < applyDates.fromDate) {
      setError('End date must be after start date');
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
      setError('');
      setPreview(null);
    } catch (err) {
      console.error('Failed to apply schedule:', err);
      setError('Failed to apply schedule');
    } finally {
      setApplying(false);
    }
  };

  const getMaxDate = (fromDate: string): string => {
    if (!fromDate) return '';
    const date = new Date(fromDate);
    date.setFullYear(date.getFullYear() + 1);
    return date.toISOString().split('T')[0];
  };

  const todayStr = new Date().toISOString().split('T')[0];

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

      const playersData = await usersApi.getPlayers();
      setAllPlayers(playersData);

      closeModal();
    } catch {
      setError('Failed to update players');
    }
  };

  const handleDeleteGroup = async () => {
    if (!deleteConfirm) return;
    try {
      await groupsApi.delete(deleteConfirm.groupId);
      setGroups((prev) => prev.filter((g) => g.id !== deleteConfirm.groupId));
      setDeleteConfirm(null);
    } catch {
      setError('Failed to delete group');
      setDeleteConfirm(null);
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
    <>
      <PageHeader
        title="Training Groups"
        subtitle="Manage teams and players"
        actions={
          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Search group..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 text-gray-900 dark:text-white"
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                <SearchIcon />
              </div>
            </div>
            <Button onClick={openCreateModal}>Create Group</Button>
          </div>
        }
      />

      <PageContent>
        {error && !modalType && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl text-sm">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        ) : filteredGroups.length === 0 ? (
          <Card>
            <EmptyState
              title={groups.length === 0 ? 'No groups created' : 'No groups found'}
              description={
                groups.length === 0
                  ? 'Create your first group to organize your players.'
                  : 'No groups match your search.'
              }
              action={
                groups.length === 0 ? (
                  <Button onClick={openCreateModal}>Create Group</Button>
                ) : undefined
              }
            />
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredGroups.map((group, index) => {
              const isExpanded = expandedGroups.has(group.id);
              const colors = getGroupColor(index);

              return (
                <div
                  key={group.id}
                  className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-lg hover:border-green-200 dark:hover:border-green-800 transition-all overflow-hidden"
                >
                  {/* Group Header */}
                  <div
                    className="p-6 cursor-pointer"
                    onClick={() => toggleGroupExpand(group.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-5">
                        <div className={`w-14 h-14 bg-gradient-to-br ${colors.bg} rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform`}>
                          <div className={colors.icon}>
                            <GroupIcon />
                          </div>
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white hover:text-green-600 dark:hover:text-green-400 transition-colors">
                            {group.name}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-0.5">
                            <CoachIcon />
                            {group.headCoach
                              ? `${group.headCoach.firstName} ${group.headCoach.lastName}`
                              : 'No coach assigned'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-center px-4">
                          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{group.players.length}</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">players</p>
                        </div>
                        <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
                          <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                            {getAgeCategory(group.yearOfBirth)}
                          </span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleGroupExpand(group.id);
                          }}
                          className="w-10 h-10 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl flex items-center justify-center transition-all"
                        >
                          <ChevronIcon expanded={isExpanded} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Section */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 dark:border-gray-800 px-6 pb-6 pt-4">
                      {/* Action Buttons */}
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Team Roster</h4>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openPlayersModal(group)}
                            className="text-sm text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-medium flex items-center gap-1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Manage Players
                          </button>
                          <button
                            onClick={() => openStaffModal(group)}
                            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                          >
                            Staff
                          </button>
                          <button
                            onClick={() => openScheduleModal(group)}
                            className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium"
                          >
                            Schedule
                          </button>
                          <button
                            onClick={() => openEditModal(group)}
                            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setDeleteConfirm({ groupId: group.id, groupName: group.name })}
                            className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      {/* Players Grid */}
                      {group.players.length === 0 ? (
                        <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">
                          No players in this group yet.
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {group.players.map((player) => (
                            <div
                              key={player.id}
                              className="flex items-center gap-4 bg-gray-50 dark:bg-gray-800 rounded-xl p-4 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                            >
                              <Avatar
                                initials={getInitials(player.firstName, player.lastName)}
                                className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 shadow-sm"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                  {player.firstName} {player.lastName}
                                </p>
                                <div className="flex items-center gap-2">
                                  <span className={`px-2 py-0.5 text-xs font-medium rounded ${getPositionColor(player.position)}`}>
                                    {player.position}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </PageContent>

      {/* Create/Edit Group Modal */}
      <Modal
        isOpen={modalType === 'create' || modalType === 'edit'}
        onClose={closeModal}
        title={modalType === 'create' ? 'Create New Group' : 'Edit Group'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Group Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              placeholder="e.g., Young Lions"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Year of Birth * <span className="text-gray-400 dark:text-gray-500 font-normal">({minYearOfBirth}-{maxYearOfBirth})</span>
            </label>
            <input
              type="number"
              value={formData.yearOfBirth}
              onChange={(e) => setFormData((prev) => ({ ...prev, yearOfBirth: parseInt(e.target.value) || 0 }))}
              className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              min={minYearOfBirth}
              max={maxYearOfBirth}
            />
          </div>

          {error && modalType && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="flex items-center gap-3 pt-4">
            <Button variant="secondary" onClick={closeModal} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={modalType === 'create' ? handleCreateGroup : handleUpdateGroup}
              className="flex-1"
            >
              {modalType === 'create' ? 'Create' : 'Save'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Staff Modal */}
      <Modal
        isOpen={modalType === 'staff'}
        onClose={closeModal}
        title={`Manage Coaches - ${selectedGroup?.name || ''}`}
        size="lg"
      >
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Head Coach
            </label>
            <select
              value={staffData.headCoachId || ''}
              onChange={(e) => setStaffData((prev) => ({ ...prev, headCoachId: e.target.value || null }))}
              className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="">-- Not assigned --</option>
              {coaches.map((coach) => (
                <option key={coach.id} value={coach.id}>
                  {coach.firstName} {coach.lastName} ({coach.licenseLevel})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Assistant Coaches
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-xl p-2">
              {coaches.filter((c) => c.id !== staffData.headCoachId).map((coach) => (
                <label
                  key={coach.id}
                  className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={staffData.assistantIds.includes(coach.id)}
                    onChange={() => toggleAssistant(coach.id)}
                    className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                  />
                  <span className="text-gray-900 dark:text-white">
                    {coach.firstName} {coach.lastName}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">({coach.licenseLevel})</span>
                </label>
              ))}
              {coaches.filter((c) => c.id !== staffData.headCoachId).length === 0 && (
                <p className="text-gray-500 dark:text-gray-400 text-sm p-2">No coaches available</p>
              )}
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={closeModal} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleUpdateStaff} className="flex-1">
              Save
            </Button>
          </div>
        </div>
      </Modal>

      {/* Players Modal */}
      <Modal
        isOpen={modalType === 'players'}
        onClose={closeModal}
        title={`Manage Players - ${selectedGroup?.name || ''}`}
        size="lg"
      >
        <div>
          <div className="relative mb-4">
            <input
              type="text"
              placeholder="Search players..."
              value={playerSearchQuery}
              onChange={(e) => setPlayerSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2">
              <SearchIcon />
            </div>
          </div>

          <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
            {selectedPlayerIds.length} players selected
          </div>

          <div className="max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-xl">
            {filteredPlayersForSelection.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-sm p-4 text-center">No players found</p>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredPlayersForSelection.map((player) => {
                  const isSelected = selectedPlayerIds.includes(player.id);
                  const inOtherGroup = player.group && selectedGroup && player.group.id !== selectedGroup.id;
                  return (
                    <label
                      key={player.id}
                      className={`flex items-center gap-3 p-3 cursor-pointer transition-colors ${
                        isSelected ? 'bg-green-50 dark:bg-green-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800'
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
                          <span className="font-medium text-gray-900 dark:text-white">
                            {player.firstName} {player.lastName}
                          </span>
                          {inOtherGroup && (
                            <span className="px-2 py-0.5 text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 rounded-full">
                              In: {player.group?.name}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
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
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="flex items-center gap-3 mt-6">
            <Button variant="secondary" onClick={closeModal} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleUpdatePlayers} className="flex-1">
              Save
            </Button>
          </div>
        </div>
      </Modal>

      {/* Schedule Modal */}
      <Modal
        isOpen={modalType === 'schedule'}
        onClose={closeModal}
        title={`Training Schedule - ${selectedGroup?.name || ''}`}
        size="lg"
      >
        {scheduleLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Weekly Schedule</h3>
                <button
                  onClick={addScheduleItem}
                  disabled={scheduleItems.length >= 7}
                  className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 disabled:text-gray-400 dark:disabled:text-gray-600"
                >
                  + Add Day
                </button>
              </div>

              {scheduleItems.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-sm py-4 text-center bg-gray-50 dark:bg-gray-800 rounded-xl">
                  No schedule defined. Click "Add Day" to create one.
                </p>
              ) : (
                <div className="space-y-2">
                  {scheduleItems
                    .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
                    .map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl"
                      >
                        <select
                          value={item.dayOfWeek}
                          onChange={(e) => updateScheduleItem(index, 'dayOfWeek', parseInt(e.target.value))}
                          className="px-2 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                        >
                          {[0, 1, 2, 3, 4, 5, 6].map((day) => (
                            <option
                              key={day}
                              value={day}
                              disabled={scheduleItems.some((s, i) => i !== index && s.dayOfWeek === day)}
                            >
                              {DAY_NAMES[day]}
                            </option>
                          ))}
                        </select>
                        <input
                          type="time"
                          value={item.startTime}
                          onChange={(e) => updateScheduleItem(index, 'startTime', e.target.value)}
                          className="px-2 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                        />
                        <select
                          value={item.durationMinutes}
                          onChange={(e) => updateScheduleItem(index, 'durationMinutes', Number(e.target.value))}
                          className="px-2 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
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
                          className="flex-1 px-2 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                        />
                        <button
                          onClick={() => removeScheduleItem(index)}
                          className="p-1 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
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

            {/* Date Range Section */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-4">Apply to Period</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">From</label>
                  <input
                    type="date"
                    value={applyDates.fromDate}
                    min={todayStr}
                    onChange={(e) => setApplyDates((prev) => ({ ...prev, fromDate: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">To</label>
                  <input
                    type="date"
                    value={applyDates.toDate}
                    min={applyDates.fromDate || todayStr}
                    max={getMaxDate(applyDates.fromDate)}
                    onChange={(e) => setApplyDates((prev) => ({ ...prev, toDate: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Default Topic (optional)</label>
                <input
                  type="text"
                  value={applyDates.defaultTopic}
                  onChange={(e) => setApplyDates((prev) => ({ ...prev, defaultTopic: e.target.value }))}
                  placeholder="e.g., Technical training"
                  className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
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

            {error && modalType === 'schedule' && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl text-sm">
                {error}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Schedule Confirmation Modal */}
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
            <Button variant="secondary" onClick={() => setShowConfirmModal(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleApplySchedule} className="flex-1">
              Confirm
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Group"
        size="sm"
      >
        <div>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Are you sure you want to delete "{deleteConfirm?.groupName}"?
            Players in this group will be unassigned but not deleted.
          </p>
          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={() => setDeleteConfirm(null)} className="flex-1">
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteGroup} className="flex-1">
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
