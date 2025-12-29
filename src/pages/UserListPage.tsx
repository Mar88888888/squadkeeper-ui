import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { usersApi, type CoachInfo, type PlayerInfo, type ParentFullInfo, type GroupInfo } from '../api/users';
import { ConfirmDialog } from '../components/ConfirmDialog';

type TabType = 'coaches' | 'players' | 'parents';

export function UserListPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('coaches');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [coaches, setCoaches] = useState<CoachInfo[]>([]);
  const [players, setPlayers] = useState<PlayerInfo[]>([]);
  const [parents, setParents] = useState<ParentFullInfo[]>([]);
  const [groups, setGroups] = useState<GroupInfo[]>([]);

  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    type: TabType;
    id: string;
    name: string;
  }>({ isOpen: false, type: 'coaches', id: '', name: '' });

  const [linkChildModal, setLinkChildModal] = useState<{
    isOpen: boolean;
    parent: ParentFullInfo | null;
  }>({ isOpen: false, parent: null });

  const [reassignDialog, setReassignDialog] = useState<{
    isOpen: boolean;
    playerId: string;
    playerName: string;
    currentParentName: string;
  }>({ isOpen: false, playerId: '', playerName: '', currentParentName: '' });

  // Modal filters
  const [modalFilterName, setModalFilterName] = useState('');
  const [modalFilterYear, setModalFilterYear] = useState('');
  const [modalFilterGroupId, setModalFilterGroupId] = useState('');
  const [modalFilterNoParent, setModalFilterNoParent] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');

  const loadData = async (tab: TabType) => {
    setIsLoading(true);
    setError('');
    try {
      if (tab === 'coaches') {
        const data = await usersApi.getCoaches();
        setCoaches(data);
      } else if (tab === 'players') {
        const data = await usersApi.getPlayers();
        setPlayers(data);
      } else {
        const data = await usersApi.getParents();
        setParents(data);
      }
    } catch {
      setError('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData(activeTab);
  }, [activeTab]);

  const handleDelete = async () => {
    try {
      if (deleteDialog.type === 'coaches') {
        await usersApi.deleteCoach(deleteDialog.id);
        setCoaches((prev) => prev.filter((c) => c.id !== deleteDialog.id));
      } else if (deleteDialog.type === 'players') {
        await usersApi.deletePlayer(deleteDialog.id);
        setPlayers((prev) => prev.filter((p) => p.id !== deleteDialog.id));
      } else {
        await usersApi.deleteParent(deleteDialog.id);
        setParents((prev) => prev.filter((p) => p.id !== deleteDialog.id));
      }
      setDeleteDialog((prev) => ({ ...prev, isOpen: false }));
    } catch {
      setError('Failed to delete user');
      setDeleteDialog((prev) => ({ ...prev, isOpen: false }));
    }
  };

  const openDeleteDialog = (type: TabType, id: string, name: string) => {
    setDeleteDialog({ isOpen: true, type, id, name });
  };

  const openLinkChildModal = async (parent: ParentFullInfo) => {
    // Load players and groups if not already loaded
    if (players.length === 0) {
      try {
        const [playersData, groupsData] = await Promise.all([
          usersApi.getPlayers(),
          usersApi.getGroups(),
        ]);
        setPlayers(playersData);
        setGroups(groupsData);
      } catch {
        setError('Failed to load players');
        return;
      }
    }
    // Reset modal filters
    setModalFilterName('');
    setModalFilterYear('');
    setModalFilterGroupId('');
    setModalFilterNoParent(false);
    setLinkChildModal({ isOpen: true, parent });
  };

  const closeLinkChildModal = () => {
    setLinkChildModal({ isOpen: false, parent: null });
  };

  const handlePlayerClick = (player: PlayerInfo) => {
    // Check if player already has a different parent
    if (player.parent && player.parent.id !== linkChildModal.parent?.id) {
      setReassignDialog({
        isOpen: true,
        playerId: player.id,
        playerName: `${player.firstName} ${player.lastName}`,
        currentParentName: `${player.parent.firstName} ${player.parent.lastName}`,
      });
      return;
    }
    handleLinkChild(player.id);
  };

  const handleLinkChild = async (playerId: string) => {
    if (!linkChildModal.parent) return;
    try {
      const updatedParent = await usersApi.linkChildToParent(linkChildModal.parent.id, playerId);
      setParents((prev) =>
        prev.map((p) => (p.id === updatedParent.id ? updatedParent : p))
      );
      // Update player in local state to reflect new parent
      setPlayers((prev) =>
        prev.map((p) =>
          p.id === playerId
            ? { ...p, parent: { id: updatedParent.id, firstName: updatedParent.firstName, lastName: updatedParent.lastName } }
            : p
        )
      );
      closeLinkChildModal();
    } catch {
      setError('Failed to link child to parent');
    }
  };

  const handleConfirmReassign = async () => {
    await handleLinkChild(reassignDialog.playerId);
    setReassignDialog({ isOpen: false, playerId: '', playerName: '', currentParentName: '' });
  };

  const handleUnlinkChild = async (parentId: string, playerId: string) => {
    try {
      const updatedParent = await usersApi.unlinkChildFromParent(parentId, playerId);
      setParents((prev) =>
        prev.map((p) => (p.id === updatedParent.id ? updatedParent : p))
      );
      // Update player in local state
      setPlayers((prev) =>
        prev.map((p) => (p.id === playerId ? { ...p, parent: null } : p))
      );
    } catch {
      setError('Failed to unlink child from parent');
    }
  };

  // Get unique birth years from players
  const birthYears = useMemo(() => {
    const years = new Set<number>();
    players.forEach((p) => {
      const year = new Date(p.dateOfBirth).getFullYear();
      if (!isNaN(year)) years.add(year);
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [players]);

  // Filter players for modal (excluding already linked to this parent)
  const modalFilteredPlayers = useMemo(() => {
    if (!linkChildModal.parent) return [];
    const linkedChildIds = linkChildModal.parent.children.map((c) => c.id);

    return players.filter((player) => {
      // Exclude already linked children
      if (linkedChildIds.includes(player.id)) return false;

      const fullName = `${player.firstName} ${player.lastName}`.toLowerCase();
      const matchesName = !modalFilterName || fullName.includes(modalFilterName.toLowerCase());
      const playerYear = new Date(player.dateOfBirth).getFullYear().toString();
      const matchesYear = !modalFilterYear || playerYear === modalFilterYear;
      const matchesGroup = !modalFilterGroupId || player.group?.id === modalFilterGroupId;
      const matchesNoParent = !modalFilterNoParent || !player.parent;
      return matchesName && matchesYear && matchesGroup && matchesNoParent;
    });
  }, [players, linkChildModal.parent, modalFilterName, modalFilterYear, modalFilterGroupId, modalFilterNoParent]);

  const tabLabels: Record<TabType, string> = {
    coaches: 'Coaches',
    players: 'Players',
    parents: 'Parents',
  };

  // Filter by name
  const filterByName = <T extends { firstName: string; lastName: string }>(items: T[]) => {
    if (!searchQuery.trim()) return items;
    const query = searchQuery.toLowerCase();
    return items.filter(
      (item) =>
        item.firstName.toLowerCase().includes(query) ||
        item.lastName.toLowerCase().includes(query) ||
        `${item.firstName} ${item.lastName}`.toLowerCase().includes(query)
    );
  };

  const filteredCoaches = filterByName(coaches);
  const filteredPlayers = filterByName(players);
  const filteredParents = filterByName(parents);

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">User List</h1>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/admin/users')}
              className="text-green-600 hover:text-green-700 font-medium"
            >
              + Create User
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
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <div className="flex">
              {(['coaches', 'players', 'parents'] as TabType[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-4 text-sm font-medium transition-colors ${
                    activeTab === tab
                      ? 'border-b-2 border-green-600 text-green-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tabLabels[tab]}
                  <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-gray-100">
                    {tab === 'coaches'
                      ? filteredCoaches.length
                      : tab === 'players'
                        ? filteredPlayers.length
                        : filteredParents.length}
                  </span>
                </button>
              ))}
            </div>
          </div>

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
                placeholder="Search by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
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
          ) : (
            <div className="divide-y divide-gray-200">
              {/* Coaches List */}
              {activeTab === 'coaches' &&
                (filteredCoaches.length === 0 ? (
                  <div className="py-12 text-center text-gray-500">
                    {coaches.length === 0 ? 'No coaches found' : 'No coaches match your search'}
                  </div>
                ) : (
                  filteredCoaches.map((coach) => (
                    <div key={coach.id} className="p-4 hover:bg-gray-50 flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center select-none">
                            <span className="text-blue-600 font-medium">
                              {coach.firstName[0]}{coach.lastName[0]}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {coach.firstName} {coach.lastName}
                            </p>
                            <p className="text-sm text-gray-500">{coach.user.email}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right text-sm">
                          <p className="text-gray-600">License: {coach.licenseLevel}</p>
                          <p className="text-gray-500">{coach.experienceYears} years exp.</p>
                        </div>
                        <button
                          onClick={() => openDeleteDialog('coaches', coach.id, `${coach.firstName} ${coach.lastName}`)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete coach"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))
                ))}

              {/* Players List */}
              {activeTab === 'players' &&
                (filteredPlayers.length === 0 ? (
                  <div className="py-12 text-center text-gray-500">
                    {players.length === 0 ? 'No players found' : 'No players match your search'}
                  </div>
                ) : (
                  filteredPlayers.map((player) => (
                    <div key={player.id} className="p-4 hover:bg-gray-50 flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center select-none">
                            <span className="text-green-600 font-medium">
                              {player.firstName[0]}{player.lastName[0]}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {player.firstName} {player.lastName}
                            </p>
                            <p className="text-sm text-gray-500">{player.user.email}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right text-sm">
                          <p className="text-gray-600">{player.position}</p>
                          <p className="text-gray-500">
                            {new Date(player.dateOfBirth).getFullYear()}
                            {player.group && ` | ${player.group.name}`}
                          </p>
                        </div>
                        <button
                          onClick={() => openDeleteDialog('players', player.id, `${player.firstName} ${player.lastName}`)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete player"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))
                ))}

              {/* Parents List */}
              {activeTab === 'parents' &&
                (filteredParents.length === 0 ? (
                  <div className="py-12 text-center text-gray-500">
                    {parents.length === 0 ? 'No parents found' : 'No parents match your search'}
                  </div>
                ) : (
                  filteredParents.map((parent) => (
                    <div key={parent.id} className="p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center select-none">
                              <span className="text-orange-600 font-medium">
                                {parent.firstName[0]}{parent.lastName[0]}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {parent.firstName} {parent.lastName}
                              </p>
                              <p className="text-sm text-gray-500">{parent.user.email}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openLinkChildModal(parent)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Link child"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                          </button>
                          <button
                            onClick={() => openDeleteDialog('parents', parent.id, `${parent.firstName} ${parent.lastName}`)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete parent"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      {/* Children list */}
                      {parent.children.length > 0 && (
                        <div className="mt-3 ml-13 pl-10 border-l-2 border-gray-100">
                          <p className="text-xs text-gray-500 mb-2">Linked children:</p>
                          <div className="flex flex-wrap gap-2">
                            {parent.children.map((child) => (
                              <span
                                key={child.id}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 text-sm rounded-full"
                              >
                                {child.firstName} {child.lastName}
                                <button
                                  onClick={() => handleUnlinkChild(parent.id, child.id)}
                                  className="ml-1 p-0.5 hover:bg-green-100 rounded-full"
                                  title="Unlink child"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                ))}
            </div>
          )}
        </div>
      </main>

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        title="Delete User"
        message={`Are you sure you want to delete "${deleteDialog.name}"?\n\nThis action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteDialog((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Link Child Modal */}
      {linkChildModal.isOpen && linkChildModal.parent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 max-h-[85vh] flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Link Child to {linkChildModal.parent.firstName} {linkChildModal.parent.lastName}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Select a player to link as a child
              </p>
            </div>

            {/* Filters */}
            <div className="p-4 border-b border-gray-200 space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="Search by name..."
                  value={modalFilterName}
                  onChange={(e) => setModalFilterName(e.target.value)}
                  className="col-span-3 sm:col-span-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                />
                <select
                  value={modalFilterYear}
                  onChange={(e) => setModalFilterYear(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                >
                  <option value="">All years</option>
                  {birthYears.map((year) => (
                    <option key={year} value={year.toString()}>
                      {year}
                    </option>
                  ))}
                </select>
                <select
                  value={modalFilterGroupId}
                  onChange={(e) => setModalFilterGroupId(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                >
                  <option value="">All groups</option>
                  {groups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={modalFilterNoParent}
                  onChange={(e) => setModalFilterNoParent(e.target.checked)}
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <span className="text-sm text-gray-700">
                  Only players without a parent
                </span>
              </label>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {modalFilteredPlayers.length === 0 ? (
                <div className="py-8 text-center text-gray-500">
                  No available players to link
                </div>
              ) : (
                <div className="space-y-2">
                  {modalFilteredPlayers.map((player) => (
                    <button
                      key={player.id}
                      onClick={() => handlePlayerClick(player)}
                      className={`w-full p-3 flex items-center gap-3 rounded-lg transition-colors text-left ${
                        player.parent
                          ? 'bg-amber-50 hover:bg-amber-100 border border-amber-200'
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center select-none">
                        <span className="text-green-600 font-medium">
                          {player.firstName[0]}{player.lastName[0]}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900">
                            {player.firstName} {player.lastName}
                          </p>
                          {player.parent && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded">
                              Has parent
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">
                          {player.position} | {new Date(player.dateOfBirth).getFullYear()}
                          {player.group && ` | ${player.group.name}`}
                        </p>
                        {player.parent && (
                          <p className="text-xs text-amber-600 mt-0.5">
                            Current: {player.parent.firstName} {player.parent.lastName}
                          </p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-200">
              <button
                onClick={closeLinkChildModal}
                className="w-full px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reassign Confirm Dialog */}
      <ConfirmDialog
        isOpen={reassignDialog.isOpen}
        title="Reassign Player"
        message={`${reassignDialog.playerName} is already linked to "${reassignDialog.currentParentName}".\n\nDo you want to reassign this player to the new parent?`}
        confirmLabel="Reassign"
        cancelLabel="Cancel"
        variant="warning"
        onConfirm={handleConfirmReassign}
        onCancel={() => setReassignDialog({ isOpen: false, playerId: '', playerName: '', currentParentName: '' })}
      />
    </div>
  );
}
