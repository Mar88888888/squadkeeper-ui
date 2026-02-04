import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { groupsApi, type GroupInfo } from '../api/groups';
import { squadsApi, type Squad } from '../api/squads';
import { GAME_FORMAT_LABELS } from '../constants/squad.constants';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';
import { EmptyState, emptyStateIcons } from '../components/EmptyState';

export function SquadListPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [groups, setGroups] = useState<GroupInfo[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [squads, setSquads] = useState<Squad[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    squadId: string;
    squadName: string;
  }>({ isOpen: false, squadId: '', squadName: '' });
  const [duplicateDialog, setDuplicateDialog] = useState<{
    isOpen: boolean;
    squadId: string;
    newName: string;
  }>({ isOpen: false, squadId: '', newName: '' });

  useEffect(() => {
    const loadGroups = async () => {
      try {
        const data =
          user?.role === UserRole.ADMIN
            ? await groupsApi.getAll()
            : await groupsApi.getMy();
        setGroups(data);
        if (data.length > 0) {
          setSelectedGroupId(data[0].id);
        }
      } catch {
        setError('Failed to load groups');
      } finally {
        setIsLoading(false);
      }
    };
    loadGroups();
  }, [user?.role]);

  useEffect(() => {
    const loadSquads = async () => {
      if (!selectedGroupId) {
        setSquads([]);
        return;
      }

      setIsLoading(true);
      try {
        const data = await squadsApi.getByGroup(selectedGroupId);
        setSquads(data);
      } catch {
        setError('Failed to load squads');
      } finally {
        setIsLoading(false);
      }
    };
    loadSquads();
  }, [selectedGroupId]);

  const handleDelete = async () => {
    try {
      await squadsApi.delete(deleteDialog.squadId);
      setSquads((prev) => prev.filter((s) => s.id !== deleteDialog.squadId));
      setDeleteDialog({ isOpen: false, squadId: '', squadName: '' });
    } catch {
      setError('Failed to delete squad');
    }
  };

  const handleDuplicate = async () => {
    if (!duplicateDialog.newName.trim()) {
      setError('Please enter a name for the duplicate');
      return;
    }
    try {
      const newSquad = await squadsApi.duplicate(
        duplicateDialog.squadId,
        duplicateDialog.newName,
      );
      setSquads((prev) => [newSquad, ...prev]);
      setDuplicateDialog({ isOpen: false, squadId: '', newName: '' });
    } catch {
      setError('Failed to duplicate squad');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950">
      <header className="bg-white dark:bg-gray-900 shadow">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Squad Builder</h1>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/squads/new')}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 active:scale-95 transition-all"
            >
              + Create Squad
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-4 mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select Group
          </label>
          <select
            value={selectedGroupId}
            onChange={(e) => setSelectedGroupId(e.target.value)}
            className="w-full md:w-64 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-800 dark:text-gray-100"
          >
            <option value="">Select a group...</option>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name} ({group.players.length} players)
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-400 rounded-lg text-sm">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        ) : !selectedGroupId ? (
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow">
            <EmptyState
              icon={emptyStateIcons.group}
              title="Select a group"
              description="Choose a group from the dropdown above to view and manage squads."
            />
          </div>
        ) : squads.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow">
            <EmptyState
              icon={emptyStateIcons.squad}
              title="No squads created"
              description="Create your first squad to start planning your team formations."
              action={{ label: 'Create Squad', to: '/squads/new' }}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {squads.map((squad) => {
              const starterCount = squad.positions.filter((p) => p.isStarter).length;
              const filledCount = squad.positions.filter(
                (p) => p.isStarter && p.player,
              ).length;
              const benchCount = squad.positions.filter(
                (p) => !p.isStarter && p.player,
              ).length;

              return (
                <div
                  key={squad.id}
                  className="bg-white dark:bg-gray-900 rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden"
                >
                  <div className="bg-gradient-to-br from-green-500 to-green-600 p-4 text-white">
                    <h3 className="font-bold text-lg">{squad.name}</h3>
                    <p className="text-green-100 text-sm">
                      {GAME_FORMAT_LABELS[squad.gameFormat]}
                    </p>
                  </div>

                  <div className="p-4">
                    <div className="flex items-center justify-between text-sm mb-3">
                      <span className="text-gray-500 dark:text-gray-400">Players</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {filledCount}/{starterCount} starters
                        {benchCount > 0 && ` + ${benchCount} subs`}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1 mb-4">
                      {squad.positions
                        .filter((p) => p.player)
                        .slice(0, 6)
                        .map((pos) => (
                          <span
                            key={pos.id}
                            className="px-2 py-0.5 bg-gray-100 dark:bg-gray-950 text-gray-600 dark:text-gray-400 text-xs rounded"
                          >
                            {pos.player!.lastName}
                          </span>
                        ))}
                      {squad.positions.filter((p) => p.player).length > 6 && (
                        <span className="px-2 py-0.5 text-gray-400 dark:text-gray-500 text-xs">
                          +{squad.positions.filter((p) => p.player).length - 6} more
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-gray-400 dark:text-gray-500 mb-4">
                      {squad.createdBy && (
                        <span>
                          By {squad.createdBy.firstName} {squad.createdBy.lastName} •{' '}
                        </span>
                      )}
                      Updated {formatDate(squad.updatedAt)}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => navigate(`/squads/${squad.id}`)}
                        className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 active:scale-95 transition-all"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() =>
                          setDuplicateDialog({
                            isOpen: true,
                            squadId: squad.id,
                            newName: `${squad.name} (Copy)`,
                          })
                        }
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 text-sm rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        title="Duplicate"
                      >
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
                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() =>
                          setDeleteDialog({
                            isOpen: true,
                            squadId: squad.id,
                            squadName: squad.name,
                          })
                        }
                        className="px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Delete"
                      >
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
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        title="Delete Squad"
        message={`Are you sure you want to delete "${deleteDialog.squadName}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteDialog({ isOpen: false, squadId: '', squadName: '' })}
      />

      {duplicateDialog.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <h2 className="text-lg font-semibold tracking-tight text-gray-900 dark:text-gray-100 mb-4">
              Duplicate Squad
            </h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                New Squad Name
              </label>
              <input
                type="text"
                value={duplicateDialog.newName}
                onChange={(e) =>
                  setDuplicateDialog((prev) => ({ ...prev, newName: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-800 dark:text-gray-100"
              />
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() =>
                  setDuplicateDialog({ isOpen: false, squadId: '', newName: '' })
                }
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDuplicate}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 active:scale-95 transition-all"
              >
                Duplicate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
