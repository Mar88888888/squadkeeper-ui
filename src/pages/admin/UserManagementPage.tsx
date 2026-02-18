import { useState, useEffect, useMemo, useCallback } from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { PageContent } from '../../components/layout/PageContent';
import { Card, Modal, Button, Avatar, Badge } from '../../components/ui';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { PlayerSelector } from '../../components/PlayerSelector';
import { useUserForm, type UserType } from '../../hooks/useUserForm';
import { usePlayerSelector } from '../../hooks/usePlayerSelector';
import {
  usersApi,
  type CoachInfo,
  type PlayerInfo,
  type ParentFullInfo,
} from '../../api/users';
import {
  POSITIONS,
  POSITION_LABELS,
  STRONG_FEET,
  STRONG_FOOT_LABELS,
  Position,
  StrongFoot,
} from '../../constants/player.constants';

interface UnifiedUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'coach' | 'player' | 'parent';
  subtitle: string;
  group: string;
  originalData: CoachInfo | PlayerInfo | ParentFullInfo;
}

const USER_TYPE_LABELS: Record<UserType, string> = {
  coach: 'Coach',
  player: 'Player',
  parent: 'Parent',
};

const ROLE_COLORS: Record<string, string> = {
  coach: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  player: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  parent: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
};

const AVATAR_COLORS: Record<string, string> = {
  coach: 'from-amber-400 to-orange-500',
  player: 'from-blue-400 to-indigo-500',
  parent: 'from-teal-400 to-cyan-500',
};

export function UserManagementPage() {
  const [coaches, setCoaches] = useState<CoachInfo[]>([]);
  const [players, setPlayers] = useState<PlayerInfo[]>([]);
  const [parents, setParents] = useState<ParentFullInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UnifiedUser | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const itemsPerPage = 10;

  const {
    form,
    ui,
    updateField,
    setUserType,
    setLoading,
    setError,
    setSuccess,
    resetForm,
    getCoachData,
    getPlayerData,
    getParentData,
  } = useUserForm();

  const playerSelector = usePlayerSelector(form.userType === 'parent');

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const [coachesData, playersData, parentsData] = await Promise.all([
        usersApi.getCoaches(),
        usersApi.getPlayers(),
        usersApi.getParents(),
      ]);
      setCoaches(coachesData);
      setPlayers(playersData);
      setParents(parentsData);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const unifiedUsers = useMemo((): UnifiedUser[] => {
    const users: UnifiedUser[] = [];

    coaches.forEach((coach) => {
      users.push({
        id: coach.id,
        firstName: coach.firstName,
        lastName: coach.lastName,
        email: coach.user.email,
        role: 'coach',
        subtitle: `${coach.licenseLevel} License`,
        group: '-',
        originalData: coach,
      });
    });

    players.forEach((player) => {
      users.push({
        id: player.id,
        firstName: player.firstName,
        lastName: player.lastName,
        email: player.user.email,
        role: 'player',
        subtitle: POSITION_LABELS[player.position as Position] || player.position,
        group: player.group?.name || '-',
        originalData: player,
      });
    });

    parents.forEach((parent) => {
      const childrenNames = parent.children.map((c) => c.firstName).join(', ');
      users.push({
        id: parent.id,
        firstName: parent.firstName,
        lastName: parent.lastName,
        email: parent.user.email,
        role: 'parent',
        subtitle: childrenNames ? `Parent of ${childrenNames}` : 'No linked children',
        group: '-',
        originalData: parent,
      });
    });

    return users;
  }, [coaches, players, parents]);

  const filteredUsers = useMemo(() => {
    return unifiedUsers.filter((user) => {
      const matchesSearch =
        !searchQuery ||
        `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = !roleFilter || user.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [unifiedUsers, searchQuery, roleFilter]);

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(start, start + itemsPerPage);
  }, [filteredUsers, currentPage]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  const stats = useMemo(
    () => ({
      total: unifiedUsers.length,
      coaches: coaches.length,
      players: players.length,
      parents: parents.length,
    }),
    [unifiedUsers.length, coaches.length, players.length, parents.length]
  );

  const handleCreateSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);

      try {
        if (form.userType === 'coach') {
          await usersApi.createCoach(getCoachData());
          setSuccess(`Coach ${form.firstName} ${form.lastName} created successfully!`);
        } else if (form.userType === 'player') {
          await usersApi.createPlayer(getPlayerData());
          setSuccess(`Player ${form.firstName} ${form.lastName} created successfully!`);
        } else {
          await usersApi.createParent(getParentData(playerSelector.selectedIds));
          const childrenCount = playerSelector.selectedIds.length;
          setSuccess(
            `Parent ${form.firstName} ${form.lastName} created successfully!` +
              (childrenCount > 0 ? ` Linked to ${childrenCount} player(s).` : '')
          );
        }
        resetForm();
        playerSelector.reset();
        setCreateModalOpen(false);
        fetchUsers();
      } catch (err: unknown) {
        const error = err as { response?: { data?: { message?: string } } };
        setError(error.response?.data?.message || 'Failed to create user');
      } finally {
        setLoading(false);
      }
    },
    [form, playerSelector, getCoachData, getPlayerData, getParentData, resetForm, setLoading, setError, setSuccess, fetchUsers]
  );

  const handleEdit = (user: UnifiedUser) => {
    setSelectedUser(user);
    setEditModalOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedUser) return;

    try {
      if (selectedUser.role === 'coach') {
        await usersApi.deleteCoach(selectedUser.id);
      } else if (selectedUser.role === 'player') {
        await usersApi.deletePlayer(selectedUser.id);
      } else {
        await usersApi.deleteParent(selectedUser.id);
      }
      setDeleteConfirmOpen(false);
      setEditModalOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  };

  const openCreateModal = () => {
    resetForm();
    playerSelector.reset();
    setCreateModalOpen(true);
  };

  return (
    <>
      <PageHeader
        title="Users"
        subtitle="System user management"
        actions={
          <Button onClick={openCreateModal}>
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New User
          </Button>
        }
      />

      <PageContent>
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Users</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.coaches}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Coaches</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-violet-100 dark:from-purple-900/30 dark:to-violet-900/30 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.players}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Players</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.parents}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Parents</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-6 mb-6">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex-1 min-w-[250px]">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 dark:text-white"
                />
                <svg
                  className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 dark:text-white"
            >
              <option value="">All Roles</option>
              <option value="coach">Coaches</option>
              <option value="player">Players</option>
              <option value="parent">Parents</option>
            </select>
          </div>
        </Card>

        {/* Users Table */}
        <Card className="overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
              <p className="mt-4 text-gray-500 dark:text-gray-400">Loading users...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-12 text-center">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <p className="text-gray-500 dark:text-gray-400">No users found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300">User</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Email</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Role</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Group</th>
                      <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedUsers.map((user) => (
                      <tr
                        key={`${user.role}-${user.id}`}
                        className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar
                              firstName={user.firstName}
                              lastName={user.lastName}
                              className={`bg-gradient-to-br ${AVATAR_COLORS[user.role]}`}
                            />
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {user.firstName} {user.lastName}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">{user.subtitle}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{user.email}</td>
                        <td className="px-6 py-4">
                          <Badge className={ROLE_COLORS[user.role]}>
                            {USER_TYPE_LABELS[user.role]}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{user.group}</td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleEdit(user)}
                            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Showing {(currentPage - 1) * itemsPerPage + 1}-
                    {Math.min(currentPage * itemsPerPage, filteredUsers.length)} of {filteredUsers.length} users
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
                    >
                      Previous
                    </button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum: number;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                            currentPage === pageNum
                              ? 'bg-green-500 text-white'
                              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </Card>
      </PageContent>

      {/* Create User Modal */}
      <Modal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} title="New User" size="lg">
        <div className="space-y-6">
          {/* User Type Selector */}
          <div className="flex space-x-2">
            {(['coach', 'player', 'parent'] as UserType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setUserType(type)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  form.userType === type
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {USER_TYPE_LABELS[type]}
              </button>
            ))}
          </div>

          {ui.error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl text-sm">
              {ui.error}
            </div>
          )}

          {ui.success && (
            <div className="p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 rounded-xl text-sm">
              {ui.success}
            </div>
          )}

          <form onSubmit={handleCreateSubmit} className="space-y-4">
            {/* Common Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">First Name *</label>
                <input
                  type="text"
                  value={form.firstName}
                  onChange={(e) => updateField('firstName', e.target.value)}
                  required
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Last Name *</label>
                <input
                  type="text"
                  value={form.lastName}
                  onChange={(e) => updateField('lastName', e.target.value)}
                  required
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  required
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Password *</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => updateField('password', e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Phone Number</label>
              <input
                type="tel"
                value={form.phoneNumber}
                onChange={(e) => updateField('phoneNumber', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 dark:bg-gray-800 dark:text-white"
              />
            </div>

            {/* Coach Fields */}
            {form.userType === 'coach' && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-4">
                <h4 className="font-medium text-gray-900 dark:text-white">Coach Details</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date of Birth *</label>
                    <input
                      type="date"
                      value={form.dateOfBirth}
                      onChange={(e) => updateField('dateOfBirth', e.target.value)}
                      required
                      className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">License Level *</label>
                    <select
                      value={form.licenseLevel}
                      onChange={(e) => updateField('licenseLevel', e.target.value)}
                      required
                      className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 dark:bg-gray-800 dark:text-white"
                    >
                      <option value="">Select level</option>
                      <option value="D">D License</option>
                      <option value="C">C License</option>
                      <option value="B">B License</option>
                      <option value="A">A License</option>
                      <option value="PRO">PRO License</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Experience (years) *</label>
                    <input
                      type="number"
                      value={form.experienceYears}
                      onChange={(e) => updateField('experienceYears', parseInt(e.target.value) || 0)}
                      required
                      min={0}
                      className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Player Fields */}
            {form.userType === 'player' && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-4">
                <h4 className="font-medium text-gray-900 dark:text-white">Player Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date of Birth *</label>
                    <input
                      type="date"
                      value={form.dateOfBirth}
                      onChange={(e) => updateField('dateOfBirth', e.target.value)}
                      required
                      className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Position *</label>
                    <select
                      value={form.position}
                      onChange={(e) => updateField('position', e.target.value as Position)}
                      required
                      className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 dark:bg-gray-800 dark:text-white"
                    >
                      <option value="">Select position</option>
                      {POSITIONS.map((pos) => (
                        <option key={pos} value={pos}>
                          {POSITION_LABELS[pos]}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Height (cm) *</label>
                    <input
                      type="number"
                      value={form.height}
                      onChange={(e) => updateField('height', parseInt(e.target.value) || 0)}
                      required
                      min={100}
                      max={250}
                      className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Weight (kg) *</label>
                    <input
                      type="number"
                      value={form.weight}
                      onChange={(e) => updateField('weight', parseInt(e.target.value) || 0)}
                      required
                      min={30}
                      max={150}
                      className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Strong Foot *</label>
                    <select
                      value={form.strongFoot}
                      onChange={(e) => updateField('strongFoot', e.target.value as StrongFoot)}
                      required
                      className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 dark:bg-gray-800 dark:text-white"
                    >
                      {STRONG_FEET.map((foot) => (
                        <option key={foot} value={foot}>
                          {STRONG_FOOT_LABELS[foot]}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Parent Fields */}
            {form.userType === 'parent' && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-4">Link to Players (Children)</h4>
                <PlayerSelector
                  isLoading={playerSelector.isLoading}
                  players={playerSelector.players}
                  filteredPlayers={playerSelector.filteredPlayers}
                  groups={playerSelector.groups}
                  birthYears={playerSelector.birthYears}
                  selectedIds={playerSelector.selectedIds}
                  filters={playerSelector.filters}
                  playersWithParentSelected={playerSelector.playersWithParentSelected}
                  onFilterChange={playerSelector.updateFilter}
                  onToggleSelection={playerSelector.toggleSelection}
                />
              </div>
            )}

            <div className="flex items-center gap-3 pt-4">
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={ui.isLoading}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold rounded-xl shadow-lg shadow-green-500/30 transition-all disabled:opacity-50"
              >
                {ui.isLoading ? 'Creating...' : `Create ${USER_TYPE_LABELS[form.userType]}`}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Edit User Modal */}
      <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} title="Edit User" size="md">
        {selectedUser && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar
                firstName={selectedUser.firstName}
                lastName={selectedUser.lastName}
                size="lg"
                className={`bg-gradient-to-br ${AVATAR_COLORS[selectedUser.role]}`}
              />
              <div>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {selectedUser.firstName} {selectedUser.lastName}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{selectedUser.email}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Role</label>
                <div className="flex items-center gap-2">
                  <Badge className={ROLE_COLORS[selectedUser.role]}>
                    {USER_TYPE_LABELS[selectedUser.role]}
                  </Badge>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Details</label>
                <p className="text-sm text-gray-600 dark:text-gray-400">{selectedUser.subtitle}</p>
              </div>

              {selectedUser.group !== '-' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Group</label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{selectedUser.group}</p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setDeleteConfirmOpen(true)}
                className="px-4 py-2.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 font-medium rounded-xl transition-colors"
              >
                Delete
              </button>
              <div className="flex-1"></div>
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="px-4 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        title="Delete User"
        message={`Are you sure you want to delete ${selectedUser?.firstName} ${selectedUser?.lastName}? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirmOpen(false)}
      />

      {/* Reassign Player Confirm Dialog */}
      <ConfirmDialog
        isOpen={playerSelector.confirmDialog.isOpen}
        title="Reassign Player"
        message={`${playerSelector.confirmDialog.playerName} is already linked to "${playerSelector.confirmDialog.parentName}".\n\nDo you want to reassign this player to the new parent?`}
        confirmLabel="Reassign"
        cancelLabel="Cancel"
        variant="warning"
        onConfirm={playerSelector.confirmReassign}
        onCancel={playerSelector.cancelReassign}
      />
    </>
  );
}
